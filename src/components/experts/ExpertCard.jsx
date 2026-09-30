import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, ArrowRight, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

const gradients = [
  "from-violet-500/10 to-indigo-500/10",
  "from-rose-500/10 to-pink-500/10",
  "from-emerald-500/10 to-teal-500/10",
  "from-amber-500/10 to-orange-500/10",
  "from-cyan-500/10 to-blue-500/10",
  "from-fuchsia-500/10 to-purple-500/10",
];

const borderGradients = [
  "hover:border-violet-500/30",
  "hover:border-rose-500/30",
  "hover:border-emerald-500/30",
  "hover:border-amber-500/30",
  "hover:border-cyan-500/30",
  "hover:border-fuchsia-500/30",
];

export default function ExpertCard({ expert, index = 0 }) {
  const gradientIdx = index % gradients.length;
  const statusLabel =
    expert.status === "active" ? "Attivo" : expert.status === "training" ? "In addestramento" : "Bozza";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to={`/expert/${expert.id}`}>
        <Card
          className={`group relative overflow-hidden border border-border/60 bg-card hover:shadow-xl transition-all duration-500 cursor-pointer ${borderGradients[gradientIdx]}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradientIdx]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{expert.icon || "🧠"}</div>
              <Badge
                variant="secondary"
                className={
                  expert.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : expert.status === "training"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : ""
                }
              >
                {statusLabel}
              </Badge>
            </div>

            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {expert.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {expert.description || expert.discipline}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {expert.sources_count || 0} fonti
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {expert.conversations_count || 0} conv.
                </span>
                {expert.is_public && (
                  <span className="flex items-center gap-1 text-primary">
                    {expert.email_gate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}