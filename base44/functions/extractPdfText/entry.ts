import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.8.1';

const MAX_ENTITY_FIELD_SIZE = 18000; // safe limit below the ~20K entity field cap

// A signed storage URL is only ever followed when it is a plain public https
// address: no localhost, private IP literals or internal hosts (SSRF guard).
function isFetchableUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return false;
  return host.includes('.');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const file_uri = body.file_uri;
    const signed_url = body.signed_url;

    let downloadUrl = null;
    if (file_uri) {
      // Preferred path: storage path -> signed URL generated server-side, so the
      // platform's app-ownership validation applies.
      const { signed_url: generated } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: 300,
      });
      downloadUrl = generated;
    } else if (signed_url) {
      if (!isFetchableUrl(signed_url)) {
        return Response.json({ error: 'signed_url non valido' }, { status: 400 });
      }
      downloadUrl = signed_url;
    } else {
      return Response.json({ error: 'file_uri o signed_url obbligatorio' }, { status: 400 });
    }

    const resp = await fetch(downloadUrl, { signal: AbortSignal.timeout(120000) });
    if (!resp.ok) {
      console.error('extractPdfText download failed', resp.status, downloadUrl.split('?')[0]);
      return Response.json({ error: 'Download del file fallito' }, { status: 502 });
    }

    const buffer = await resp.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || !text.trim()) {
      return Response.json({
        error: 'Impossibile estrarre il testo dal PDF. Potrebbe essere un PDF scansito o protetto.',
      });
    }

    // If the text fits in the entity field, return it directly
    if (text.length <= MAX_ENTITY_FIELD_SIZE) {
      return Response.json({ text });
    }

    // Full text exceeds the entity field limit — store it as a private file
    // and return a truncated preview plus the file URI.
    const blob = new Blob([text], { type: 'text/plain' });
    const file = new File([blob], 'extracted_text.txt', { type: 'text/plain' });
    const { file_uri: extracted_file_uri } = await base44.asServiceRole.integrations.Core.UploadPrivateFile({ file });

    return Response.json({
      text: text.slice(0, MAX_ENTITY_FIELD_SIZE),
      extracted_text_uri: extracted_file_uri,
      full_length: text.length,
    });
  } catch (error) {
    console.error('extractPdfText error', error?.message);
    return Response.json({ error: error?.message || "Errore durante l'estrazione del testo" }, { status: 500 });
  }
}