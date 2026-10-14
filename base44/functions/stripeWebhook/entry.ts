import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import Stripe from 'npm:stripe@17.0.0';

const SUBSCRIPTION_GRACE_DAYS = 35; // ~1 month + buffer

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const stripeKey = secrets.get('STRIPE_SECRET_KEY');
    const webhookSecret = secrets.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey || !webhookSecret) {
      console.error('stripeWebhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
      return Response.json({ error: 'Configurazione Stripe mancante' }, { status: 500 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) return Response.json({ error: 'Firma mancante' }, { status: 400 });

    const body = await req.text();

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-10-29.clover' as any });

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('stripeWebhook: signature verification failed:', err.message);
      return Response.json({ error: 'Firma non valida' }, { status: 400 });
    }

    // Skip Base44 merchant self-test charges
    const metadata = (event.data.object as any)?.metadata || {};
    if (metadata.base44_test_checkout === 'true' &&
        (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded')) {
      return Response.json({ received: true, skipped: 'test_checkout' });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { expert_id, buyer_email, seller_id, expert_name } = session.metadata || {};
        if (!expert_id || !buyer_email) break;

        // Idempotency: skip if a Purchase already exists for this session
        const existing = await base44.asServiceRole.entities.Purchase.filter({
          stripe_session_id: session.id,
        });
        if (existing && existing.length > 0) break;

        const isSubscription = session.mode === 'subscription';
        const amountEur = session.amount_total ? session.amount_total / 100 : 0;

        await base44.asServiceRole.entities.Purchase.create({
          expert_id,
          expert_name: expert_name || '',
          seller_id: seller_id || '',
          buyer_email,
          buyer_user_id: null,
          type: isSubscription ? 'subscription' : 'one_time',
          amount: amountEur,
          currency: session.currency || 'eur',
          status: isSubscription ? 'active' : 'paid',
          stripe_session_id: session.id,
          stripe_subscription_id: session.subscription || null,
          stripe_customer_id: session.customer || null,
          expires_at: isSubscription
            ? new Date(Date.now() + SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString()
            : null,
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const purchases = await base44.asServiceRole.entities.Purchase.filter({
          stripe_subscription_id: subscriptionId,
        });
        if (purchases && purchases.length > 0) {
          await base44.asServiceRole.entities.Purchase.update(purchases[0].id, {
            status: 'active',
            expires_at: new Date(Date.now() + SUBSCRIPTION_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const purchases = await base44.asServiceRole.entities.Purchase.filter({
          stripe_subscription_id: subscription.id,
        });
        if (purchases && purchases.length > 0) {
          await base44.asServiceRole.entities.Purchase.update(purchases[0].id, {
            status: 'cancelled',
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('stripeWebhook error:', error);
    return Response.json({ error: error.message || 'Errore webhook' }, { status: 500 });
  }
}