import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { typeMeta } from "./materialTypes";

export default function MaterialCard({ material, onOpen, onDelete }) {
  const meta = typeMeta(material.type);
  const Icon = meta.icon;

  return (
    <div className="group relative rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 transition-colors">
      <button type="button" onClick={onOpen} className="text-left w-full space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary"><Icon className="w-4 h-4" /></div>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{meta.label}</span>
        </div>
        <p className="font-medium text-sm leading-snug line-clamp-2">{material.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{material.topic}</p>
        <p className="text-[11px] text-muted-foreground">
          {new Date(material.created_date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}