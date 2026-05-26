import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  "quantum computing algorithms",
  "CRISPR gene editing",
  "large language models",
  "climate change mitigation",
  "Kant Critica della Ragion Pura",
  "storia romana imperiale",
  "machine learning healthcare",
  "economia comportamentale",
];

export default function SearchBar({ onSearch, loading, sortBy, onSortChange, limit, onLimitChange }) {
  const [query, setQuery] = useState("");
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Cerca paper, libri, articoli... es. "neural networks", "diritto romano", "Feynman"'
            className="pl-12 h-14 text-base rounded-xl border-border/60 shadow-sm focus-visible:ring-primary/30"
          />
        </div>
        <Button
          type="submit"
          disabled={!query.trim() || loading}
          className="h-14 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-lg shadow-primary/20 text-base font-medium"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`h-14 w-14 rounded-xl flex-shrink-0 ${showOptions ? "bg-primary/5 border-primary/30" : ""}`}
          onClick={() => setShowOptions(!showOptions)}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </Button>
      </form>

      {/* Options */}
      {showOptions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-3 p-4 rounded-xl bg-card border border-border/60"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Ordina per:</span>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Rilevanza</SelectItem>
                <SelectItem value="date">Data (recenti)</SelectItem>
                <SelectItem value="citations">Citazioni</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Risultati per fonte:</span>
            <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center">Cerca ad esempio:</span>
        {SUGGESTIONS.slice(0, 5).map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setQuery(s); onSearch(s); }}
            className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border/40"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}