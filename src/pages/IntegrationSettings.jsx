import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Plug, Loader2 } from "lucide-react";
import BotChannelCard from "@/components/integrations/BotChannelCard";

const BOT_AGENT = "expert_bot";

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp", emoji: "💬", description: "Rispondi ai clienti dal tuo WhatsApp" },
  { key: "telegram", label: "Telegram", emoji: "✈️", description: "Porta l'Esperto nei tuoi canali Telegram" },
];

export default function IntegrationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["bot-integrations", user?.id],
    queryFn: () => base44.entities.BotIntegration.filter({ created_by_id: user.id }).then((p) => p.items),
    enabled: !!user?.id,
  });

  const save = async (channel, patch) => {
    const existing = records.find((r) => r.channel === channel);
    if (existing) {
      await base44.entities.BotIntegration.update(existing.id, patch);
    } else {
      await base44.entities.BotIntegration.create({
        channel,
        agent_name: BOT_AGENT,
        token: crypto.randomUUID(),
        ...patch,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["bot-integrations", user.id] });
  };

  const handleToggle = async (channel, enabled) => {
    setBusy(channel);
    try {
      await save(channel, { enabled });
    } finally {
      setBusy(null);
    }
  };

  const handleRegenerate = async (channel) => {
    setBusy(channel);
    try {
      await save(channel, { token: crypto.randomUUID() });
    } finally {
      setBusy(null);
    }
  };

  const connectUrl = (channel) =>
    channel === "whatsapp"
      ? base44.agents.getWhatsAppConnectURL(BOT_AGENT)
      : base44.agents.getTelegramConnectURL(BOT_AGENT);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Plug className="w-6 h-6 text-primary" /> Integrazioni
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Attiva i canali del tuo Esperto AI e gestisci i token di integrazione.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Caricamento...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {CHANNELS.map((channel) => (
            <BotChannelCard
              key={channel.key}
              channel={channel}
              record={records.find((r) => r.channel === channel.key)}
              connectUrl={connectUrl(channel.key)}
              onToggle={handleToggle}
              onRegenerate={handleRegenerate}
              busy={busy === channel.key}
            />
          ))}
        </div>
      )}

      <Card className="border-border/60">
        <CardContent className="p-4 text-xs text-muted-foreground">
          Il token identifica la tua integrazione: non condividerlo. Se lo rigeneri, i collegamenti già attivi vanno
          rifatti dal pulsante di connessione del canale.
        </CardContent>
      </Card>
    </div>
  );
}