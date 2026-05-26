import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const SOURCE_LABELS = {
  arxiv: { icon: "📐", label: "arXiv" },
  semantic_scholar: { icon: "🔬", label: "Semantic Scholar" },
  pubmed: { icon: "⚕️", label: "PubMed" },
  core: { icon: "🎓", label: "CORE" },
  openlibrary: { icon: "📖", label: "Open Library" },
  gutenberg: { icon: "📜", label: "Gutenberg" },
  doaj: { icon: "📋", label: "DOAJ" },
};

export default function SearchStats({ results, activeSource, onSourceChange, filteredCount }) {
  const allCount = Object.values(results.results || {}).flat().length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      <button
        onClick={() => onSourceChange("all")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          activeSource === "all"
            ? "bg-foreground text-background border-transparent"
            : "bg-card text-muted-foreground border-border/50 hover:border-border"
        }`}
      >
        Tutti
        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${activeSource === "all" ? "bg-background/20 text-background" : ""}`}>
          {allCount}
        </Badge>
      </button>

      {Object.entries(results.results || {}).map(([key, items]) => {
        if (!items || items.length === 0) return null;
        const meta = SOURCE_LABELS[key] || { icon: "📄", label: key };
        return (
          <button
            key={key}
            onClick={() => onSourceChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              activeSource === key
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border/50 hover:border-border"
            }`}
          >
            <span>{meta.icon}</span>
            <span className="hidden sm:inline">{meta.label}</span>
            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${activeSource === key ? "bg-primary/10 text-primary" : ""}`}>
              {items.length}
            </Badge>
          </button>
        );
      })}

      <span className="text-xs text-muted-foreground ml-2">
        {filteredCount} risultati visualizzati
      </span>
    </motion.div>
  );
}