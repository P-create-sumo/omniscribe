import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { slug, access_code } = await req.json();
    if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

    // Read server-side via service role so the access_code never reaches the browser.
    const list = await base44.asServiceRole.entities.Expert.filter({ slug });
    const expert = list && list[0];
    if (!expert) return Response.json({ error: 'not_found' }, { status: 404 });

    const accessRequired = !!expert.access_code;
    const codeMatches = !!access_code && access_code === expert.access_code;
    const accessGranted = !accessRequired || codeMatches;

    // Strip the access_code from the payload returned to the client.
    const { access_code: _ac, ...safeExpert } = expert;

    // Only hand back knowledge sources when the caller is entitled to them.
    let sources = [];
    if (accessGranted) {
      sources = await base44.asServiceRole.entities.KnowledgeSource.filter({ agent_id: expert.id });
    }

    return Response.json({ expert: safeExpert, accessRequired, accessGranted, sources });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});