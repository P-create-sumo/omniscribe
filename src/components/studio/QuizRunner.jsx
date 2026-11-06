import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCcw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizRunner({ data, mode = "mc" }) {
  const questions = data?.questions || [];
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answered = results.length;
  const correct = results.filter((r) => r.correct).length;

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setRevealed(false);
    setResults([]);
    setFinished(false);
  };

  const advance = (ok) => {
    const next = [...results, { correct: ok }];
    setResults(next);
    setPicked(null);
    setRevealed(false);
    if (index + 1 >= questions.length) setFinished(true);
    else setIndex(index + 1);
  };

  if (!questions.length) {
    return <p className="text-sm text-muted-foreground">Nessuna domanda disponibile.</p>;
  }

  if (finished) {
    const score = results.filter((r) => r.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-5xl font-bold">{pct}%</p>
        <p className="text-muted-foreground">{score} risposte corrette su {questions.length}</p>
        <p className="text-sm text-muted-foreground">
          {pct >= 80 ? "Preparazione ottima." : pct >= 50 ? "Buona base, rivedi gli argomenti sbagliati." : "Da rivedere: riparti dai materiali dell'Esperto."}
        </p>
        <Button onClick={restart} className="gap-2"><RotateCcw className="w-4 h-4" /> Ripeti il quiz</Button>
      </div>
    );
  }

  const isCorrectPick = mode === "mc" && picked === question.correct_index;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Domanda {index + 1} di {questions.length}</span>
        <span>{correct} corrette</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
        <p className="font-medium leading-relaxed">{question.question}</p>
      </div>

      {mode === "mc" ? (
        <div className="space-y-2">
          {(question.options || []).map((option, i) => {
            const isPicked = picked === i;
            const isRight = picked !== null && i === question.correct_index;
            return (
              <button
                key={i}
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(i)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-start gap-3",
                  isRight && "border-emerald-500/50 bg-emerald-500/10",
                  isPicked && !isRight && "border-red-500/50 bg-red-500/10",
                  picked === null && "border-border/60 hover:border-primary/50 hover:bg-muted/40",
                )}
              >
                <span className="text-xs text-muted-foreground pt-0.5">{String.fromCharCode(65 + i)}</span>
                <span className="flex-1">{option}</span>
                {isRight && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                {isPicked && !isRight && <X className="w-4 h-4 text-red-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {!revealed ? (
            <Button variant="outline" className="gap-2" onClick={() => setRevealed(true)}>
              <Eye className="w-4 h-4" /> Mostra la risposta modello
            </Button>
          ) : (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <p className="text-sm leading-relaxed">{question.model_answer}</p>
              {!!question.key_points?.length && (
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                  {question.key_points.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {picked !== null && mode === "mc" && (
        <div className="space-y-3">
          {question.explanation && <p className="text-sm text-muted-foreground">{question.explanation}</p>}
          <Button onClick={() => advance(isCorrectPick)} className="w-full">
            {index + 1 >= questions.length ? "Vedi il risultato" : "Domanda successiva"}
          </Button>
        </div>
      )}

      {revealed && mode !== "mc" && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => advance(false)}>Da rivedere</Button>
          <Button onClick={() => advance(true)}>Sapevo rispondere</Button>
        </div>
      )}
    </div>
  );
}