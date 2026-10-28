import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, Check, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

export default function BotChannelCard({ channel, record, connectUrl, onToggle, onRegenerate, busy }) {
  const [copied, setCopied] = useState(false);
  const enabled = !!record?.enabled;
  const token = record?.token || null;

  const copyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
            {channel.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{channel.label}</p>
              <Badge
                variant="outline"
                className={
                  enabled
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
                    : "text-[10px] text-muted-foreground"
                }
              >
                {enabled ? "Attivo" : "Disattivato"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{channel.description}</p>
          </div>
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Switch checked={enabled} onCheckedChange={(v) => onToggle(channel.key, v)} />
          )}
        </div>

        {enabled && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Token di integrazione</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-xs font-mono bg-muted/50 rounded-md px-2 py-1.5">
                  {token || "—"}
                </code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToken} disabled={!token}>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onRegenerate(channel.key)}
                  disabled={!token}
                  title="Rigenera token"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <a href={connectUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="gap-2 w-full">
                Collega il tuo {channel.label} <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}