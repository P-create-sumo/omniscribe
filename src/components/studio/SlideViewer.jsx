import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, StickyNote } from "lucide-react";

export default function SlideViewer({ data }) {
  const slides = data?.slides || [];
  const [index, setIndex] = useState(0);
  const [notes, setNotes] = useState(false);

  if (!slides.length) return <p className="text-sm text-muted-foreground">Nessuna slide disponibile.</p>;
  const slide = slides[index];

  return (
    <div className="space-y-4">
      <div className="aspect-[16/9] rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 flex flex-col justify-center overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-primary mb-2">Slide {index + 1}</p>
        <h3 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">{slide.title}</h3>
        <ul className="space-y-2">
          {(slide.bullets || []).map((bullet, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2 leading-relaxed">
              <span className="text-primary mt-1">•</span>{bullet}
            </li>
          ))}
        </ul>
      </div>

      {notes && slide.speaker_notes && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
          <span className="text-xs font-medium text-foreground">Note del relatore: </span>
          {slide.speaker_notes}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setNotes(!notes)}>
          <StickyNote className="w-4 h-4" /> {notes ? "Nascondi note" : "Note relatore"}
        </Button>
        <div className="text-xs text-muted-foreground">{index + 1} / {slides.length}</div>
        <Button variant="ghost" size="icon" disabled={index + 1 >= slides.length} onClick={() => setIndex(index + 1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}