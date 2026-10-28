import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const key = secrets.get('STRIPE_SECRET_KEY');
    if (!key) {
      return Response.json({ connected: false, error: 'Stripe non configurato' });
    }

    const resp = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        Authorization: `Bearer ${key}`,
        'Stripe-Version': '2025-10-29.clover',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      console.error('stripeAccountStatus failed', resp.status, body?.error?.message);
      return Response.json({ connected: false, error: body?.error?.message || 'Stripe non raggiungibile' });
    }

    const account = await resp.json();

    return Response.json({
      connected: true,
      mode: key.startsWith('sk_live') ? 'live' : 'test',
      charges_enabled: !!account.charges_enabled,
      payouts_enabled: !!account.payouts_enabled,
      country: account.country || null,
      currency: (account.default_currency || '').toUpperCase() || null,
      business_name: account.business_profile?.name || account.settings?.dashboard?.display_name || null,
    });
  } catch (error) {
    console.error('stripeAccountStatus error', error?.message);
    return Response.json({ connected: false, error: error?.message || 'Errore Stripe' }, { status: 500 });
  }
}