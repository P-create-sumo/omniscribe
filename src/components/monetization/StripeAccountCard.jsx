import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function StripeAccountCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["stripe-account-status"],
    queryFn: async () => (await base44.functions.invoke("stripeAccountStatus", {})).data,
    retry: false,
  });

  const connected = !!data?.connected;
  const live = data?.mode === "live";

  return (
    <Card className="border-border/60 shadow-lg">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Account Stripe</p>
            <p className="text-xs text-muted-foreground">Incassi dei tuoi Esperti e abbonamenti</p>
          </div>
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Badge
              variant="outline"
              className={
                connected
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"
              }
            >
              {connected ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {connected ? (live ? "Collegato · Live" : "Collegato · Test") : "Non collegato"}
            </Badge>
          )}
        </div>

        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          {connected && (
            <p>
              {data?.business_name ? `${data.business_name} · ` : ""}
              {data?.country || ""} {data?.currency ? `· ${data.currency}` : ""} ·{" "}
              {data?.charges_enabled ? "pagamenti attivi" : "pagamenti non ancora attivi"}
            </p>
          )}
          <p>
            I pagamenti passano dall'account Stripe del workspace. Per collegare il tuo account o passare in modalità
            live vai su <strong>Dashboard → Integrazioni → Stripe</strong>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}