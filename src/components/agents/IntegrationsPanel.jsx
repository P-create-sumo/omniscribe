import React from "react";
import { ExternalLink } from "lucide-react";

const INTEGRATIONS = [
  {
    icon: "📅",
    name: "Google Calendar",
    desc: "Pianifica sessioni di studio, imposta promemoria e gestisci il tuo calendario direttamente dall'agente.",
    color: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    badge: "Connettore OAuth",
    badgeColor: "bg-blue-500/10 text-blue-600",
    link: "https://calendar.google.com",
  },
  {
    icon: "📧",
    name: "Gmail",
    desc: "Ricevi riassunti, report e risposte generate dall'agente direttamente nella tua casella email.",
    color: "from-red-500/10 to-red-500/5 border-red-500/20",
    badge: "Connettore OAuth",
    badgeColor: "bg-red-500/10 text-red-600",
    link: "https://gmail.com",
  },
  {
    icon: "💬",
    name: "Slack",
    desc: "Invia notifiche, riassunti di sessioni e risposte AI direttamente ai canali del tuo team.",
    color: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
    badge: "Connettore OAuth",
    badgeColor: "bg-purple-500/10 text-purple-600",
    link: "https://slack.com",
  },
  {
    icon: "📝",
    name: "Notion",
    desc: "Esporta automaticamente riassunti e note di sessione nelle tue pagine Notion.",
    color: "from-zinc-500/10 to-zinc-500/5 border-zinc-500/20",
    badge: "Connettore OAuth",
    badgeColor: "bg-zinc-500/10 text-zinc-600",
    link: "https://notion.so",
  },
  {
    icon: "🔗",
    name: "HubSpot",
    desc: "Sincronizza conversazioni e attività degli agenti con il tuo CRM per tracciare interazioni con clienti.",
    color: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
    badge: "Connettore OAuth",
    badgeColor: "bg-orange-500/10 text-orange-600",
    link: "https://hubspot.com",
  },
];

export default function IntegrationsPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">Integrazioni esterne</h3>
        <p className="text-xs text-muted-foreground">
          Connetti i tuoi strumenti preferiti per estendere le capacità dell'agente. Le integrazioni OAuth si configurano dalla dashboard.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {INTEGRATIONS.map((intg) => (
          <div
            key={intg.name}
            className={`rounded-xl border bg-gradient-to-br ${intg.color} p-4 flex gap-3`}
          >
            <div className="text-2xl flex-shrink-0">{intg.icon}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm">{intg.name}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${intg.badgeColor}`}>
                  {intg.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{intg.desc}</p>
              <a
                href={intg.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-primary mt-2 hover:underline"
              >
                Apri <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground border border-border/50 rounded-lg px-3 py-2 bg-muted/20">
        💡 Per abilitare le integrazioni OAuth (Google Calendar, Gmail, Slack, Notion, HubSpot) vai su <strong>Dashboard → Impostazioni → Connettori</strong> e autorizza l'accesso.
      </p>
    </div>
  );
}