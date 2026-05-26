import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileDown, BookPlus, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const SOURCE_COLORS = {
  arxiv: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  semantic_scholar: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  pubmed: "bg-red-500/10 text-red-600 border-red-500/20",
  core: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  openlibrary: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  gutenberg: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  doaj: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
};

export default function ResultCard({ result, index, onAddToAgent }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = SOURCE_COLORS[result.source_key] || "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      className="group bg-card border border-border/60 rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0 mt-0.5">{result.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {result.title}
            </h3>
            {result.authors && result.authors.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {result.authors.join(", ")}
                {result.authors.length === 4 && " et al."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <Badge variant="outline" className={`text-[10px] px-2 py-0 ${colorClass}`}>
            {result.source}
          </Badge>
          {result.year && (
            <span className="text-[10px] text-muted-foreground">{result.year}</span>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {result.type && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0">
            {result.type}
          </Badge>
        )}
        {result.institution && result.institution !== result.source && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0 max-w-[180px] truncate">
            {result.institution}
          </Badge>
        )}
        {result.citations > 0 && (
          <Badge variant="secondary" className="text-[10px] px-2 py-0 gap-1">
            <Quote className="w-2.5 h-2.5" /> {result.citations.toLocaleString()}
          </Badge>
        )}
      </div>

      {/* Abstract */}
      {result.abstract && (
        <div className="mb-3">
          <p className={`text-xs text-muted-foreground leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
            {result.abstract}
          </p>
          {result.abstract.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-primary mt-1 hover:underline"
            >
              {expanded ? "Mostra meno" : "Mostra tutto"}
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        {result.url && (
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
              <ExternalLink className="w-3 h-3" /> Apri
            </Button>
          </a>
        )}
        {result.pdf_url && (
          <a href={result.pdf_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <FileDown className="w-3 h-3" /> PDF
            </Button>
          </a>
        )}
        {onAddToAgent && (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0"
            onClick={() => onAddToAgent(result)}
          >
            <BookPlus className="w-3 h-3" /> Aggiungi ad agente
          </Button>
        )}
      </div>
    </motion.div>
  );
}