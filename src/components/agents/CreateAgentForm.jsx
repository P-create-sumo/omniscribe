import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const EMOJI_OPTIONS = ["🧠", "📚", "⚕️", "⚖️", "💻", "🎨", "🔬", "📊", "🏛️", "🌍", "🎵", "🧬", "🔧", "📐", "🧪"];

export default function CreateAgentForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    discipline: "",
    description: "",
    icon: "🧠",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.discipline) return;
    setSaving(true);
    const agent = await base44.entities.SuperAgent.create({
      ...form,
      status: "draft",
      sources_count: 0,
    });
    navigate(`/agent/${agent.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-xl shadow-primary/25">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Crea un SuperAgent</h1>
        <p className="text-muted-foreground">
          Trasforma libri, corsi e documenti in un esperto AI della materia
        </p>
      </div>

      <Card className="border-border/60 shadow-xl">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Icona</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, icon: emoji })}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      form.icon === emoji
                        ? "bg-primary/10 ring-2 ring-primary scale-110"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome dell'agente</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='es. "Prof. Marketing Digitale"'
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discipline" className="text-sm font-medium">Disciplina / Area di competenza</Label>
              <Input
                id="discipline"
                value={form.discipline}
                onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                placeholder='es. "Marketing Digitale", "Neuroscienze", "Diritto Penale"'
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Descrizione (opzionale)</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrivi cosa sa fare questo agente..."
                className="min-h-[100px] text-base resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={saving || !form.name || !form.discipline}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25 gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crea SuperAgent
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}