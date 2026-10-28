import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

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
  'dalle', 'dagli', 'dallo', 'non', 'una', 'uno', 'gli', 'hai', 'hai', 'puoi', 'vorrei', 'parlami',
  'parla', 'dimmi', 'spiega', 'spiegami', 'riassumi', 'riassunto', 'fammi', 'secondo', 'riguardo',
  'the', 'and', 'for', 'with', 'about', 'what', 'how', 'this', 'that', 'summarize', 'tell', 'explain',
]);

function fold(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenize(value) {
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
  if (text.length > 400 || !source.extracted_text_uri) return text;
  try {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: source.extracted_text_uri,
      expires_in: 120,
    });
    const resp = await fetch(signed_url, { signal: AbortSignal.timeout(20000) });
    if (resp.ok) text = await resp.text();
  } catch (error) {
    console.error('expertKnowledge: full text fetch failed', source.id, error?.message);
  }
  return text;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const expert_id = body.expert_id;
    const question = String(body.question || '').trim();

    if (!expert_id) return Response.json({ error: 'expert_id obbligatorio' }, { status: 400 });

    const expert = await base44.entities.Expert.get(expert_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!expert) return Response.json({ error: 'Esperto non trovato' }, { status: 404 });

    const { items: sources } = await base44.entities.KnowledgeSource.filter(
      { agent_id: expert_id },
      { sort: '-created_date', limit: MAX_SOURCES },
    );

    if (!sources || sources.length === 0) {
      return Response.json({
        expert: { id: expert.id, name: expert.name },
        sources: [],
        matches: [],
        note: "Questo Esperto non ha nessuna fonte nella knowledge base.",
      });
    }

    const questionTokens = tokenize(question);
    const phrase = fold(question).trim();

    // Gather every chunk once, then weight tokens by rarity (IDF) so specific
    // terms beat common ones (e.g. "bottega" over "digitale").
    const allChunks = [];
    let uriFetched = 0;
    for (const source of sources) {
      let text = source.extracted_text || '';
      if (text.length < 400 && source.extracted_text_uri && uriFetched < MAX_URI_SOURCES) {
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

    let matches = scored.slice(0, MAX_EXCERPTS).map((m) => ({
      source_title: m.source_title,
      excerpt: m.excerpt,
    }));

    if (matches.length === 0) {
      // Nothing matched the wording: give the model a bounded opening excerpt of
      // the most recent sources so it can still orient itself, flagged as fallback.
      matches = sources.slice(0, 3).map((s) => ({
        source_title: s.title || 'Documento',
        excerpt: String(s.extracted_text || '').replace(/\s+/g, ' ').slice(0, 900),
      })).filter((m) => m.excerpt.trim().length > 0);
      return Response.json({
        expert: { id: expert.id, name: expert.name },
        sources: sources.map((s) => ({ title: s.title || 'Documento', chars: (s.extracted_text || '').length })),
        matches,
        fallback: true,
        note: 'Nessun passaggio corrisponde alla domanda: excerpt iniziali delle fonti più recenti. Se non bastano, dillo all utente invece di inventare.',
      });
    }

    return Response.json({
      expert: { id: expert.id, name: expert.name },
      sources: sources.map((s) => ({ title: s.title || 'Documento', chars: (s.extracted_text || '').length })),
      matches,
      total_sources: sources.length,
    });
  } catch (error) {
    console.error('expertKnowledge error', error?.message);
    return Response.json({ error: error?.message || 'Errore nel recupero della conoscenza' }, { status: 500 });
  }
}