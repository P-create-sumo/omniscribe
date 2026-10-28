// Ownership of private storage paths.
//
// A private file path is scoped to the whole app, not to the user who uploaded
// it, so the platform cannot tell us who a path belongs to. Each path is bound
// to the user who first processes it and every later caller must be that same
// user (or an admin): a path that leaks out of a record becomes useless to
// anyone else, and a text-extraction endpoint can no longer read another
// user's document.

export async function claimFilesForUser(base44, user, fileUris) {
  const uris = Array.from(new Set((fileUris || []).filter(Boolean).map(String)));
  if (uris.length === 0) return true;

  const claims = await base44.asServiceRole.entities.FileClaim.filter({
    file_uri: { $in: uris },
  });
  const ownerByFile = new Map();
  for (const claim of claims || []) ownerByFile.set(claim.file_uri, claim.owner_id);

  for (const uri of uris) {
    const ownerId = ownerByFile.get(uri);
    if (ownerId && ownerId !== user.id && user.role !== 'admin') return false;
  }

  // Written with the service role so the binding cannot be forged or removed
  // from the browser.
  const unclaimed = uris
    .filter((uri) => !ownerByFile.has(uri))
    .map((file_uri) => ({ file_uri, owner_id: user.id }));
  if (unclaimed.length > 0) {
    await base44.asServiceRole.entities.FileClaim.bulkCreate(unclaimed);
  }

  return true;
}