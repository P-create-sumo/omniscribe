import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canChatWithExpert, fetchExpertSources, selectMatches } from '../../shared/expertRetrieval.ts';

const MAX_CONTEXT_CHARS = 60000;
const MAX_HISTORY_CHARS = 6000;
const MAX_QUESTION_CHARS = 2000;

function buildKnowledgeText(sources) {
  let text = sources
    .filter((s) => s.extracted_text)
    .map((s) => `--- ${s.title || 'Documento'} ---\n${s.extracted_text}`)
    .join('\n\n');
  if (text.length > MAX_CONTEXT_CHARS) {
    const perSource = Math.max(1, Math.floor(MAX_CONTEXT_CHARS / sources.length));
    text = sources
      .map((s) => `--- ${s.title || 'Documento'} ---\n${String(s.extracted_text || '').slice(0, perSource)}`)
      .join('\n\n');
  }
  return text.slice(0, MAX_CONTEXT_CHARS);
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const expert_id = body.expert_id;
    const question = String(body.question || '').trim().slice(0, MAX_QUESTION_CHARS);
    const history = String(body.history || '').slice(-MAX_HISTORY_CHARS);

    if (!expert_id || !question) {
      return Response.json({ error: 'expert_id e question obbligatori' }, { status: 400 });
    }

    const expert = await base44.asServiceRole.entities.Expert.get(expert_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!expert) return Response.json({ error: 'Esperto non trovato' }, { status: 404 });

    // Access is decided server-side, and the knowledge used for the answer always
    // comes from the expert's own sources — never from client-supplied text, so
    // the endpoint cannot be used as a generic LLM proxy on the app's credits.
    const allowed = await canChatWithExpert(base44, user, expert, {
      email: body.email,
      access_code: body.access_code,
    });
    if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sources = await fetchExpertSources(base44, expert);
    const { matches } = await selectMatches(base44, sources, question);
    const index = sources.map((s, i) => `[${i + 1}] ${s.title || 'Documento'}`).join('\n');
    const knowledge = matches
      .map((m) => `--- ${m.source_title} ---\n${m.excerpt}`)
      .join('\n\n');

    const prompt = `Sei "${expert.name}", un esperto di ${expert.discipline}. ${expert.description || ''}
${expert.tone_of_voice ? `Tono di voce: ${expert.tone_of_voice}.` : ''}
${expert.key_skills ? `Competenze chiave: ${expert.key_skills}.` : ''}

DOCUMENTI NELLA KNOWLEDGE BASE:
${index || 'Vedi i contenuti qui sotto.'}

CONTENUTO:
${knowledge || 'Nessun contenuto disponibile.'}

ISTRUZIONI:
- Rispondi SOLO in base alla knowledge base sopra
- Se l'informazione non è presente, dillo chiaramente
- Cita sempre il documento sorgente da cui derivi la risposta
- Sii approfondito e professionale
- Alla FINE della risposta aggiungi una riga nel formato ESATTO:
📚 Fonti: <titolo1>, <titolo2>
- Rispondi nella lingua dell'utente

--- CONVERSAZIONE ---
${history}

Utente: ${question}`;

    const answer = await base44.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ answer: String(answer || '') });
  } catch (error) {
    console.error('expertAnswer error', error?.message);
    return Response.json({ error: error?.message || 'Errore nella generazione della risposta' }, { status: 500 });
  }
}