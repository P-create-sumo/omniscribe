import { Outlet, Link, useLocation } from "react-router-dom";
import { Brain, Plus, Home, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent animate-pulse" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">SuperAgents</span>
                <span className="hidden sm:inline text-xs text-muted-foreground ml-2 font-medium">AI Knowledge Experts</span>
              </div>
            </Link>

            <nav className="flex items-center gap-2">
              <Link to="/">
                <Button
                  variant={location.pathname === "/" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              <Link to="/create">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white border-0 shadow-lg shadow-primary/25">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nuovo Agente</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}