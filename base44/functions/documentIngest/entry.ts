import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const FILE_URI_RE = /^[A-Za-z0-9][A-Za-z0-9/_.-]{3,300}$/;

// Turns an uploaded document (audio/video/doc) into text server-side, so the
// transcription/extraction integrations are never called from the browser.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const file_uri = String(body.file_uri || '');
    const type = String(body.type || '');

    if (!FILE_URI_RE.test(file_uri) || file_uri.includes('://')) {
      return Response.json({ error: 'file_uri non valido' }, { status: 400 });
    }
    if (!['audio', 'video', 'doc'].includes(type)) {
      return Response.json({ error: 'type non supportato' }, { status: 400 });
    }

    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 600,
    });

    let text = '';

    if (type === 'audio' || type === 'video') {
      text = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url: signed_url });
    } else {
      const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed_url,
        json_schema: {
          type: 'object',
          properties: { full_text: { type: 'string', description: 'The complete text content of the document' } },
        },
      });
      if (result?.status === 'error') {
        return Response.json({ error: result?.details || 'Estrazione del testo fallita' }, { status: 422 });
      }
      text = result?.output?.full_text || '';
    }

    text = String(text || '').trim();
    if (!text) {
      return Response.json({ error: 'Nessun testo estraibile dal file.' }, { status: 422 });
    }

    return Response.json({ text });
  } catch (error) {
    console.error('documentIngest error', error?.message);
    return Response.json({ error: error?.message || 'Errore durante la lettura del file' }, { status: 500 });
  }
}