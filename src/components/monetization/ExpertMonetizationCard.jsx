import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings2 } from "lucide-react";
import MonetizationSettings from "@/components/experts/MonetizationSettings";

const LABELS = { free: "Gratuito", one_time: "Pagamento unico", subscription: "Abbonamento" };

export default function ExpertMonetizationCard({ expert }) {
  const [open, setOpen] = useState(false);
  const price = expert.price ? ` · €${expert.price}` : "";

  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
            {expert.icon || "🧠"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{expert.name}</p>
            <p className="text-xs text-muted-foreground truncate">{expert.discipline}</p>
          </div>
          <Badge variant="outline" className="text-[11px] hidden sm:inline-flex">
            {LABELS[expert.monetization_type] || "Gratuito"}
            {price}
          </Badge>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setOpen((v) => !v)}>
            <Settings2 className="w-4 h-4" />
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {open && (
          <div className="mt-5 pt-5 border-t border-border/40">
            <MonetizationSettings expert={expert} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}