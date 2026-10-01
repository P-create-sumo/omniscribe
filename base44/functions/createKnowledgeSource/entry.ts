import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { agent_id, title, type, file_url, extracted_text, status, file_size, original_filename } = body;
    if (!agent_id || !title || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that the caller owns the target Expert — prevents injecting
    // knowledge sources into another user's (public) Expert.
    let expert;
    try {
      expert = await base44.asServiceRole.entities.Expert.get(agent_id);
    } catch {
      return Response.json({ error: 'Expert not found' }, { status: 404 });
    }
    if (expert.created_by_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create as the caller so created_by_id is stamped to the owner.
    const source = await base44.entities.KnowledgeSource.create({
      agent_id,
      title,
      type,
      file_url: file_url || undefined,
      extracted_text: extracted_text || '',
      status: status || 'ready',
      file_size: file_size || '',
      original_filename: original_filename || '',
    });

    // Refresh the expert's sources_count (user-scoped read returns the owner's sources).
    const sources = await base44.entities.KnowledgeSource.filter({ agent_id });
    await base44.entities.Expert.update(agent_id, { sources_count: sources.length, status: 'active' });

    return Response.json({ source, sources_count: sources.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});