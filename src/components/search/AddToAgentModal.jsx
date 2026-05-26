import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Brain } from "lucide-react";
import { Link } from "react-router-dom";

export default function AddToAgentModal({ result, open, onClose }) {
  const [adding, setAdding] = useState(null);
  const [done, setDone] = useState(null);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.SuperAgent.list("-created_date"),
    enabled: open,
  });

  const handleAdd = async (agent) => {
    setAdding(agent.id);
    const text = [
      `Titolo: ${result.title}`,
      result.authors?.length ? `Autori: ${result.authors.join(", ")}` : "",
      result.year ? `Anno: ${result.year}` : "",
      result.institution ? `Istituzione: ${result.institution}` : "",
      result.abstract ? `\nAbstract:\n${result.abstract}` : "",
      result.url ? `\nURL: ${result.url}` : "",
    ].filter(Boolean).join("\n");

    await base44.entities.KnowledgeSource.create({
      agent_id: agent.id,
      title: result.title,
      type: "text",
      extracted_text: text,
      status: "ready",
      file_size: `${(new Blob([text]).size / 1024).toFixed(1)} KB`,
      original_filename: `[${result.source}] ${result.title}`,
    });

    const sources = await base44.entities.KnowledgeSource.filter({ agent_id: agent.id });
    await base44.entities.SuperAgent.update(agent.id, {
      sources_count: sources.length,
      status: "active",
    });

    setAdding(null);
    setDone(agent.id);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aggiungi alla Knowledge Base</DialogTitle>
          <DialogDescription className="text-sm line-clamp-2">
            "{result?.title}"
          </DialogDescription>
        </DialogHeader>

        {agents.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-4">Nessun agente creato ancora.</p>
            <Link to="/create" onClick={onClose}>
              <Button size="sm">Crea un agente</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-muted-foreground mb-3">Scegli a quale SuperAgent aggiungere questo materiale:</p>
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{agent.icon || "🧠"}</span>
                  <div>
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.discipline}</p>
                  </div>
                </div>
                {done === agent.id ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
                    disabled={adding === agent.id}
                    onClick={() => handleAdd(agent)}
                  >
                    {adding === agent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aggiungi"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}