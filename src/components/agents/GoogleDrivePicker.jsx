import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Loader2, Search, FileText, Music, Video, File,
  CheckCircle2, CloudDownload, HardDrive
} from "lucide-react";
import { motion } from "framer-motion";

const FILE_ICONS = {
  "application/pdf": <FileText className="w-4 h-4 text-red-400" />,
  "application/msword": <FileText className="w-4 h-4 text-blue-400" />,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <FileText className="w-4 h-4 text-blue-400" />,
  "application/vnd.google-apps.document": <FileText className="w-4 h-4 text-blue-500" />,
  "text/plain": <FileText className="w-4 h-4 text-gray-400" />,
  "audio/mpeg": <Music className="w-4 h-4 text-purple-400" />,
  "audio/wav": <Music className="w-4 h-4 text-purple-400" />,
  "video/mp4": <Video className="w-4 h-4 text-green-400" />,
};

const FILE_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
  "application/vnd.google-apps.document": "doc",
  "text/plain": "txt",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "video/mp4": "video",
};

function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function GoogleDrivePicker({ agentId, open, onClose, onSourceAdded }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [importing, setImporting] = useState({});
  const [done, setDone] = useState({});

  const loadFiles = async (searchQuery = "") => {
    setLoading(true);
    const res = await base44.functions.invoke("googleDriveFiles", { action: "list", query: searchQuery || undefined });
    setFiles(res.data.files || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) loadFiles();
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) loadFiles(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleImport = async (file) => {
    setImporting(prev => ({ ...prev, [file.id]: true }));

    const res = await base44.functions.invoke("googleDriveFiles", { action: "download", fileId: file.id });
    const { file_url, name, mimeType, size } = res.data;

    const fileType = FILE_TYPES[mimeType] || "txt";

    let extractedText = "";
    if (fileType === "audio" || fileType === "video") {
      extractedText = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
    } else if (fileType === "pdf" || fileType === "doc") {
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: { full_text: { type: "string", description: "The complete text content of the document" } }
        }
      });
      extractedText = result?.output?.full_text || "";
    } else {
      const resp = await fetch(file_url);
      extractedText = await resp.text();
    }

    await base44.entities.KnowledgeSource.create({
      agent_id: agentId,
      title: name.replace(/\.[^/.]+$/, ""),
      type: fileType,
      file_url,
      extracted_text: extractedText,
      status: "ready",
      file_size: formatBytes(size),
      original_filename: name,
    });

    const sources = await base44.entities.KnowledgeSource.filter({ agent_id: agentId });
    await base44.entities.SuperAgent.update(agentId, { sources_count: sources.length, status: "active" });

    setImporting(prev => ({ ...prev, [file.id]: false }));
    setDone(prev => ({ ...prev, [file.id]: true }));
    onSourceAdded?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Importa da Google Drive
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cerca nei tuoi file..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">Nessun file trovato</p>
          ) : (
            files.map((file, idx) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-shrink-0">
                  {FILE_ICONS[file.mimeType] || <File className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(parseInt(file.size))}
                    {file.modifiedTime && " · " + new Date(file.modifiedTime).toLocaleDateString("it-IT")}
                  </p>
                </div>
                {done[file.id] ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 h-8 text-xs gap-1.5"
                    disabled={importing[file.id]}
                    onClick={() => handleImport(file)}
                  >
                    {importing[file.id] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CloudDownload className="w-3.5 h-3.5" />
                    )}
                    {importing[file.id] ? "Importando..." : "Importa"}
                  </Button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}