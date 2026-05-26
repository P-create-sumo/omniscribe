import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, ArrowRight } from "lucide-react";
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

export default function AgentCard({ agent, index = 0 }) {
  const gradientIdx = index % gradients.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to={`/agent/${agent.id}`}>
        <Card className={`group relative overflow-hidden border border-border/60 bg-card hover:shadow-xl transition-all duration-500 cursor-pointer ${borderGradients[gradientIdx]}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradientIdx]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{agent.icon || "🧠"}</div>
              <Badge
                variant={agent.status === "active" ? "default" : "secondary"}
                className={agent.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
              >
                {agent.status === "active" ? "Attivo" : agent.status === "processing" ? "In elaborazione" : "Bozza"}
              </Badge>
            </div>

            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
              {agent.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {agent.description || agent.discipline}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {agent.sources_count || 0} fonti
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}