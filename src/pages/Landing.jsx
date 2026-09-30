import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Plus, Upload, Wand2, Share2, ArrowRight,
  BookMarked, Briefcase, GraduationCap, Building2, MessageSquare, Globe, Lock,
} from "lucide-react";
import { motion } from "framer-motion";

const STEPS = [
  { icon: Upload, title: "Carica", desc: "Upload di PDF, EPUB, TXT o incolla il testo del tuo libro/manuale/metodo." },
  { icon: Wand2, title: "Personalizza", desc: "Definisci nome, tono di voce e competenze. OmniScribe addestra l'Esperto AI." },
  { icon: Share2, title: "Condividi & Monetizza", desc: "Ottieni un link pubblico da vendere a clienti, con gate email per i lead." },
];

const USE_CASES = [
  {
    icon: BookMarked,
    title: "Autori & Editori",
    desc: "Trasforma un libro o un manuale in un consulente AI che i letori possono interrogare — un nuovo prodotto digitale da vendere accanto all'opera.",
  },
  {
    icon: GraduationCap,
    title: "Consulenti & Formatori",
    desc: "Confeziona il tuo metodo in un Esperto che risponde con la tua voce, 24/7, e vendi l'accesso come servizio ricorrente.",
  },
  {
    icon: Building2,
    title: "Aziende",
    desc: "Trasforma documentazione interna, procedure e manuali in un Esperto che supporta i team senza dover cercare tra centinaia di file.",
  },
];

export default function Landing() {
  const { data: featured = [] } = useQuery({
    queryKey: ["featured-experts"],
    queryFn: () => base44.entities.Expert.filter({ featured: true }),
  });

  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-12 md:pt-20 max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Da conoscenza proprietaria a prodotto AI vendibile
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
          Il tuo libro diventa un
          <br />
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            consulente AI
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Carica la tua conoscenza, crea un Esperto AI che risponde con la tua voce e vendi l'accesso.
          OmniScribe trasforma libri, manuali e metodi in consulenti AI pronti da condividere.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/create">
            <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-xl shadow-primary/25 gap-2 rounded-xl">
              <Plus className="w-5 h-5" />
              Crea il tuo Esperto
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-xl gap-2">
              I miei Esperti
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Come funziona */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Come funziona</h2>
          <p className="text-muted-foreground">Tre passi per trasformare la tua conoscenza in un Esperto AI</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="relative p-8 border-border/60 bg-card h-full">
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted-foreground/10">
                  {idx + 1}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Esperti in vetrina */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Esperti in vetrina</h2>
          <p className="text-muted-foreground">Prova dal vivo come parla un Esperto AI addestrato</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {featured.length === 0 ? (
            <p className="text-sm text-muted-foreground col-span-full text-center">
              Gli Esperti in vetrina appariranno qui a breve.
            </p>
          ) : (
            featured.slice(0, 3).map((expert, idx) => (
              <motion.div
                key={expert.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/e/${expert.slug}`}>
                  <Card className="group p-6 border-border/60 bg-card hover:border-primary/40 hover:shadow-xl transition-all cursor-pointer h-full">
                    <div className="text-4xl mb-4">{expert.icon || "🧠"}</div>
                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">{expert.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{expert.description || expert.discipline}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                      Prova la demo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Use cases */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Per chi è OmniScribe</h2>
          <p className="text-muted-foreground">Monetizza la conoscenza che hai già</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {USE_CASES.map((uc, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-8 border-border/60 bg-card h-full">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <uc.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA finale */}
      <section className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-4 px-4 mb-4 text-muted-foreground text-sm">
          <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary" /> Risposte fondate</span>
          <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-primary" /> Link pubblico</span>
          <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-primary" /> Lead generation</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Pronto a monetizzare la tua conoscenza?</h2>
        <Link to="/create">
          <Button size="lg" className="h-14 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-xl shadow-primary/25 gap-2 rounded-xl">
            <Plus className="w-5 h-5" />
            Crea il tuo Esperto
          </Button>
        </Link>
      </section>
    </div>
  );
}