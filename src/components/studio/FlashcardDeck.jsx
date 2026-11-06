import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

export default function FlashcardDeck({ data }) {
  const cards = data?.cards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [toReview, setToReview] = useState(0);
  const [finished, setFinished] = useState(false);

  const card = cards[index];
  if (!cards.length) return <p className="text-sm text-muted-foreground">Nessuna flashcard disponibile.</p>;

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setToReview(0);
    setFinished(false);
  };

  const rate = (ok) => {
    if (ok) setKnown(known + 1);
    else setToReview(toReview + 1);
    setFlipped(false);
    if (index + 1 >= cards.length) setFinished(true);
    else setIndex(index + 1);
  };

  if (finished) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-5xl font-bold">{known}/{cards.length}</p>
        <p className="text-muted-foreground">carte che sapevi</p>
        <p className="text-sm text-muted-foreground">
          {toReview > 0 ? `${toReview} da rivedere: chiedi all'Esperto di approfondirle.` : "Preparazione completa su questo argomento."}
        </p>
        <Button onClick={restart} className="gap-2"><RotateCcw className="w-4 h-4" /> Ricomincia</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Carta {index + 1} di {cards.length}</span>
        <span>{known} sapute · {toReview} da rivedere</span>
      </div>

      <Card
        onClick={() => setFlipped(!flipped)}
        className="min-h-[220px] p-6 flex flex-col justify-center items-center text-center cursor-pointer bg-gradient-to-br from-card to-muted/30 hover:border-primary/40 transition-colors"
      >
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          {flipped ? "Risposta" : "Domanda"}
        </p>
        <p className={flipped ? "text-sm leading-relaxed" : "text-lg font-medium leading-snug"}>
          {flipped ? card.back : card.front}
        </p>
        {!flipped && card.hint && <p className="text-xs text-muted-foreground mt-3">Suggerimento: {card.hint}</p>}
        {!flipped && <p className="text-[11px] text-muted-foreground mt-4">Tocca per girare</p>}
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex gap-2 flex-1">
          <Button variant="outline" className="flex-1" onClick={() => rate(false)}>Da rivedere</Button>
          <Button className="flex-1" onClick={() => rate(true)}>Lo sapevo</Button>
        </div>
        <Button variant="ghost" size="icon" disabled={index + 1 >= cards.length} onClick={() => { setIndex(index + 1); setFlipped(false); }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}