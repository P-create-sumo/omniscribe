import {
  ListChecks, HelpCircle, Layers, Presentation, Network, Headphones, Mic, PieChart,
} from "lucide-react";

export const MATERIAL_TYPES = [
  { id: "quiz_mc", label: "Quiz a crocette", hint: "Test a risposta multipla con correzioni", icon: ListChecks },
  { id: "quiz_open", label: "Domande aperte", hint: "Quiz con risposte modello e punti chiave", icon: HelpCircle },
  { id: "flashcards", label: "Flashcard", hint: "Carte per valutare la preparazione", icon: Layers },
  { id: "slides", label: "Presentazione", hint: "Slide per un capitolo o argomento", icon: Presentation },
  { id: "mindmap", label: "Mappa mentale", hint: "Schema visivo dei concetti chiave", icon: Network },
  { id: "audio", label: "Sintesi audio", hint: "Traccia audio con il riassunto", icon: Headphones },
  { id: "podcast", label: "Podcast", hint: "Episodio narrato sull'argomento", icon: Mic },
  { id: "infographic", label: "Infografica", hint: "Numeri e concetti in formato visivo", icon: PieChart },
];

export function typeMeta(id) {
  return MATERIAL_TYPES.find((t) => t.id === id) || MATERIAL_TYPES[0];
}