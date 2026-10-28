import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CircleDollarSign, Loader2, Plus, Users, TrendingUp } from "lucide-react";
import StripeAccountCard from "@/components/monetization/StripeAccountCard";
import ExpertMonetizationCard from "@/components/monetization/ExpertMonetizationCard";

export default function MonetizationHub() {
  const { user } = useAuth();

  const { data: experts = [], isLoading } = useQuery({
    queryKey: ["experts", user?.id],
    queryFn: () =>
      base44.entities.Expert.filter({ created_by_id: user.id }, { sort: "-created_date", limit: 100 }).then((p) => p.items),
    enabled: !!user?.id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases", "hub", user?.id],
    queryFn: () =>
      base44.entities.Purchase.filter({ seller_id: user.id }, { sort: "-created_date", limit: 500 }).then((p) => p.items),
    enabled: !!user?.id,
  });

  const active = purchases.filter((p) => p.status === "paid" || p.status === "active");
  const revenue = active.reduce((sum, p) => sum + (p.amount || 0), 0);
  const subscriptions = active.filter((p) => p.type === "subscription").length;
  const paying = experts.filter((e) => (e.monetization_type || "free") !== "free").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CircleDollarSign className="w-6 h-6 text-primary" /> Monetization Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configura prezzi, abbonamenti e verifica lo stato dei pagamenti per tutti i tuoi Esperti.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Entrate totali", value: `€${revenue.toFixed(2)}`, icon: TrendingUp },
          { label: "Acquisti attivi", value: active.length, icon: Users },
          { label: "Abbonati", value: subscriptions, icon: Users },
          { label: "Esperti a pagamento", value: paying, icon: CircleDollarSign },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="p-4">
              <stat.icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <StripeAccountCard />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">I tuoi Esperti</h2>
          <Link to="/create">
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> Nuovo
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Caricamento...
          </div>
        ) : experts.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Non hai ancora creato nessun Esperto.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {experts.map((expert) => (
              <ExpertMonetizationCard key={expert.id} expert={expert} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}