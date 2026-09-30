import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, Loader2, Upload, Type, FileText, CheckCircle2, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EMOJI_OPTIONS = ["🧠", "📚", "📈", "🤝", "💰", "⚖️", "💻", "🎨", "🔬", "📊", "🏛️", "🌍", "🎵", "🧬", "🔧", "🎯"];

const FILE_TYPES = {
  "application/pdf": "pdf",
  "application/epub+zip": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
  "text/plain": "txt",
};
const ACCEPT_STRING = ".pdf,.epub,.doc,.docx,.txt";

function getFileType(file) {
  if (FILE_TYPES[file.type]) return FILE_TYPES[file.type];
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "epub") return "txt";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "txt";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function slugify(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function extractText(file, fileUrl, fileType) {
  if (fileType === "pdf" || fileType === "doc") {
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: {
        type: "object",
        properties: { full_text: { type: "string", description: "The complete text content of the document" } },
      },
    });
    return result?.output?.full_text || "";
  }
  const resp = await fetch(fileUrl);
  return await resp.text();
}

export default function CreateExpert() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", discipline: "", description: "", tone_of_voice: "", key_skills: "", icon: "🧠",
  });
  const [files, setFiles] = useState([]);
  const [pastedText, setPastedText] = useState("");
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState({ label: "", current: 0, total: 0 });
  const fileInputRef = useRef(null);

  const hasContent = files.length > 0 || pastedText.trim().length > 0;

  const handleFiles = (fileList) => {
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.discipline || !hasContent || training) return;
    setTraining(true);

    const totalSources = files.length + (pastedText.trim() ? 1 : 0);
    setProgress({ label: "Creazione Esperto in corso...", current: 0, total: totalSources });

    const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const expert = await base44.entities.Expert.create({
      ...form,
      status: "training",
      slug,
      is_public: false,
      email_gate: false,
      featured: false,
      sources_count: 0,
      conversations_count: 0,
    });

    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = getFileType(file);
      setProgress({ label: `Caricamento: ${file.name}`, current: count, total: totalSources });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProgress({ label: `Estrazione testo: ${file.name}`, current: count, total: totalSources });
      const extractedText = await extractText(file, file_url, fileType);
      await base44.entities.KnowledgeSource.create({
        agent_id: expert.id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: fileType,
        file_url,
        extracted_text: extractedText,
        status: "ready",
        file_size: formatSize(file.size),
        original_filename: file.name,
      });
      count++;
      setProgress({ label: "", current: count, total: totalSources });
    }

    if (pastedText.trim()) {
      setProgress({ label: "Salvataggio testo incollato...", current: count, total: totalSources });
      await base44.entities.KnowledgeSource.create({
        agent_id: expert.id,
        title: pastedText.slice(0, 50) + (pastedText.length > 50 ? "..." : ""),
        type: "text",
        extracted_text: pastedText,
        status: "ready",
        file_size: formatSize(new Blob([pastedText]).size),
        original_filename: "Testo incollato",
      });
      count++;
      setProgress({ label: "", current: count, total: totalSources });
    }

    setProgress({ label: "Finalizzazione Esperto...", current: totalSources, total: totalSources });
    await base44.entities.Expert.update(expert.id, { status: "active", sources_count: totalSources });
    navigate(`/expert/${expert.id}`);
  };

  if (training) {
    const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mb-6 shadow-xl shadow-primary/25">
          <Wand2 className="w-10 h-10 text-white animate-pulse" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Addestramento in corso</h2>
        <p className="text-muted-foreground mb-8">Sto leggendo e indicizzando la tua conoscenza...</p>

        <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-3">
          <motion.div className="h-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mb-6">
          <span>{progress.label || "Elaborazione..."}</span>
          <span>{progress.current}/{progress.total}</span>
        </div>

        <div className="space-y-2 text-left">
          {["Creazione Esperto", "Caricamento fonti", "Estrazione del testo", "Indicizzazione conoscenza"].map((step, i) => {
            const done = pct > (i / 4) * 100;
            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-xl shadow-primary/25">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Crea il tuo Esperto</h1>
        <p className="text-muted-foreground">Carica la tua conoscenza e definisci la personalità del tuo consulente AI</p>
      </div>

      <Card className="border-border/60 shadow-xl">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Icona</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button key={emoji} type="button" onClick={() => setForm({ ...form, icon: emoji })}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === emoji ? "bg-primary/10 ring-2 ring-primary scale-110" : "bg-muted hover:bg-muted/80"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome dell'Esperto *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder='es. "Stratega di Marketing"' className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discipline" className="text-sm font-medium">Disciplina *</Label>
                <Input id="discipline" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                  placeholder='es. "Marketing Digitale"' className="h-12 text-base" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrizione</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Cosa sa fare questo Esperto? Sarà mostrato sulla pagina pubblica." className="min-h-[80px] text-base resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tone" className="text-sm font-medium">Tono di voce</Label>
                <Input id="tone" value={form.tone_of_voice} onChange={(e) => setForm({ ...form, tone_of_voice: e.target.value })}
                  placeholder='es. "Pratico e diretto"' className="h-12 text-base" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-medium">Competenze chiave</Label>
                <Input id="skills" value={form.key_skills} onChange={(e) => setForm({ ...form, key_skills: e.target.value })}
                  placeholder='es. "SEO, copywriting, funnel"' className="h-12 text-base" />
              </div>
            </div>

            {/* Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Knowledge base *</Label>
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              >
                <input ref={fileInputRef} type="file" accept={ACCEPT_STRING} multiple className="hidden"
                  onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <p className="font-medium mb-1 text-sm">Trascina file o clicca per caricare</p>
                <p className="text-xs text-muted-foreground">PDF, EPUB, DOC, TXT</p>
              </div>

              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                        </div>
                        <button type="button" onClick={() => removeFile(idx)} className="text-xs text-destructive hover:underline">Rimuovi</button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 border-t border-border/40" />
                <span>oppure incolla il testo</span>
                <div className="flex-1 border-t border-border/40" />
              </div>

              <Textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)}
                placeholder="Incolla qui il testo del tuo libro, manuale o metodo..."
                className="min-h-[120px] text-base resize-none" />
            </div>

            <Button type="submit" disabled={!form.name || !form.discipline || !hasContent || training}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25 gap-2">
              {training ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Type className="w-5 h-5" /> Crea Esperto <ArrowRight className="w-5 h-5" /></>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}