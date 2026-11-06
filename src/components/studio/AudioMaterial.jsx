import React from "react";
import { Download } from "lucide-react";

export default function AudioMaterial({ material, data }) {
  const script = data?.script || "";
  const podcast = material.type === "podcast";

  if (!material.audio_url) {
    return <p className="text-sm text-muted-foreground">L'audio non è stato generato. Riprova la generazione.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-card space-y-4">
        <p className="text-xs uppercase tracking-widest text-primary">{podcast ? "Podcast" : "Sintesi audio"}</p>
        <audio controls src={material.audio_url} className="w-full" />
        <a href={material.audio_url} download target="_blank" rel="noopener noreferrer">
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
            <Download className="w-3.5 h-3.5" /> Scarica il file audio
          </span>
        </a>
      </div>
      {script && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Copione</p>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{script}</p>
        </div>
      )}
    </div>
  );
}