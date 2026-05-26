import React, { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import SearchBar from "../components/search/SearchBar";
import SourceFilters from "../components/search/SourceFilters";
import SearchResults from "../components/search/SearchResults";
import SearchStats from "../components/search/SearchStats";
import AddToAgentModal from "../components/search/AddToAgentModal";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Sparkles, GraduationCap } from "lucide-react";

export default function AcademicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState([
    "arxiv", "semantic_scholar", "openlibrary", "pubmed", "core", "gutenberg", "doaj"
  ]);
  const [sortBy, setSortBy] = useState("relevance");
  const [limit, setLimit] = useState(8);
  const [activeSource, setActiveSource] = useState("all");
  const [addModal, setAddModal] = useState({ open: false, result: null });

  const handleSearch = useCallback(async (q) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setResults(null);
    setActiveSource("all");
    const response = await base44.functions.invoke("academicSearch", {
      query: q.trim(),
      sources: selectedSources,
      limit,
      sortBy,
    });
    setResults(response.data);
    setLoading(false);
  }, [selectedSources, sortBy, limit]);

  const allResults = results
    ? Object.values(results.results || {}).flat()
    : [];

  const filteredResults = activeSource === "all"
    ? allResults
    : (results?.results?.[activeSource] || []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4 pb-2"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-sm text-primary font-medium mb-4">
          <GraduationCap className="w-4 h-4" />
          Ricerca Accademica Avanzata
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Cerca nelle migliori
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> istituzioni del mondo</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
          arXiv · Semantic Scholar · PubMed · CORE · Open Library · Project Gutenberg · DOAJ — 300M+ documenti accademici open-access
        </p>
      </motion.div>

      {/* Search bar */}
      <SearchBar
        onSearch={handleSearch}
        loading={loading}
        sortBy={sortBy}
        onSortChange={setSortBy}
        limit={limit}
        onLimitChange={setLimit}
      />

      {/* Source filters */}
      <SourceFilters
        selectedSources={selectedSources}
        onToggle={(key) => {
          setSelectedSources(prev =>
            prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
          );
        }}
        sourcesMeta={results?.sources_meta || null}
      />

      {/* Stats */}
      {results && !loading && (
        <SearchStats
          results={results}
          activeSource={activeSource}
          onSourceChange={setActiveSource}
          filteredCount={filteredResults.length}
        />
      )}

      {/* Results */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />
            </div>
            <div className="text-center">
              <p className="font-medium">Ricerca in corso...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Interrogando {selectedSources.length} fonti accademiche simultaneamente
              </p>
            </div>
          </motion.div>
        )}

        {!loading && results && (
          <SearchResults
            key="results"
            results={filteredResults}
            query={results.query}
            onAddToAgent={(result) => setAddModal({ open: true, result })}
          />
        )}

        {!loading && !results && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4"
          >
            {[
              { icon: "📐", source: "arXiv", desc: "Preprint in fisica, matematica, informatica, biologia quantistica", count: "2M+ paper" },
              { icon: "🔬", source: "Semantic Scholar", desc: "AI-powered search su 200 milioni di paper accademici", count: "200M+ paper" },
              { icon: "⚕️", source: "PubMed", desc: "Letteratura biomedica e delle scienze della vita", count: "35M+ articoli" },
              { icon: "🎓", source: "CORE", desc: "Repository open-access di università e istituti di ricerca", count: "200M+ paper" },
              { icon: "📖", source: "Open Library", desc: "Libri digitalizzati e open-access da Internet Archive", count: "20M+ libri" },
              { icon: "📜", source: "Project Gutenberg", desc: "Classici letterari liberi da copyright di tutto il mondo", count: "60K+ testi" },
            ].map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-xl bg-card border border-border/60 hover:shadow-md transition-shadow"
              >
                <div className="text-2xl mb-2">{src.icon}</div>
                <div className="font-semibold text-sm mb-1">{src.source}</div>
                <div className="text-xs text-muted-foreground mb-2">{src.desc}</div>
                <div className="text-xs font-medium text-primary">{src.count}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <AddToAgentModal
        result={addModal.result}
        open={addModal.open}
        onClose={() => setAddModal({ open: false, result: null })}
      />
    </div>
  );
}