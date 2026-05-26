import { motion } from "framer-motion";

const ALL_SOURCES = [
  { key: "arxiv", icon: "📐", label: "arXiv", sublabel: "Fisica, Matematica, CS" },
  { key: "semantic_scholar", icon: "🔬", label: "Semantic Scholar", sublabel: "200M paper" },
  { key: "pubmed", icon: "⚕️", label: "PubMed", sublabel: "Medicina, Bio" },
  { key: "core", icon: "🎓", label: "CORE", sublabel: "Open Access" },
  { key: "openlibrary", icon: "📖", label: "Open Library", sublabel: "Libri" },
  { key: "gutenberg", icon: "📜", label: "Gutenberg", sublabel: "Classici" },
  { key: "doaj", icon: "📋", label: "DOAJ", sublabel: "Riviste" },
];

export default function SourceFilters({ selectedSources, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="flex flex-wrap gap-2"
    >
      <span className="text-xs text-muted-foreground self-center">Fonti:</span>
      {ALL_SOURCES.map((src) => {
        const active = selectedSources.includes(src.key);
        return (
          <button
            key={src.key}
            onClick={() => onToggle(src.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              active
                ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                : "bg-card text-muted-foreground border-border/50 hover:border-border"
            }`}
          >
            <span>{src.icon}</span>
            <span>{src.label}</span>
            <span className={`hidden sm:inline ${active ? "text-primary/60" : "text-muted-foreground/60"}`}>
              · {src.sublabel}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}