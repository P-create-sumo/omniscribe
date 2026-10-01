import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const list = await base44.asServiceRole.entities.Expert.filter({ featured: true, is_public: true });
    const experts = (list || []).map((e) => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      icon: e.icon,
      description: e.description,
      discipline: e.discipline,
      is_restricted: !!e.access_code,
    }));
    return Response.json({ experts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});