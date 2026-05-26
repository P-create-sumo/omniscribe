import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, fileId, pageToken, query } = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const headers = { Authorization: `Bearer ${accessToken}` };

    if (action === 'list') {
      // List files: PDFs, docs, txt, audio, video
      const mimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
        'video/mp4',
        'application/vnd.google-apps.document',
      ].map(m => `mimeType='${m}'`).join(' or ');

      let url = `https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,size,modifiedTime,iconLink),nextPageToken&pageSize=50&orderBy=modifiedTime desc&q=(${mimeTypes}) and trashed=false`;
      if (query) url += ` and name contains '${query.replace(/'/g, "\\'")}'`;
      if (pageToken) url += `&pageToken=${pageToken}`;

      const res = await fetch(url, { headers });
      const data = await res.json();
      return Response.json({ files: data.files || [], nextPageToken: data.nextPageToken || null });
    }

    if (action === 'download') {
      // For Google Docs, export as plain text; for others, download directly
      let downloadUrl;
      let mimeType = 'application/octet-stream';

      // First, get file metadata
      const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size`, { headers });
      const meta = await metaRes.json();

      if (meta.mimeType === 'application/vnd.google-apps.document') {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
        mimeType = 'text/plain';
      } else {
        downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        mimeType = meta.mimeType;
      }

      const fileRes = await fetch(downloadUrl, { headers });
      const blob = await fileRes.blob();

      // Upload to Base44 storage
      const formData = new FormData();
      formData.append('file', blob, meta.name);
      const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file: blob });

      return Response.json({ file_url, name: meta.name, mimeType, size: blob.size });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});