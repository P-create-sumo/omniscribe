import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.8.1';
import { claimFilesForUser } from '../../shared/fileOwnership.ts';

const MAX_ENTITY_FIELD_SIZE = 18000; // safe limit below the ~20K entity field cap

// Only storage paths are accepted (never a caller-supplied URL), so the server
// can never be pointed at an arbitrary host (SSRF guard).
const FILE_URI_RE = /^[A-Za-z0-9][A-Za-z0-9/_.-]{3,300}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const file_uri = String(body.file_uri || '');

    if (!FILE_URI_RE.test(file_uri) || file_uri.includes('://')) {
      return Response.json({ error: 'file_uri non valido' }, { status: 400 });
    }

    // The path must belong to this user: a file already bound to someone else
    // is refused, so this endpoint cannot serve another user's document.
    if (!(await claimFilesForUser(base44, user, [file_uri]))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Storage path -> signed URL generated server-side, so the platform's
    // app-ownership validation applies.
    const { signed_url: downloadUrl } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 300,
    });

    // No redirects honoured: a storage download never should, and following one
    // would let the server be steered to another host.
    const resp = await fetch(downloadUrl, { signal: AbortSignal.timeout(120000), redirect: 'manual' });
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

    // Bind the generated file to the requester as well, so its path cannot be
    // read back by another user later.
    await claimFilesForUser(base44, user, [extracted_file_uri]);

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