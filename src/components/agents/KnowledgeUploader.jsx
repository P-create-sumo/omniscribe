import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload, FileText, Type, Loader2, CheckCircle2,
  File, HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GoogleDrivePicker from "./GoogleDrivePicker";

const FILE_TYPES = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
  "text/plain": "txt",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/mp3": "audio",
  "audio/ogg": "audio",
  "audio/webm": "audio",
  "audio/mp4": "audio",
  "audio/m4a": "audio",
  "video/mp4": "video",
};

const ACCEPT_STRING = ".pdf,.doc,.docx,.txt,.mp3,.wav,.ogg,.webm,.m4a,.mp4";

export default function KnowledgeUploader({ agentId, onSourceAdded }) {
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [pastedText, setPastedText] = useState("");
  const [savingText, setSavingText] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const fileInputRef = useRef(null);

  const getFileType = (file) => {
    if (FILE_TYPES[file.type]) return FILE_TYPES[file.type];
    const ext = file.name.split(".").pop().toLowerCase();
    if (["pdf"].includes(ext)) return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["txt", "md", "rst"].includes(ext)) return "txt";
    if (["mp3", "wav", "ogg", "webm", "m4a", "oga", "flac"].includes(ext)) return "audio";
    if (["mp4"].includes(ext)) return "video";
    return "txt";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    setUploading(true);
    
    const queue = fileArray.map(f => ({ name: f.name, status: "uploading", size: formatFileSize(f.size) }));
    setUploadQueue(queue);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const fileType = getFileType(file);

      setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: "uploading" } : item));

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      let extractedText = "";
      setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: "processing" } : item));

      if (fileType === "audio" || fileType === "video") {
        const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
        extractedText = transcript;
      } else if (fileType === "pdf" || fileType === "doc") {
        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: {
            type: "object",
            properties: {
              full_text: { type: "string", description: "The complete text content of the document" }
            }
          }
        });
        extractedText = result?.output?.full_text || "";
      } else {
        const resp = await fetch(file_url);
        extractedText = await resp.text();
      }

      await base44.entities.KnowledgeSource.create({
        agent_id: agentId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: fileType,
        file_url,
        extracted_text: extractedText,
        status: "ready",
        file_size: formatFileSize(file.size),
        original_filename: file.name,
      });

      setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: "done" } : item));
    }

    // Update sources count
    const sources = await base44.entities.KnowledgeSource.filter({ agent_id: agentId });
    await base44.entities.SuperAgent.update(agentId, { sources_count: sources.length, status: "active" });

    setUploading(false);
    setTimeout(() => setUploadQueue([]), 2000);
    onSourceAdded?.();
  };

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return;
    setSavingText(true);

    await base44.entities.KnowledgeSource.create({
      agent_id: agentId,
      title: pastedText.slice(0, 50) + (pastedText.length > 50 ? "..." : ""),
      type: "text",
      extracted_text: pastedText,
      status: "ready",
      file_size: formatFileSize(new Blob([pastedText]).size),
      original_filename: "Testo incollato",
    });

    const sources = await base44.entities.KnowledgeSource.filter({ agent_id: agentId });
    await base44.entities.SuperAgent.update(agentId, { sources_count: sources.length, status: "active" });

    setPastedText("");
    setSavingText(false);
    onSourceAdded?.();
  };

  return (
    <Card className="border-border/60 shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="w-full rounded-none border-b bg-muted/30 h-12 p-0">
            <TabsTrigger value="file" className="flex-1 h-full rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none gap-2">
              <Upload className="w-4 h-4" /> File
            </TabsTrigger>
            <TabsTrigger value="drive" className="flex-1 h-full rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none gap-2">
              <HardDrive className="w-4 h-4" /> Google Drive
            </TabsTrigger>
            <TabsTrigger value="text" className="flex-1 h-full rounded-none data-[state=active]:bg-background data-[state=active]:shadow-none gap-2">
              <Type className="w-4 h-4" /> Testo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="p-6 mt-0">
            <div
              className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_STRING}
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <p className="font-medium mb-1">Trascina i file qui o clicca per caricare</p>
              <p className="text-sm text-muted-foreground">
                PDF, DOC, TXT, MP3, WAV, MP4 — carica più file contemporaneamente
              </p>
            </div>

            <AnimatePresence>
              {uploadQueue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  {uploadQueue.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.size}</p>
                      </div>
                      {item.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {item.status === "processing" && (
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Elaborazione
                        </span>
                      )}
                      {item.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="drive" className="p-6 mt-0">
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HardDrive className="w-7 h-7 text-primary" />
              </div>
              <p className="font-medium mb-1">Importa da Google Drive</p>
              <p className="text-sm text-muted-foreground mb-5">
                Sfoglia e importa direttamente PDF, DOC, TXT, audio e video dal tuo Drive
              </p>
              <Button
                onClick={() => setDriveOpen(true)}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
              >
                <HardDrive className="w-4 h-4" />
                Apri Google Drive
              </Button>
            </div>
            <GoogleDrivePicker
              agentId={agentId}
              open={driveOpen}
              onClose={() => setDriveOpen(false)}
              onSourceAdded={() => { setDriveOpen(false); onSourceAdded?.(); }}
            />
          </TabsContent>

          <TabsContent value="text" className="p-6 mt-0">
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Incolla qui il testo da un libro, articolo, appunti di corso..."
              className="min-h-[200px] text-base resize-none mb-4"
            />
            <Button
              onClick={handleTextSubmit}
              disabled={!pastedText.trim() || savingText}
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
            >
              {savingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
              Aggiungi alla Knowledge Base
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}