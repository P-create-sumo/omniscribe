import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles, User, Download, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import ChatToolbar from "./ChatToolbar";

export default function ChatInterface({ agent, sources }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContext = () => {
    const knowledgeTexts = (sources || [])
      .filter(s => s.extracted_text)
      .map(s => `--- ${s.title} ---\n${s.extracted_text}`)
      .join("\n\n");

    return `Sei "${agent.name}", un esperto di ${agent.discipline}. ${agent.description || ""}

La tua knowledge base contiene i seguenti materiali:

${knowledgeTexts || "Nessun materiale caricato ancora."}

ISTRUZIONI:
- Rispondi SEMPRE basandoti sulla knowledge base fornita
- Se la risposta non è nella knowledge base, dillo chiaramente
- Cita i riferimenti specifici quando possibile (nome del libro/documento, capitolo)
- Rispondi in modo approfondito, come un vero esperto della materia
- Usa un tono professionale ma accessibile
- Se appropriato, fornisci esempi pratici
- Rispondi nella lingua in cui l'utente ti scrive`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const context = buildContext();
    const chatHistory = [...messages, userMsg]
      .map(m => `${m.role === "user" ? "Utente" : "Assistente"}: ${m.content}`)
      .join("\n\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${context}\n\n--- CONVERSAZIONE ---\n${chatHistory}`,
      model: "claude_sonnet_4_6",
    });

    setMessages(prev => [...prev, { role: "assistant", content: response }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [summarizing, setSummarizing] = useState(false);

  const generateSummaryPDF = async () => {
    if (messages.length === 0) return;
    setSummarizing(true);

    const chatText = messages
      .map(m => `${m.role === "user" ? "Domanda" : "Risposta"}: ${m.content}`)
      .join("\n\n");

    const summary = await base44.integrations.Core.InvokeLLM({
      prompt: `Analizza questa sessione di chat con un esperto di "${agent.discipline}" e produci un riassunto strutturato dei concetti chiave.

SESSIONE:
${chatText}

Produci un documento con:
1. CONCETTI CHIAVE (lista puntata dei concetti principali emersi)
2. PUNTI IMPORTANTI (approfondimenti e dettagli rilevanti)
3. DA RICORDARE (3-5 takeaway fondamentali della sessione)

Sii conciso ma esaustivo. Rispondi in italiano.`,
      response_json_schema: {
        type: "object",
        properties: {
          concetti_chiave: { type: "array", items: { type: "string" } },
          punti_importanti: { type: "array", items: { type: "string" } },
          da_ricordare: { type: "array", items: { type: "string" } },
        }
      }
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;
    let y = 22;

    // Title
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 14, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${agent.icon || "🧠"} ${agent.name} — Riassunto Sessione`, margin, 9.5);

    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), margin, y);
    y += 10;

    const printSection = (title, items, color) => {
      if (!items || items.length === 0) return;
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...color);
      doc.text(title, margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      items.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, maxWidth - 4);
        lines.forEach((line) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin + 2, y);
          y += 6;
        });
        y += 1;
      });
      y += 5;
    };

    printSection("📌 Concetti Chiave", summary.concetti_chiave, [79, 70, 229]);
    printSection("💡 Punti Importanti", summary.punti_importanti, [16, 185, 129]);
    printSection("⭐ Da Ricordare", summary.da_ricordare, [245, 158, 11]);

    doc.save(`${agent.name}_riassunto_${new Date().toISOString().slice(0, 10)}.pdf`);
    setSummarizing(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Conversazione con ${agent.name}`, margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Esperto di ${agent.discipline} · ${new Date().toLocaleDateString("it-IT")}`, margin, y);
    y += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    doc.setTextColor(0, 0, 0);

    messages.forEach((msg) => {
      const isUser = msg.role === "user";
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(isUser ? 79 : 124, isUser ? 70 : 58, isUser ? 229 : 237);
      doc.text(isUser ? "Tu" : agent.name, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(msg.content, maxWidth);
      lines.forEach((line) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 6;
      });
      y += 4;
      if (y > 270) { doc.addPage(); y = 20; }
    });

    doc.save(`${agent.name}_conversazione.pdf`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
              <span className="text-3xl">{agent.icon || "🧠"}</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">Ciao! Sono {agent.name}</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Esperto di {agent.discipline}. Chiedimi qualsiasi cosa basata sui materiali nella mia knowledge base.
            </p>
            {(!sources || sources.length === 0) && (
              <p className="text-xs text-amber-600 mt-3 bg-amber-500/10 px-3 py-1.5 rounded-full">
                Carica dei documenti per iniziare
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, idx) => (
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
                  <div className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Sto pensando...
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Tools */}
      <ChatToolbar agent={agent} messages={messages} />

      {/* Export button */}
      {messages.length > 0 && (
        <div className="border-t border-border/50 px-4 pt-3 pb-0 flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSummaryPDF}
            disabled={summarizing}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {summarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            {summarizing ? "Generando..." : "Riassunto PDF"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportToPDF}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
            Scarica chat
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
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
          Le risposte si basano sui documenti caricati nella knowledge base. Usa un modello avanzato per risposte di alta qualità.
        </p>
      </div>
    </div>
  );
}