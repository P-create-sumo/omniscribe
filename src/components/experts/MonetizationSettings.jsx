import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Euro, Sparkles, RefreshCw, TrendingUp, Users, CircleDollarSign } from "lucide-react";

const MONETIZATION_OPTIONS = [
  { value: "free", label: "Gratuito", description: "Accesso libero (lead generation con email gate)", icon: Sparkles },
  { value: "one_time", label: "Pagamento unico", description: "Il visitatore paga una volta per accesso illimitato", icon: CircleDollarSign },
  { value: "subscription", label: "Abbonamento", description: "Canone mensile per accesso continuativo", icon: RefreshCw },
];

export default function MonetizationSettings({ expert }) {
  const queryClient = useQueryClient();
  const [monetizationType, setMonetizationType] = useState(expert.monetization_type || "free");
  const [price, setPrice] = useState(expert.price?.toString() || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["purchases", expert.id],
    queryFn: () => base44.entities.Purchase.filter({ expert_id: expert.id }),
    enabled: !!expert.id,
  });

  const activePurchases = purchases.filter(
    (p) => p.status === "paid" || p.status === "active"
  );
  const totalRevenue = activePurchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const subscriptionCount = activePurchases.filter((p) => p.type === "subscription").length;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updates = { monetization_type: monetizationType };
      if (monetizationType !== "free") {
        updates.price = parseFloat(price) || 0;
      }
      await base44.entities.Expert.update(expert.id, updates);
      queryClient.invalidateQueries({ queryKey: ["expert", expert.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monetization type selector */}
      <div>
        <h3 className="font-semibold mb-1">Monetizzazione</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Scegli come monetizzare l'accesso a questo Esperto. I pagamenti sono processati tramite Stripe.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MONETIZATION_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = monetizationType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMonetizationType(opt.value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border/60 hover:border-primary/30 bg-muted/20"
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price input */}
      {monetizationType !== "free" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {monetizationType === "subscription" ? "Prezzo mensile (€)" : "Prezzo (€)"}
          </Label>
          <div className="relative max-w-xs">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              step="0.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9.99"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {monetizationType === "subscription"
              ? "Il visitatore verrà addebitato automaticamente ogni mese."
              : "Il visitatore paga una volta e ottiene accesso illimitato a questo Esperto."}
          </p>
        </div>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saved ? "Salvato!" : "Salva impostazioni"}
        </Button>
        {monetizationType !== "free" && !price && (
          <span className="text-xs text-destructive">Inserisci un prezzo</span>
        )}
      </div>

      {/* Revenue stats */}
      {monetizationType !== "free" && (
        <div className="pt-4 border-t border-border/40">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Statistiche vendite
          </h4>
          {purchasesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Caricamento...
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{activePurchases.length}</p>
                <p className="text-[11px] text-muted-foreground">Acquisti attivi</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">{subscriptionCount}</p>
                <p className="text-[11px] text-muted-foreground">Abbonati</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xl font-bold">€{totalRevenue.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">Entrate totali</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}