import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import {
  hasPaidAccessToExpert,
  registerAccessCodeFailure,
  timingSafeEqual,
} from '../../shared/expertRetrieval.ts';

// Attempt counting lives in shared/expertRetrieval.ts so the public gate and
// the chat endpoint spend the same failure budget.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function stripCode(expert) {
  const { access_code, ...rest } = expert;
  return rest;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { slug, access_code, email } = await req.json();
    if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

    const list = await base44.asServiceRole.entities.Expert.filter({ slug, is_public: true });
    const expert = list && list[0];
    if (!expert) return Response.json({ error: 'not_found' }, { status: 404 });

    const accessRequired = !!expert.access_code;
    const emailGate = !!expert.email_gate;

    let codeValid = false;
    let codeError = false;
    let rateLimited = false;
    let emailRequired = false;
    let accessGranted = false;
    let paymentRequired = false;
    let loginRequired = false;
    const monetizationType = expert.monetization_type || 'free';

    if (accessRequired) {
      const submitted = typeof access_code === 'string' ? access_code : '';
      if (submitted === '') {
        // No code submitted yet — show the gate without an error.
      } else if (timingSafeEqual(submitted, expert.access_code)) {
        codeValid = true;
      } else {
        const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
        // Same failure budget as the chat path, keyed on the expert id there too.
        if (!registerAccessCodeFailure(ip, expert.id)) {
          rateLimited = true;
        } else {
          codeError = true;
        }
      }
    } else {
      codeValid = true;
    }

    if (codeValid && !rateLimited) {
      if (monetizationType !== 'free') {
        // Paid access is decided from the signed-in account that bought the
        // expert; an email typed into the page proves nothing.
        const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
        if (await hasPaidAccessToExpert(base44, expert, user)) {
          accessGranted = true;
        } else {
          paymentRequired = true;
          loginRequired = !user;
        }
      } else if (emailGate) {
        const submittedEmail = typeof email === 'string' ? email.trim() : '';
        if (EMAIL_RE.test(submittedEmail)) {
          accessGranted = true;
        } else {
          emailRequired = true;
        }
      } else {
        accessGranted = true;
      }
    }

    let sources = [];
    if (accessGranted) {
      const raw = await base44.asServiceRole.entities.KnowledgeSource.filter({ agent_id: expert.id });
      // Exclude sources not created by the expert owner — prevents cross-user
      // injection of content into a publicly served knowledge base.
      const owned = raw.filter((s) => s.created_by_id === expert.created_by_id);
      sources = await Promise.all(owned.map(async (s) => {
        if (s.file_url && !String(s.file_url).startsWith('http')) {
          try {
            const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: s.file_url, expires_in: 300 });
            return { ...s, file_url: signed_url };
          } catch {
            return { ...s, file_url: null };
          }
        }
        return s;
      }));
    }

    return Response.json({
      expert: stripCode(expert),
      accessRequired,
      emailGate,
      accessGranted,
      codeError,
      emailRequired,
      rateLimited,
      paymentRequired,
      loginRequired,
      monetizationType,
      price: expert.price || 0,
      sources,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});