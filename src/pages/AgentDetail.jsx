import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare, BookOpen, Settings, ArrowLeft,
  Trash2, Pencil, Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import KnowledgeUploader from "../components/agents/KnowledgeUploader";
import SourcesList from "../components/agents/SourcesList";
import ChatInterface from "../components/chat/ChatInterface";
import { motion } from "framer-motion";

export default function AgentDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = window.location.pathname.split("/agent/")[1];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("chat");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data: agent, isLoading: agentLoading } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      const agents = await base44.entities.SuperAgent.filter({ id: agentId });
      return agents[0];
    },
    enabled: !!agentId,
  });

  const { data: sources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["sources", agentId],
    queryFn: () => base44.entities.KnowledgeSource.filter({ agent_id: agentId }),
    enabled: !!agentId,
  });

  const refreshSources = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sources", agentId] });
    queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
  }, [queryClient, agentId]);

  const handleDelete = async () => {
    for (const source of sources) {
      await base44.entities.KnowledgeSource.delete(source.id);
    }
    await base44.entities.SuperAgent.delete(agentId);
    navigate("/");
  };

  const handleSaveEdit = async () => {
    await base44.entities.SuperAgent.update(agentId, editForm);
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
  };

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Agente non trovato</p>
        <Link to="/">
          <Button variant="link" className="mt-2">Torna alla home</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-8rem)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-3xl">{agent.icon || "🧠"}</div>
            <div>
              <h1 className="text-xl font-bold">{agent.name}</h1>
              <p className="text-sm text-muted-foreground">{agent.discipline}</p>
            </div>
          </div>
          <Badge
            className={agent.status === "active"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
            }
          >
            {agent.status === "active" ? "Attivo" : "Bozza"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => {
              setEditForm({ name: agent.name, discipline: agent.discipline, description: agent.description, icon: agent.icon });
              setEditing(true);
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare questo agente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Verranno eliminati anche tutti i documenti e le conversazioni associate. Questa azione è irreversibile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Edit Dialog */}
      {editing && (
        <div className="mb-6 p-6 rounded-xl bg-card border border-border/60 shadow-lg">
          <h3 className="font-semibold mb-4">Modifica agente</h3>
          <div className="space-y-3">
            <Input
              value={editForm.name || ""}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Nome"
            />
            <Input
              value={editForm.discipline || ""}
              onChange={(e) => setEditForm({ ...editForm, discipline: e.target.value })}
              placeholder="Disciplina"
            />
            <Textarea
              value={editForm.description || ""}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Descrizione"
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Annulla</Button>
              <Button onClick={handleSaveEdit}>Salva</Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="w-full justify-start bg-muted/30 border border-border/50 rounded-xl p-1 h-auto">
          <TabsTrigger value="chat" className="rounded-lg gap-2 data-[state=active]:shadow-sm">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="rounded-lg gap-2 data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4" />
            Knowledge Base
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              {sources.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-4 border border-border/50 rounded-xl bg-card/50 overflow-hidden">
          <ChatInterface agent={agent} sources={sources} />
        </TabsContent>

        <TabsContent value="knowledge" className="mt-4 space-y-6">
          <KnowledgeUploader agentId={agentId} onSourceAdded={refreshSources} />
          <div className="bg-card rounded-xl border border-border/60 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Fonti caricate ({sources.length})
            </h3>
            <SourcesList sources={sources} onDelete={refreshSources} />
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}