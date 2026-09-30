import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, User, BookMarked } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

const uid = () => (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));

function parseCitations(text) {
  const m = text.match(/\n?📚\s*Fonti:\s*(.+)/i);
  if (!m) return { content: text, citations: [] };
  const citations = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  const content = text.replace(m[0], "").trim();
  return { content, citations };
}

export default function ExpertChat({ expert, sources = [], mode = "owner", visitorEmail }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const key = mode === "public" ? `pub_conv_${expert.id}` : `own_conv_${expert.id}`;
      let id = sessionStorage.getItem(key);
      if (!id) {
        const conv = await base44.entities.Conversation.create({
          expert_id: expert.id,
          is_public: mode === "public",
          visitor_email: visitorEmail || "",
          session_id: uid(),
          messages_count: 0,
        });
        id = conv.id;
        sessionStorage.setItem(key, id);
        if (mode === "public") {
          await base44.entities.Expert.update(expert.id, {
            conversations_count: (expert.conversations_count || 0) + 1,
          });
        }
      }
      if (cancelled) return;
      setConvId(id);
      try {
        const msgs = await base44.entities.Message.filter({ conversation_id: id });
        const sorted = [...msgs].sort((a, b) =>
          String(a.created_date || "").localeCompare(String(b.created_date || ""))
        );
        if (!cancelled) setMessages(sorted);
      } catch {
        if (!cancelled) setMessages([]);
      }
      if (!cancelled) setInitializing(false);
    })();
    return () => { cancelled = true; };
  }, [expert.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const buildContext = () => {
    const knowledge = (sources || [])
      .filter((s) => s.extracted_text)
      .map((s) => `--- ${s.title} ---\n${s.extracted_text}`)
      .join("\n\n");
    const index = (sources || []).map((s, i) => `[${i + 1}] ${s.title}`).join("\n");
    return `Sei "${expert.name}", un esperto di ${expert.discipline}. ${expert.description || ""}
${expert.tone_of_voice ? `Tono di voce: ${expert.tone_of_voice}.` : ""}
${expert.key_skills ? `Competenze chiave: ${expert.key_skills}.` : ""}

DOCUMENTI NELLA KNOWLEDGE BASE:
${index || "Nessun documento."}

CONTENUTO:
${knowledge || "Nessun contenuto disponibile."}

ISTRUZIONI:
- Rispondi SOLO in base alla knowledge base sopra
- Se l'informazione non è presente, dillo chiaramente
- Cita sempre il documento sorgente da cui derivi la risposta
- Sii approfondito e professionale
- Alla FINE della risposta aggiungi una riga nel formato ESATTO:
📚 Fonti: <titolo1>, <titolo2>
- Rispondi nella lingua dell'utente`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !convId) return;
    const text = input.trim();
    const userMsg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    await base44.entities.Message.create({ conversation_id: convId, role: "user", content: text });

    const context = buildContext();
    const history = [...messages, userMsg]
      .map((m) => `${m.role === "user" ? "Utente" : "Esperto"}: ${m.content}`)
      .join("\n\n");

    let response = "";
    try {
      response = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}\n\n--- CONVERSAZIONE ---\n${history}`,
      });
    } catch {
      response = "Spiacente, si è verificato un errore temporaneo. Riprova.";
    }

    const { content, citations } = parseCitations(response);
    const aMsg = { role: "assistant", content, source_reference: citations.join(", ") };
    setMessages((p) => [...p, aMsg]);
    await base44.entities.Message.create({
      conversation_id: convId,
      role: "assistant",
      content,
      source_reference: citations.join(", "),
    });
    await base44.entities.Conversation.update(convId, { messages_count: messages.length + 2 });
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getCitations = (msg) =>
    msg.citations || (msg.source_reference ? msg.source_reference.split(",").map((s) => s.trim()).filter(Boolean) : []);

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
              <span className="text-3xl">{expert.icon || "🧠"}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Ciao! Sono {expert.name}</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Esperto di {expert.discipline}. Chiedimi qualsiasi cosa basata sui materiali nella mia knowledge base.
            </p>
            {(!sources || sources.length === 0) && (
              <p className="text-xs text-amber-500 mt-3 bg-amber-500/10 px-3 py-1.5 rounded-full">
                Carica dei documenti per attivare le risposte fondate
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => {
            const cites = getCitations(msg);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border/60 shadow-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                  {msg.role === "assistant" && cites.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 w-full mb-0.5">
                        <BookMarked className="w-3 h-3" /> Fonti citate:
                      </span>
                      {cites.map((c, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sto consultando le fonti...
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scrivi il tuo messaggio..."
            className="min-h-[44px] max-h-[160px] resize-none text-base rounded-xl border-border/60"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 flex-shrink-0 shadow-lg shadow-primary/25"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Le risposte si basano sui documenti caricati e citano sempre la fonte.
        </p>
      </div>
    </div>
  );
}