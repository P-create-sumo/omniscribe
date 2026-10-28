import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.8.1';

const MAX_ENTITY_FIELD_SIZE = 18000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { source_id } = await req.json().catch(() => ({}));
    if (!source_id) return Response.json({ error: 'source_id obbligatorio' }, { status: 400 });

    const source = await base44.entities.KnowledgeSource.get(source_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!source) return Response.json({ error: 'Fonte non trovata' }, { status: 404 });
    if (!source.file_url) {
      return Response.json({ error: 'Questa fonte non ha un file da riprocessare' }, { status: 400 });
    }

    await base44.entities.KnowledgeSource.update(source_id, { status: 'processing' });

    let downloadUrl = source.file_url;
    if (!downloadUrl.startsWith('http')) {
      const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: source.file_url,
        expires_in: 600,
      });
      downloadUrl = signed_url;
    }

    let text = '';
    const type = source.type;

    if (type === 'pdf') {
      const resp = await fetch(downloadUrl, { signal: AbortSignal.timeout(120000) });
      if (!resp.ok) throw new Error('Download del file fallito');
      const pdf = await getDocumentProxy(new Uint8Array(await resp.arrayBuffer()));
      const extracted = await extractText(pdf, { mergePages: true });
      text = extracted.text || '';
    } else if (type === 'audio' || type === 'video') {
      text = await base44.integrations.Core.TranscribeAudio({ audio_url: downloadUrl });
    } else if (type === 'doc') {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: downloadUrl,
        json_schema: {
          type: 'object',
          properties: { full_text: { type: 'string', description: 'The complete text content of the document' } },
        },
      });
      if (result?.status === 'error') throw new Error(result?.details || 'Estrazione fallita');
      text = result?.output?.full_text || '';
    } else {
      const resp = await fetch(downloadUrl, { signal: AbortSignal.timeout(60000) });
      text = await resp.text();
    }

    text = String(text || '').trim();
    if (!text) {
      await base44.entities.KnowledgeSource.update(source_id, { status: 'error' });
      return Response.json(
        { error: 'Nessun testo estraibile: il file potrebbe essere scansito, protetto o vuoto.' },
        { status: 422 },
      );
    }

    let extracted_text_uri = '';
    let preview = text;
    if (text.length > MAX_ENTITY_FIELD_SIZE) {
      const file = new File([new Blob([text], { type: 'text/plain' })], 'extracted_text.txt', { type: 'text/plain' });
      const { file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });
      extracted_text_uri = file_uri;
      preview = text.slice(0, MAX_ENTITY_FIELD_SIZE);
    }

    await base44.entities.KnowledgeSource.update(source_id, {
      extracted_text: preview,
      extracted_text_uri,
      status: 'ready',
    });

    return Response.json({ ok: true, chars: text.length, extracted_text_uri: extracted_text_uri || null });
  } catch (error) {
    console.error('reprocessKnowledgeSource error', error?.message);
    return Response.json({ error: error?.message || 'Errore durante il riprocessamento' }, { status: 500 });
  }
}