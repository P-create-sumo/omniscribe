import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const STRIPE_API = 'https://api.stripe.com/v1';
const STRIPE_VERSION = '2025-10-29.clover';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { expert_id, buyer_email } = await req.json();

    const EMAIL_RE = /^[^@\s]{1,64}@[^@\s.]{1,255}\.[^@\s]{2,24}$/;
    if (!expert_id || typeof buyer_email !== 'string' || !EMAIL_RE.test(buyer_email.trim())) {
      return Response.json({ error: 'expert_id e buyer_email validi sono obbligatori' }, { status: 400 });
    }

    // Public app — no login required. Use service role to look up the expert.
    const list = await base44.asServiceRole.entities.Expert.filter({ id: expert_id, is_public: true });
    const expert = list && list[0];
    if (!expert) return Response.json({ error: 'Esperto non trovato o non pubblico' }, { status: 404 });

    if (!expert.monetization_type || expert.monetization_type === 'free') {
      return Response.json({ error: 'Questo Esperto è gratuito' }, { status: 400 });
    }

    const appUrl = req.headers.get('X-Base44-App-Url');
    if (!appUrl) return Response.json({ error: 'App URL non disponibile' }, { status: 500 });

    const stripeKey = secrets.get('STRIPE_SECRET_KEY');
    const appId = Deno.env.get('BASE44_APP_ID') || '';
    const isSubscription = expert.monetization_type === 'subscription';
    const amountCents = String(Math.round((expert.price || 0) * 100));

    // --- Create or reuse Stripe Product ---
    let productId = expert.stripe_product_id;
    if (!productId) {
      const productRes = await fetch(`${STRIPE_API}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Stripe-Version': STRIPE_VERSION,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: new URLSearchParams({
          'name': expert.name,
          'metadata[base44_app_id]': appId,
          'metadata[expert_id]': expert_id,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!productRes.ok) {
        const err = await productRes.json();
        console.error('Stripe product error:', err);
        return Response.json({ error: err.error?.message || 'Errore creazione prodotto Stripe' }, { status: 502 });
      }
      const product = await productRes.json();
      productId = product.id;
    }

    // --- Create or reuse Stripe Price ---
    // If a price exists, check whether the amount still matches the expert's
    // current price. If it changed, create a new price and archive the old one.
    let priceId = expert.stripe_price_id;
    if (priceId) {
      const priceCheckRes = await fetch(`${STRIPE_API}/prices/${priceId}`, {
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Stripe-Version': STRIPE_VERSION,
        },
        signal: AbortSignal.timeout(15000),
      });
      if (priceCheckRes.ok) {
        const existingPrice = await priceCheckRes.json();
        if (String(existingPrice.unit_amount) !== amountCents) {
          // Archive old price, create new one
          await fetch(`${STRIPE_API}/prices/${priceId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Stripe-Version': STRIPE_VERSION,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ 'active': 'false' }),
            signal: AbortSignal.timeout(15000),
          });
          priceId = null; // force creation below
        }
      } else {
        priceId = null; // price was deleted, recreate
      }
    }

    if (!priceId) {
      const priceParams = new URLSearchParams({
        'product': productId,
        'currency': 'eur',
        'unit_amount': amountCents,
        'metadata[base44_app_id]': appId,
        'metadata[expert_id]': expert_id,
      });
      if (isSubscription) {
        priceParams.append('recurring[interval]', 'month');
      }
      const priceRes = await fetch(`${STRIPE_API}/prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Stripe-Version': STRIPE_VERSION,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: priceParams,
        signal: AbortSignal.timeout(15000),
      });
      if (!priceRes.ok) {
        const err = await priceRes.json();
        console.error('Stripe price error:', err);
        return Response.json({ error: err.error?.message || 'Errore creazione prezzo Stripe' }, { status: 502 });
      }
      const price = await priceRes.json();
      priceId = price.id;

      // Persist product and price IDs on the expert
      await base44.asServiceRole.entities.Expert.update(expert_id, {
        stripe_product_id: productId,
        stripe_price_id: priceId,
      });
    }

    // --- Create Checkout Session ---
    const sessionParams = new URLSearchParams({
      'mode': isSubscription ? 'subscription' : 'payment',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${appUrl}/e/${expert.slug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${appUrl}/e/${expert.slug}?payment=cancelled`,
      'customer_email': buyer_email,
      'metadata[base44_app_id]': appId,
      'metadata[expert_id]': expert_id,
      'metadata[buyer_email]': buyer_email,
      'metadata[seller_id]': expert.created_by_id || '',
      'metadata[expert_name]': expert.name || '',
    });

    if (isSubscription) {
      sessionParams.append('subscription_data[metadata][base44_app_id]', appId);
      sessionParams.append('subscription_data[metadata][expert_id]', expert_id);
      sessionParams.append('subscription_data[metadata][buyer_email]', buyer_email);
      sessionParams.append('subscription_data[metadata][seller_id]', expert.created_by_id || '');
      sessionParams.append('subscription_data[metadata][expert_name]', expert.name || '');
    }

    const sessionRes = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Stripe-Version': STRIPE_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: sessionParams,
      signal: AbortSignal.timeout(15000),
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.json();
      console.error('Stripe checkout session error:', err);
      return Response.json({ error: err.error?.message || 'Errore creazione sessione di pagamento' }, { status: 502 });
    }

    const session = await sessionRes.json();
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('createCheckoutSession error:', error);
    return Response.json({ error: error.message || 'Errore durante la creazione del pagamento' }, { status: 500 });
  }
}