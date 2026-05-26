import ResultCard from "./ResultCard";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

export default function SearchResults({ results, query, onAddToAgent }) {
  if (!results || results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-muted-foreground"
      >
        <SearchX className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-medium">Nessun risultato per "{query}"</p>
        <p className="text-sm mt-1">Prova con termini diversi o seleziona altre fonti</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {results.map((result, idx) => (
        <ResultCard key={result.id} result={result} index={idx} onAddToAgent={onAddToAgent} />
      ))}
    </motion.div>
  );
}