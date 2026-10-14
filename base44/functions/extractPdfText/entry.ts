import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { extractText, getDocumentProxy } from 'npm:unpdf@1.8.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { signed_url } = await req.json();
    if (!signed_url) return Response.json({ error: 'signed_url obbligatorio' }, { status: 400 });

    const resp = await fetch(signed_url, { signal: AbortSignal.timeout(120000) });
    if (!resp.ok) return Response.json({ error: 'Download del file fallito' }, { status: 502 });

    const buffer = await resp.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });

    if (!text || !text.trim()) {
      return Response.json({ error: 'Impossibile estrarre il testo dal PDF. Potrebbe essere un PDF scansito o protetto.' });
    }

    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message || 'Errore durante l\'estrazione del testo' }, { status: 500 });
  }
});