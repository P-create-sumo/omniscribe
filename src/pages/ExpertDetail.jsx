import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, BookOpen, Settings, ArrowLeft, Trash2, Pencil, Loader2,
  Copy, Check, Globe, Lock, ExternalLink, MessageCircle, Send,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import KnowledgeUploader from "../components/agents/KnowledgeUploader";
import SourcesList from "../components/agents/SourcesList";
import ExpertChat from "../components/experts/ExpertChat";
import { motion } from "framer-motion";

export default function ExpertDetail() {
  const expertId = window.location.pathname.split("/expert/")[1];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("chat");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [copied, setCopied] = useState(false);

  const { data: expert, isLoading } = useQuery({
    queryKey: ["expert", expertId],
    queryFn: async () => {
      const list = await base44.entities.Expert.filter({ id: expertId });
      return list[0];
    },
    enabled: !!expertId,
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["sources", expertId],
    queryFn: () => base44.entities.KnowledgeSource.filter({ agent_id: expertId }),
    enabled: !!expertId,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sources", expertId] });
    queryClient.invalidateQueries({ queryKey: ["expert", expertId] });
  }, [queryClient, expertId]);

  const handleDelete = async () => {
    for (const s of sources) await base44.entities.KnowledgeSource.delete(s.id);
    await base44.entities.Expert.delete(expertId);
    navigate("/dashboard");
  };

  const handleSaveEdit = async () => {
    await base44.entities.Expert.update(expertId, editForm);
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["expert", expertId] });
  };

  const togglePublic = async (val) => {
    await base44.entities.Expert.update(expertId, { is_public: val });
    queryClient.invalidateQueries({ queryKey: ["expert", expertId] });
  };
  const toggleGate = async (val) => {
    await base44.entities.Expert.update(expertId, { email_gate: val });
    queryClient.invalidateQueries({ queryKey: ["expert", expertId] });
  };

  const publicUrl = expert?.slug ? `${window.location.origin}/e/${expert.slug}` : "";
  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!expert) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Esperto non trovato</p>
        <Link to="/dashboard"><Button variant="link" className="mt-2">Torna alla dashboard</Button></Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{expert.icon || "🧠"}</div>
            <div>
              <h1 className="text-xl font-bold">{expert.name}</h1>
              <p className="text-sm text-muted-foreground">{expert.discipline}</p>
            </div>
          </div>
          <Badge className={expert.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}>
            {expert.status === "active" ? "Attivo" : expert.status === "training" ? "In addestramento" : "Bozza"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => { setEditForm({ name: expert.name, discipline: expert.discipline, description: expert.description, tone_of_voice: expert.tone_of_voice, key_skills: expert.key_skills, icon: expert.icon }); setEditing(true); }}>
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare questo Esperto?</AlertDialogTitle>
                <AlertDialogDescription>Verranno eliminati anche tutti i documenti e le conversazioni associate. Azione irreversibile.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Elimina</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {editing && (
        <div className="mb-6 p-6 rounded-xl bg-card border border-border/60 shadow-lg">
          <h3 className="font-semibold mb-4">Modifica Esperto</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Nome" />
              <Input value={editForm.discipline || ""} onChange={(e) => setEditForm({ ...editForm, discipline: e.target.value })} placeholder="Disciplina" />
            </div>
            <Textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Descrizione" className="resize-none" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={editForm.tone_of_voice || ""} onChange={(e) => setEditForm({ ...editForm, tone_of_voice: e.target.value })} placeholder="Tono di voce" />
              <Input value={editForm.key_skills || ""} onChange={(e) => setEditForm({ ...editForm, key_skills: e.target.value })} placeholder="Competenze chiave" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Annulla</Button>
              <Button onClick={handleSaveEdit}>Salva</Button>
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="w-full justify-start bg-muted/30 border border-border/50 rounded-xl p-1 h-auto">
          <TabsTrigger value="chat" className="rounded-lg gap-2 data-[state=active]:shadow-sm"><MessageSquare className="w-4 h-4" /> Chat</TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-lg gap-2 data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4" /> Knowledge Base
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{sources.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg gap-2 data-[state=active]:shadow-sm"><Settings className="w-4 h-4" /> <span className="hidden sm:inline">Condivisione</span></TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-4 border border-border/50 rounded-xl bg-card/50 overflow-hidden">
          <ExpertChat expert={expert} sources={sources} mode="owner" />
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4 space-y-6 overflow-y-auto">
          <KnowledgeUploader agentId={expertId} onSourceAdded={refresh} />
          <div className="bg-card rounded-xl border border-border/60 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Fonti caricate ({sources.length})</h3>
            <SourcesList sources={sources} onDelete={refresh} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border/60 p-6 space-y-6 max-w-2xl">
            <div>
              <h3 className="font-semibold mb-1">Condivisione pubblica</h3>
              <p className="text-sm text-muted-foreground mb-4">Rendi questo Esperto accessibile via link per mostrarlo a prospect o clienti.</p>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Esperto pubblico</p>
                    <p className="text-xs text-muted-foreground">Link condivisibile attivo</p>
                  </div>
                </div>
                <Switch checked={!!expert.is_public} onCheckedChange={togglePublic} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Gate email (lead generation)</p>
                  <p className="text-xs text-muted-foreground">Richiede l'email per accedere alla chat</p>
                </div>
              </div>
              <Switch checked={!!expert.email_gate} onCheckedChange={toggleGate} disabled={!expert.is_public} />
            </div>

            {expert.is_public && (
              <div>
                <Label className="text-sm font-medium">Link pubblico</Label>
                <div className="flex gap-2 mt-2">
                  <Input readOnly value={publicUrl} className="text-sm" />
                  <Button variant="outline" onClick={copyLink} className="gap-2 flex-shrink-0">
                    {copied ? <><Check className="w-4 h-4 text-emerald-500" /> Copiato</> : <><Copy className="w-4 h-4" /> Copia</>}
                  </Button>
                  <Link to={`/e/${expert.slug}`} target="_blank">
                    <Button variant="outline" className="gap-2 flex-shrink-0"><ExternalLink className="w-4 h-4" /> Apri</Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/40">
              <h3 className="font-semibold mb-1">Canali esterni</h3>
              <p className="text-sm text-muted-foreground mb-4">Rendi questo Esperto disponibile come bot su WhatsApp e Telegram. Dopo il collegamento potrai dialogare con i tuoi Esperti direttamente in chat, ovunque tu sia.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a href={base44.agents.getWhatsAppConnectURL('expert_bot')} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2 justify-start"><MessageCircle className="w-4 h-4 text-emerald-500" /> Collega WhatsApp</Button>
                </a>
                <a href={base44.agents.getTelegramConnectURL('expert_bot')} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full gap-2 justify-start"><Send className="w-4 h-4 text-sky-500" /> Collega Telegram</Button>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{expert.conversations_count || 0}</p>
                <p className="text-xs text-muted-foreground">Conversazioni avviate</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{sources.length}</p>
                <p className="text-xs text-muted-foreground">Fonti nella knowledge base</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}