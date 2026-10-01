import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;

const attempts = new Map();
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function registerFailure(ip, slug) {
  const key = `${ip}|${slug}`;
  const now = Date.now();
  let entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    entry = { count: 1, firstAt: now };
    attempts.set(key, entry);
  } else {
    entry.count += 1;
  }
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) {
      if (now - v.firstAt > WINDOW_MS) attempts.delete(k);
    }
  }
  return entry.count <= MAX_ATTEMPTS;
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(String(a));
  const bb = enc.encode(String(b));
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

function stripCode(expert) {
  const { access_code, ...rest } = expert;
  return rest;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { slug, access_code, email } = await req.json();
    if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

    const list = await base44.asServiceRole.entities.Expert.filter({ slug });
    const expert = list && list[0];
    if (!expert) return Response.json({ error: 'not_found' }, { status: 404 });

    const accessRequired = !!expert.access_code;
    const emailGate = !!expert.email_gate;

    let codeValid = false;
    let codeError = false;
    let rateLimited = false;
    let emailRequired = false;
    let accessGranted = false;

    if (accessRequired) {
      const submitted = typeof access_code === 'string' ? access_code : '';
      if (submitted === '') {
        // No code submitted yet — show the gate without an error.
      } else if (timingSafeEqual(submitted, expert.access_code)) {
        codeValid = true;
      } else {
        const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
        if (!registerFailure(ip, slug)) {
          rateLimited = true;
        } else {
          codeError = true;
        }
      }
    } else {
      codeValid = true;
    }

    if (codeValid && !rateLimited) {
      if (emailGate) {
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
      sources = await Promise.all(raw.map(async (s) => {
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
      sources,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});