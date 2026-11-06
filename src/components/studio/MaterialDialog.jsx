import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { typeMeta } from "./materialTypes";
import QuizRunner from "./QuizRunner";
import FlashcardDeck from "./FlashcardDeck";
import SlideViewer from "./SlideViewer";
import MindMapView from "./MindMapView";
import AudioMaterial from "./AudioMaterial";
import InfographicView from "./InfographicView";

function parseContent(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

export default function MaterialDialog({ material, open, onOpenChange }) {
  if (!material) return null;

  const data = parseContent(material.content);
  const meta = typeMeta(material.type);
  const Icon = meta.icon;

  const renderer = () => {
    switch (material.type) {
      case "quiz_mc":
        return <QuizRunner data={data} mode="mc" />;
      case "quiz_open":
        return <QuizRunner data={data} mode="open" />;
      case "flashcards":
        return <FlashcardDeck data={data} />;
      case "slides":
        return <SlideViewer data={data} />;
      case "mindmap":
        return <MindMapView data={data} />;
      case "audio":
      case "podcast":
        return <AudioMaterial material={material} data={data} />;
      case "infographic":
        return <InfographicView data={data} />;
      default:
        return <p className="text-sm text-muted-foreground">Formato non supportato.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base leading-snug">{material.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {meta.label} · {material.topic}
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="pt-2">{renderer()}</div>
        {material.sources_used && (
          <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-3">
            Fonti: {material.sources_used}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}