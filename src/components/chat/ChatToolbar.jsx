import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Mail, Globe, Image, Volume2, Loader2, X, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatToolbar({ agent, messages }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "" });
  const [activePanel, setActivePanel] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [webResult, setWebResult] = useState(null);
  const [webQuery, setWebQuery] = useState("");

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");

  const handleSendEmail = async () => {
    if (!emailForm.to || !lastAssistantMsg) return;
    setLoading("email");
    const body = `Riassunto dalla sessione con ${agent.name} (${agent.discipline}):\n\n${lastAssistantMsg.content}`;
    await base44.integrations.Core.SendEmail({
      to: emailForm.to,
      subject: emailForm.subject || `Riassunto da ${agent.name}`,
      body,
    });
    setLoading(null);
    setActivePanel(null);
    setEmailForm({ to: "", subject: "" });
  };

  const handleWebSearch = async () => {
    if (!webQuery.trim()) return;
    setLoading("web");
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Cerca informazioni aggiornate su: "${webQuery}". Fornisci un riassunto conciso e aggiornato con i punti chiave. Rispondi in italiano.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
    });
    setWebResult(res);
    setLoading(null);
  };

  const handleGenerateImage = async () => {
    if (!lastAssistantMsg) return;
    setLoading("image");
    const res = await base44.integrations.Core.GenerateImage({
      prompt: `Crea un diagramma visivo o un'illustrazione che rappresenti chiaramente i concetti di: "${lastAssistantMsg.content.slice(0, 300)}". Stile: educativo, pulito, infografica professionale.`,
    });
    setGeneratedImage(res.url);
    setLoading(null);
  };

  const handleGenerateSpeech = async () => {
    if (!lastAssistantMsg) return;
    setLoading("speech");
    const text = lastAssistantMsg.content.slice(0, 4000);
    const res = await base44.integrations.Core.GenerateSpeech({
      text,
      voice: "river",
      language_code: "it",
    });
    setAudioUrl(res.url);
    setLoading(null);
  };

  if (messages.length === 0) return null;

  return (
    <div className="border-t border-border/50 bg-card/30">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="font-medium">🛠 Strumenti AI</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-3">
              {/* Tool buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activePanel === "email" ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setActivePanel(activePanel === "email" ? null : "email")}
                >
                  <Mail className="w-3.5 h-3.5" /> Invia email
                </Button>
                <Button
                  variant={activePanel === "web" ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setActivePanel(activePanel === "web" ? null : "web")}
                >
                  <Globe className="w-3.5 h-3.5" /> Cerca sul web
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleGenerateImage}
                  disabled={loading === "image" || !lastAssistantMsg}
                >
                  {loading === "image" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Image className="w-3.5 h-3.5" />}
                  {loading === "image" ? "Generando..." : "Genera immagine"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleGenerateSpeech}
                  disabled={loading === "speech" || !lastAssistantMsg}
                >
                  {loading === "speech" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
                  {loading === "speech" ? "Generando..." : "Ascolta risposta"}
                </Button>
              </div>

              {/* Email panel */}
              <AnimatePresence>
                {activePanel === "email" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <input
                      type="email"
                      placeholder="Email destinatario"
                      value={emailForm.to}
                      onChange={e => setEmailForm(f => ({ ...f, to: e.target.value }))}
                      className="w-full text-xs bg-background border border-border/60 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder={`Oggetto (default: Riassunto da ${agent.name})`}
                      value={emailForm.subject}
                      onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full text-xs bg-background border border-border/60 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">Verrà inviata l'ultima risposta dell'agente</p>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleSendEmail}
                      disabled={loading === "email" || !emailForm.to}
                    >
                      {loading === "email" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                      {loading === "email" ? "Invio..." : "Invia"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Web search panel */}
              <AnimatePresence>
                {activePanel === "web" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Cosa vuoi cercare sul web?"
                        value={webQuery}
                        onChange={e => setWebQuery(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleWebSearch()}
                        className="flex-1 text-xs bg-background border border-border/60 rounded-md px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleWebSearch}
                        disabled={loading === "web" || !webQuery.trim()}
                      >
                        {loading === "web" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cerca"}
                      </Button>
                    </div>
                    {webResult && (
                      <div className="text-xs bg-background rounded-md p-3 border border-border/40 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {webResult}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generated image */}
              {generatedImage && (
                <div className="relative">
                  <img src={generatedImage} alt="Immagine generata" className="rounded-lg w-full max-h-48 object-contain border border-border/40" />
                  <button
                    onClick={() => setGeneratedImage(null)}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <a
                    href={generatedImage}
                    download="immagine_agente.png"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-primary underline block mt-1"
                  >
                    Scarica immagine
                  </a>
                </div>
              )}

              {/* Audio player */}
              {audioUrl && (
                <div className="bg-muted/30 rounded-lg p-2 flex flex-col gap-1">
                  <p className="text-[10px] text-muted-foreground">Lezione vocale generata:</p>
                  <audio controls src={audioUrl} className="w-full h-8" style={{ height: "32px" }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}