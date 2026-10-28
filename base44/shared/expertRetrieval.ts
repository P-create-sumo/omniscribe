// Shared retrieval + access helpers for expert knowledge.
// Used by expertKnowledge (context API) and expertAnswer (LLM answers).

export const MAX_ENTITY_FIELD_SIZE = 18000;

const MAX_EXCERPTS = 5;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;
const MAX_SOURCES = 200;
const MAX_URI_SOURCES = 20;

const STOPWORDS = new Set([
  'che', 'chi', 'cui', 'del', 'della', 'delle', 'dei', 'degli', 'dello', 'con', 'per', 'tra', 'fra',
  'sono', 'essere', 'come', 'cosa', 'quando', 'dove', 'quale', 'quali', 'quanto', 'perche', 'anche',
  'piu', 'meno', 'molto', 'poco', 'questo', 'questa', 'questi', 'queste', 'quello', 'quella',
  'mio', 'mia', 'tuo', 'tua', 'suo', 'sua', 'loro', 'gli', 'alla', 'alle', 'allo', 'agli', 'nel',
  'nella', 'nelle', 'negli', 'nello', 'sul', 'sulla', 'sulle', 'sugli', 'sullo', 'dal', 'dalla',
  'dalle', 'dagli', 'dallo', 'non', 'una', 'uno', 'hai', 'puoi', 'vorrei', 'parlami',
  'parla', 'dimmi', 'spiega', 'spiegami', 'riassumi', 'riassunto', 'fammi', 'secondo', 'riguardo',
  'the', 'and', 'for', 'with', 'about', 'what', 'how', 'this', 'that', 'summarize', 'tell', 'explain',
]);

export function fold(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function tokenize(value) {
  return fold(value)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function chunkText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_SIZE) return [clean];
  const chunks = [];
  for (let start = 0; start < clean.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    chunks.push(clean.slice(start, start + CHUNK_SIZE));
    if (start + CHUNK_SIZE >= clean.length) break;
  }
  return chunks;
}

async function resolveSourceText(base44, source) {
  let text = source.extracted_text || '';
  if (!source.extracted_text_uri) return text;
  try {
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri: source.extracted_text_uri,
      expires_in: 120,
    });
    const resp = await fetch(signed_url, { signal: AbortSignal.timeout(20000), redirect: 'manual' });
    if (resp.ok) text = await resp.text();
  } catch (error) {
    console.error('expertRetrieval: full text fetch failed', source.id, error?.message);
  }
  return text;
}

// Sources of an expert, read with the service role and limited to the expert
// owner's own uploads (no cross-user injection into a served knowledge base).
export async function fetchExpertSources(base44, expert) {
  const { items } = await base44.asServiceRole.entities.KnowledgeSource.filter(
    { agent_id: expert.id },
    { sort: '-created_date', limit: MAX_SOURCES },
  );
  return (items || []).filter((s) => s.created_by_id === expert.created_by_id);
}

// Who may read an expert's knowledge base: the owner, an admin, or anyone when
// the expert is publicly shared, free and not protected by an access code.
export function canUseExpertContent(user, expert) {
  if (!expert) return false;
  if (user && (expert.created_by_id === user.id || user.role === 'admin')) return true;
  if (!expert.is_public) return false;
  if (expert.access_code) return false;
  const type = expert.monetization_type || 'free';
  return type === 'free';
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ab = enc.encode(String(a));
  const bb = enc.encode(String(b));
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

// Who may consume an Expert's AI answers: decided server-side only. Owner,
// admin and public free experts; for gated or paid public experts the visitor's
// code must match and a paid expert needs a verified purchase for that email.
export async function canChatWithExpert(base44, user, expert, options = {}) {
  if (canUseExpertContent(user, expert)) return true;
  if (!expert.is_public) return false;

  const code = typeof options.access_code === 'string' ? options.access_code : '';
  if (expert.access_code && !timingSafeEqual(code, expert.access_code)) return false;

  const type = expert.monetization_type || 'free';
  const needsEmail = !!expert.email_gate || type !== 'free';
  if (!needsEmail) return true;

  const email = typeof options.email === 'string' ? options.email.trim() : '';
  if (!EMAIL_RE.test(email)) return false;
  if (type === 'free') return true;

  const { items } = await base44.asServiceRole.entities.Purchase.filter({
    expert_id: expert.id,
    buyer_email: email,
  });
  const now = new Date();
  return (items || []).some((p) => {
    if (type === 'one_time') return p.status === 'paid';
    return p.status === 'active' && (!p.expires_at || new Date(p.expires_at) > now);
  });
}

export async function selectMatches(base44, sources, question) {
  const questionTokens = tokenize(question);
  const phrase = fold(question).trim();

  const allChunks = [];
  let uriFetched = 0;
  for (const source of sources) {
    let text = source.extracted_text || '';
    if (source.extracted_text_uri && uriFetched < MAX_URI_SOURCES) {
      uriFetched++;
      text = await resolveSourceText(base44, source);
    }
    const title = fold(source.title || '');
    for (const chunk of chunkText(text)) {
      allChunks.push({ source_title: source.title || 'Documento', excerpt: chunk, folded: fold(chunk), title });
    }
  }

  const df = new Map();
  for (const c of allChunks) {
    const seen = new Set();
    for (const token of questionTokens) {
      if (c.folded.includes(token) && !seen.has(token)) {
        seen.add(token);
        df.set(token, (df.get(token) || 0) + 1);
      }
    }
  }
  const totalChunks = allChunks.length || 1;
  const idf = (token) => Math.log(1 + totalChunks / (1 + (df.get(token) || 0)));

  const scored = [];
  for (const c of allChunks) {
    let score = 0;
    for (const token of questionTokens) {
      const hits = c.folded.split(token).length - 1;
      if (hits > 0) score += idf(token) * (1 + Math.log(hits));
      if (c.title.includes(token)) score += 2 * idf(token);
    }
    if (phrase.length > 8 && c.folded.includes(phrase)) score += 20;
    if (score > 0) scored.push({ source_title: c.source_title, excerpt: c.excerpt, score });
  }

  scored.sort((a, b) => b.score - a.score);

  const matches = scored.slice(0, MAX_EXCERPTS).map((m) => ({
    source_title: m.source_title,
    excerpt: m.excerpt,
  }));

  if (matches.length === 0) {
    const fallback = sources.slice(0, 3).map((s) => ({
      source_title: s.title || 'Documento',
      excerpt: String(s.extracted_text || '').replace(/\s+/g, ' ').slice(0, 900),
    })).filter((m) => m.excerpt.trim().length > 0);
    return { matches: fallback, fallback: true };
  }

  return { matches, fallback: false };
}