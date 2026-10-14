import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Sparkles, ArrowRight, RefreshCw, CircleDollarSign, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Paywall({ expert, buyerEmail, onPurchased }) {
  const [email, setEmail] = useState(buyerEmail || "");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const isSubscription = expert.monetization_type === "subscription";
  const price = expert.price || 0;

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setProcessing(true);
    setError(null);

    // Open checkout tab synchronously if in iframe (builder preview)
    const isFramed = window.self !== window.top;
    const checkoutTab = isFramed ? window.open("", "_blank") : null;
    if (isFramed && !checkoutTab) {
      setError("Consenti i popup per procedere al pagamento.");
      setProcessing(false);
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    try {
      const res = await base44.functions.invoke("createCheckoutSession", {
        expert_id: expert.id,
        buyer_email: email.trim(),
      });
      const url = res?.data?.url;
      if (!url) throw new Error(res?.data?.error || "Errore creazione pagamento");

      if (checkoutTab) {
        checkoutTab.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      checkoutTab?.close();
      setError(err.message || "Errore durante il pagamento. Riprova.");
      setProcessing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto pt-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-xl shadow-primary/25">
          {isSubscription ? <RefreshCw className="w-8 h-8 text-white" /> : <CircleDollarSign className="w-8 h-8 text-white" />}
        </div>
        <h2 className="text-2xl font-bold mb-2">Sblocca {expert.name}</h2>
        <p className="text-muted-foreground text-sm">
          {expert.description || `Esperto di ${expert.discipline}.`}
        </p>
      </div>

      {/* Price card */}
      <div className="mb-6 p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-baseline justify-center gap-2 mb-3">
          <span className="text-4xl font-bold">€{price.toFixed(2)}</span>
          {isSubscription && <span className="text-sm text-muted-foreground">/mese</span>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Chat illimitata con l'Esperto AI</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Risposte basate sulla knowledge base dell'autore</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            <span>Fonti sempre citate nelle risposte</span>
          </div>
          {isSubscription && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Disdici quando vuoi, nessun vincolo</span>
            </div>
          )}
        </div>
      </div>

      {/* Email + purchase form */}
      <form onSubmit={handlePurchase} className="space-y-3">
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          className="h-12 text-base"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={processing || !email.trim()}
          className="w-full h-12 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 gap-2"
        >
          {processing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Reindirizzamento a Stripe...</>
          ) : (
            <><Lock className="w-4 h-4" /> {isSubscription ? `Abbonati per €${price.toFixed(2)}/mese` : `Paga €${price.toFixed(2)}`} <ArrowRight className="w-4 h-4" /></>
          )}
        </Button>
      </form>

      <p className="text-[11px] text-muted-foreground text-center mt-4">
        Pagamento sicuro tramite Stripe. La tua email viene usata per attivare l'accesso.
      </p>
    </motion.div>
  );
}