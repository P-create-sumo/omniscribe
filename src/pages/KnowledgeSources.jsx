import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import SourceRow from "@/components/knowledge/SourceRow";

export default function KnowledgeSources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expertFilter, setExpertFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["knowledge-sources", user?.id],
    queryFn: () =>
      base44.entities.KnowledgeSource.filter({ created_by_id: user.id }, { sort: "-created_date", limit: 200 }).then(
        (p) => p.items,
      ),
    enabled: !!user?.id,
  });

  const { data: experts = [] } = useQuery({
    queryKey: ["experts", user?.id],
    queryFn: () =>
      base44.entities.Expert.filter({ created_by_id: user.id }, { sort: "-created_date", limit: 100 }).then((p) => p.items),
    enabled: !!user?.id,
  });

  const expertNames = Object.fromEntries(experts.map((e) => [e.id, e.name]));
  const expertOptions = experts.filter((e) => sources.some((s) => s.agent_id === e.id));

  const visible = sources.filter((s) => {
    if (expertFilter !== "all" && s.agent_id !== expertFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (query.trim() && !(s.title || "").toLowerCase().includes(query.trim().toLowerCase())) return false;
    return true;
  });

  const handleReprocess = async (source) => {
    setBusyId(source.id);
    setError(null);
    try {
      const res = await base44.functions.invoke("reprocessKnowledgeSource", { source_id: source.id });
      if (res?.data?.error) throw new Error(res.data.error);
    } catch (err) {
      setError(err.message || "Riprocessamento non riuscito.");
    } finally {
      queryClient.invalidateQueries({ queryKey: ["knowledge-sources", user.id] });
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" /> Knowledge Sources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tutti i file caricati, lo stato di indicizzazione e il riprocessamento.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <strong className="text-foreground">{visible.length}</strong> di {sources.length} fonti
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input placeholder="Cerca per titolo..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select value={expertFilter} onValueChange={setExpertFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Esperto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli Esperti</SelectItem>
            {expertOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="processing">In elaborazione</SelectItem>
            <SelectItem value="uploading">In caricamento</SelectItem>
            <SelectItem value="error">Errore</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Card className="border-border/60">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Caricamento...
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RefreshCw className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nessuna fonte trovata con questi filtri.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  expertName={expertNames[source.agent_id]}
                  onReprocess={handleReprocess}
                  busy={busyId === source.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}