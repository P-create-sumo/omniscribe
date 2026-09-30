import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard } from "lucide-react";
import ExpertCard from "../components/experts/ExpertCard";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: experts = [], isLoading } = useQuery({
    queryKey: ["experts"],
    queryFn: () => base44.entities.Expert.list("-created_date"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </div>
          <h1 className="text-2xl font-bold tracking-tight">I miei Esperti</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {experts.length} {experts.length === 1 ? "esperto creato" : "esperti creati"}
          </p>
        </div>
        <Link to="/create">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" />
            Crea Esperto
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Nessun Esperto ancora</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Crea il tuo primo Esperto AI caricando un libro, un manuale o il tuo metodo.
          </p>
          <Link to="/create">
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0">
              <Plus className="w-4 h-4" /> Crea il tuo primo Esperto
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experts.map((expert, idx) => (
            <ExpertCard key={expert.id} expert={expert} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}