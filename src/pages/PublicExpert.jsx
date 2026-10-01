import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import ExpertChat from "../components/experts/ExpertChat";
import { motion } from "framer-motion";

export default function PublicExpert() {
  const slug = window.location.pathname.split("/e/")[1];
  const [email, setEmail] = useState("");
  const [emailGranted, setEmailGranted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const [expert, setExpert] = useState(null);
  const [sources, setSources] = useState([]);
  const [accessRequired, setAccessRequired] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchExpert = async (accessCode) => {
    const res = await base44.functions.invoke("publicExpertAccess", { slug, access_code: accessCode });
    return res.data;
  };

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem(`expert_access_${slug}`);
        const data = await fetchExpert(stored || undefined);
        if (cancelled) return;
        setExpert(data.expert);
        setSources(data.sources || []);
        setAccessRequired(!!data.accessRequired);
        if (data.accessGranted) setAccessGranted(true);
      } catch {
        if (!cancelled) setExpert(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const handleAccess = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const data = await fetchExpert(code.trim());
      if (data.accessGranted) {
        localStorage.setItem(`expert_access_${slug}`, code.trim());
        setExpert(data.expert);
        setSources(data.sources || []);
        setAccessGranted(true);
        setCodeError(false);
      } else {
        setCodeError(true);
      }
    } catch {
      setCodeError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailGrant = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    sessionStorage.setItem(`pub_email_${expert.id}`, email.trim());
    setEmailGranted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold mb-2">Esperto non trovato</h1>
        <p className="text-muted-foreground mb-6">Questo link non è valido o l'Esperto non è più disponibile.</p>
        <Link to="/"><Button variant="outline">Vai su OmniScribe</Button></Link>
      </div>
    );
  }

  const needsAccessGate = accessRequired && !accessGranted;
  const needsEmailGate = expert.email_gate && !emailGranted && !sessionStorage.getItem(`pub_email_${expert.id}`);
  const visitorEmail = sessionStorage.getItem(`pub_email_${expert.id}`);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Public header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{expert.icon || "🧠"}</div>
            <div>
              <h1 className="font-semibold leading-tight">{expert.name}</h1>
              <p className="text-xs text-muted-foreground">{expert.discipline}</p>
            </div>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Powered by OmniScribe
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {needsAccessGate ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto pt-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-xl shadow-primary/25">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Esperto privato</h2>
              <p className="text-muted-foreground text-sm">
                Inserisci il codice d'accesso per parlare con l'esperto.
              </p>
            </div>
            <form onSubmit={handleAccess} className="space-y-3">
              <Input value={code} onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
                placeholder="Codice d'accesso" className="h-12 text-base" />
              {codeError && <p className="text-sm text-destructive">Codice non valido, riprova.</p>}
              <Button type="submit" disabled={submitting || !code.trim()}
                className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Accedi <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </motion.div>
        ) : needsEmailGate ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto pt-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-xl shadow-primary/25">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Accedi a {expert.name}</h2>
              <p className="text-muted-foreground text-sm">
                {expert.description || `Esperto di ${expert.discipline}. Inserisci la tua email per iniziare a chattare.`}
              </p>
            </div>
            <form onSubmit={handleEmailGrant} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="La tua email" className="pl-9 h-12 text-base" />
              </div>
              <Button type="submit" disabled={!email.trim()}
                className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 gap-2">
                <><Sparkles className="w-4 h-4" /> Inizia a chattare <ArrowRight className="w-4 h-4" /></>
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground text-center mt-4">
              La tua email viene usata solo per darti accesso e come contatto per chi ha creato questo Esperto.
            </p>
          </motion.div>
        ) : (
          <div className="h-[calc(100vh-10rem)] border border-border/50 rounded-xl bg-card/50 overflow-hidden">
            <ExpertChat expert={expert} sources={sources} mode="public" visitorEmail={visitorEmail} />
          </div>
        )}
      </main>
    </div>
  );
}