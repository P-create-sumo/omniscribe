import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const MAX_ENTITY_FIELD_SIZE = 18000; // safe limit below the ~20K entity field cap

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { agent_id, title, type, file_url, extracted_text, extracted_text_uri, status, file_size, original_filename } = body;
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

    // If the extracted text exceeds the entity field limit and no file URI was
    // provided upstream (e.g. extractPdfText already stored it), store the full
    // text as a private file here and keep a truncated preview in the entity.
    let finalText = extracted_text || '';
    let finalTextUri = extracted_text_uri || undefined;

    if (finalText.length > MAX_ENTITY_FIELD_SIZE && !finalTextUri) {
      const blob = new Blob([finalText], { type: 'text/plain' });
      const file = new File([blob], 'extracted_text.txt', { type: 'text/plain' });
      const uploadResult = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
      finalTextUri = uploadResult.file_uri;
      finalText = finalText.slice(0, MAX_ENTITY_FIELD_SIZE);
    }

    // Create as the caller so created_by_id is stamped to the owner.
    const source = await base44.entities.KnowledgeSource.create({
      agent_id,
      title,
      type,
      file_url: file_url || undefined,
      extracted_text: finalText,
      extracted_text_uri: finalTextUri,
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