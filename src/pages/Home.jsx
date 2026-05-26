import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Brain, Sparkles, BookOpen, Zap, ArrowRight } from "lucide-react";
import AgentCard from "../components/agents/AgentCard";
import { motion } from "framer-motion";

export default function Home() {
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => base44.entities.SuperAgent.list("-created_date"),
  });

  return (
    <div>
      {/* Hero Section */}
      {agents.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 md:py-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by AI
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Trasforma i tuoi libri in
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              esperti AI
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Carica libri, corsi universitari, appunti e documenti. SuperAgents crea un esperto AI per ogni disciplina che risponde alle tue domande basandosi sulle fonti reali.
          </p>

          <Link to="/create">
            <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-xl shadow-primary/25 gap-2 rounded-xl">
              <Plus className="w-5 h-5" />
              Crea il tuo primo SuperAgent
            </Button>
          </Link>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
            {[
              { icon: BookOpen, title: "Multi-formato", desc: "PDF, DOC, TXT, audio MP3/WAV, video MP4, testo copiato" },
              { icon: Brain, title: "Esperto per materia", desc: "Ogni agente è specializzato nei materiali che carichi" },
              { icon: Zap, title: "Risposte fondate", desc: "Niente allucinazioni: le risposte citano le tue fonti" },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border/60 text-left hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Agents Grid */}
      {(agents.length > 0 || isLoading) && (
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">I tuoi SuperAgents</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {agents.length} {agents.length === 1 ? "agente" : "agenti"} creati
              </p>
            </div>
            <Link to="/create">
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
                <Plus className="w-4 h-4" />
                Nuovo Agente
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent, idx) => (
                <AgentCard key={agent.id} agent={agent} index={idx} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}