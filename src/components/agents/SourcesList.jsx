import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText, Mic, Type, Video, File, Trash2, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

const typeIcons = {
  pdf: FileText,
  doc: FileText,
  txt: File,
  audio: Mic,
  video: Video,
  text: Type,
};

const typeLabels = {
  pdf: "PDF",
  doc: "DOC",
  txt: "TXT",
  audio: "Audio",
  video: "Video",
  text: "Testo",
};

const typeColors = {
  pdf: "bg-red-500/10 text-red-600 border-red-500/20",
  doc: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  txt: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  audio: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  video: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  text: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

export default function SourcesList({ sources, onDelete }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nessuna fonte caricata. Aggiungi documenti per dare conoscenza al tuo agente.</p>
      </div>
    );
  }

  const handleDelete = async (source) => {
    await base44.entities.KnowledgeSource.delete(source.id);
    onDelete?.();
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {sources.map((source, idx) => {
          const Icon = typeIcons[source.type] || File;
          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center border border-border/50 flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{source.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColors[source.type] || ""}`}>
                    {typeLabels[source.type] || source.type}
                  </Badge>
                  {source.file_size && (
                    <span className="text-[10px] text-muted-foreground">{source.file_size}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {source.file_url && (
                  <a href={source.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(source)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}