import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { canUseExpertContent, fetchExpertSources, selectMatches } from '../../shared/expertRetrieval.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const expert_id = body.expert_id;
    const question = String(body.question || '').trim();

    if (!expert_id) return Response.json({ error: 'expert_id obbligatorio' }, { status: 400 });

    const expert = await base44.asServiceRole.entities.Expert.get(expert_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!expert) return Response.json({ error: 'Esperto non trovato' }, { status: 404 });

    if (!canUseExpertContent(user, expert)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sources = await fetchExpertSources(base44, expert);

    if (sources.length === 0) {
      return Response.json({
        expert: { id: expert.id, name: expert.name },
        sources: [],
        matches: [],
        note: "Questo Esperto non ha nessuna fonte nella knowledge base.",
      });
    }

    const { matches, fallback } = await selectMatches(base44, sources, question);
    const summary = sources.map((s) => ({ title: s.title || 'Documento', chars: (s.extracted_text || '').length }));

    if (fallback) {
      return Response.json({
        expert: { id: expert.id, name: expert.name },
        sources: summary,
        matches,
        fallback: true,
        note: 'Nessun passaggio corrisponde alla domanda: excerpt iniziali delle fonti più recenti. Se non bastano, dillo all utente invece di inventare.',
      });
    }

    return Response.json({
      expert: { id: expert.id, name: expert.name },
      sources: summary,
      matches,
      total_sources: sources.length,
    });
  } catch (error) {
    console.error('expertKnowledge error', error?.message);
    return Response.json({ error: error?.message || 'Errore nel recupero della conoscenza' }, { status: 500 });
  }
}