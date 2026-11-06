import React from "react";

export default function InfographicView({ data }) {
  const stats = data?.stats || [];
  const sections = data?.sections || [];

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:p-6 space-y-5">
      <div>
        <h3 className="text-xl font-bold leading-tight">{data?.title}</h3>
        {data?.subtitle && <p className="text-sm text-muted-foreground mt-1">{data.subtitle}</p>}
      </div>

      {!!stats.length && (
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-xl bg-background/40 border border-border/40 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section, i) => (
          <div key={i} className="rounded-xl bg-background/40 border border-border/40 p-4">
            <p className="font-medium text-sm mb-1">{section.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
          </div>
        ))}
      </div>

      {data?.takeaway && (
        <div className="rounded-xl border-l-2 border-primary bg-primary/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-primary mb-1">Da ricordare</p>
          <p className="text-sm font-medium">{data.takeaway}</p>
        </div>
      )}
    </div>
  );
}