import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.8.1';

const MAX_ENTITY_FIELD_SIZE = 18000; // safe limit below the ~20K entity field cap

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_uri } = await req.json();
    if (!file_uri) return Response.json({ error: 'file_uri obbligatorio' }, { status: 400 });

    // Generate the signed URL server-side so the platform's app-ownership
    // validation applies — the client cannot direct us to an arbitrary URL.
    const { signed_url } = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
      file_uri,
      expires_in: 300,
    });

    const resp = await fetch(signed_url, { signal: AbortSignal.timeout(120000) });
    if (!resp.ok) return Response.json({ error: 'Download del file fallito' }, { status: 502 });

    const buffer = await resp.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || !text.trim()) {
      return Response.json({ error: 'Impossibile estrarre il testo dal PDF. Potrebbe essere un PDF scansito o protetto.' });
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
    return Response.json({ error: error.message || 'Errore durante l\'estrazione del testo' }, { status: 500 });
  }
});