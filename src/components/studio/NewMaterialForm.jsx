import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATERIAL_TYPES, typeMeta } from "./materialTypes";

export default function NewMaterialForm({ expert, onCreated }) {
  const [type, setType] = useState("quiz_mc");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateStudyMaterial", {
        expert_id: expert.id,
        type,
        topic: topic.trim(),
      });
      if (res.data?.error) throw new Error(res.data.error);
      setTopic("");
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.error || err?.data?.error || err?.message || "Errore nella generazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Crea materiale didattico</h3>
        <p className="text-sm text-muted-foreground mt-1">Scegli il formato, indica un capitolo o un argomento e l'Esperto lo prepara dalla sua knowledge base.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MATERIAL_TYPES.map((item) => {
          const Icon = item.icon;
          const active = type === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setType(item.id)}
              title={item.hint}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                active ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/40 hover:bg-muted/40",
              )}
            >
              <Icon className={cn("w-4 h-4 mb-2", active ? "text-primary" : "text-muted-foreground")} />
              <p className="text-xs font-medium leading-tight">{item.label}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Es. Capitolo 3: la fotosintesi"
          disabled={loading}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !topic.trim()} className="gap-2 flex-shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generazione…" : "Genera"}
        </Button>
      </div>

      {loading && (
        <p className="text-xs text-muted-foreground">
          Sto preparando: {typeMeta(type).label}. L'audio richiede qualche secondo in più.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}