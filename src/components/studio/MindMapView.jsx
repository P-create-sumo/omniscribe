import React from "react";

export default function MindMapView({ data }) {
  const branches = data?.branches || [];
  if (!data?.root) return <p className="text-sm text-muted-foreground">Mappa non disponibile.</p>;

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-center shadow-lg">
          {data.root}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {branches.map((branch, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/40 to-card p-4">
            <p className="font-medium text-sm mb-2">{branch.label}</p>
            <ul className="space-y-1.5">
              {(branch.children || []).map((child, j) => (
                <li key={j} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary">–</span>{child}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}