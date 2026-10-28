import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, File, Mic, Video, Type, RefreshCw, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ICONS = { pdf: FileText, doc: FileText, txt: File, audio: Mic, video: Video, text: Type };
const STATUS = {
  uploading: { label: "In caricamento", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  processing: { label: "In elaborazione", cls: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  ready: { label: "Pronto", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  error: { label: "Errore", cls: "bg-red-500/10 text-red-600 border-red-500/20" },
};

export default function SourceRow({ source, expertName, onReprocess, busy }) {
  const Icon = ICONS[source.type] || File;
  const status = STATUS[source.status] || STATUS.ready;
  const chars = (source.extracted_text || "").length;
  const insufficient = source.type !== "text" && chars > 0 && chars < 300;

  const openFile = async () => {
    if (!source.file_url) return;
    if (source.file_url.startsWith("http")) {
      window.open(source.file_url, "_blank", "noopener,noreferrer");
      return;
    }
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: source.file_url,
      expires_in: 300,
    });
    window.open(signed_url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/25 hover:bg-muted/40 transition-colors">
      <div className="w-9 h-9 rounded-lg bg-card border border-border/50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{source.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.cls}`}>
            {status.label}
          </Badge>
          {expertName && <span className="text-[10px] text-muted-foreground truncate">{expertName}</span>}
          {source.file_size && <span className="text-[10px] text-muted-foreground">{source.file_size}</span>}
          {chars > 0 && <span className="text-[10px] text-muted-foreground">{chars.toLocaleString("it-IT")} car.</span>}
          {insufficient && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> Contenuto insufficiente
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {source.file_url && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openFile} title="Apri file">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => onReprocess(source)}
          disabled={busy || !source.file_url}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Riprocessa</span>
        </Button>
      </div>
    </div>
  );
}