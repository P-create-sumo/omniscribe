import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import NewMaterialForm from "./NewMaterialForm";
import MaterialCard from "./MaterialCard";
import MaterialDialog from "./MaterialDialog";

export default function StudioPanel({ expert }) {
  const [openMaterial, setOpenMaterial] = useState(null);

  const { data: materials = [], isLoading, refetch } = useQuery({
    queryKey: ["study-materials", expert.id],
    queryFn: async () => {
      const page = await base44.entities.StudyMaterial.filter(
        { expert_id: expert.id },
        { sort: "-created_date", limit: 100 },
      );
      return page.items || [];
    },
  });

  const handleCreated = async () => {
    const result = await refetch();
    const newest = result.data?.[0];
    if (newest) setOpenMaterial(newest);
  };

  const handleDelete = async (material) => {
    await base44.entities.StudyMaterial.delete(material.id);
    if (openMaterial?.id === material.id) setOpenMaterial(null);
    refetch();
  };

  return (
    <div className="space-y-5 overflow-y-auto">
      <NewMaterialForm expert={expert} onCreated={handleCreated} />

      <div>
        <h3 className="font-semibold text-sm mb-3">Materiali generati ({materials.length})</h3>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nessun materiale ancora. Genera il primo quiz, la prima mappa mentale o un audio di sintesi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onOpen={() => setOpenMaterial(material)}
                onDelete={() => handleDelete(material)}
              />
            ))}
          </div>
        )}
      </div>

      <MaterialDialog
        material={openMaterial}
        open={!!openMaterial}
        onOpenChange={(open) => !open && setOpenMaterial(null)}
      />
    </div>
  );
}