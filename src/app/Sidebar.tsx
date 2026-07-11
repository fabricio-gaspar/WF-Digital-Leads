import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Search, Users, MessagesSquare,
  BarChart3, Settings, LogOut, UserCircle2, Menu, X,
  Building2, Target, List, Megaphone, Zap, ArrowRightLeft, BookOpen,
  Bot, LineChart, ChevronDown, ChevronRight, Sparkles, Compass, Gauge, Activity,
  Rocket, Briefcase, FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useConversations, useLeads } from "@/repositories/hooks";
import { useHandoffs } from "@/domain/sdrVirtual";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "leads" | "conversas" | "handoffs";
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mission-control", label: "Mission Control", icon: Rocket },
  { to: "/prospeccao", label: "Buscar Leads", icon: Search },
  { to: "/perfis-busca", label: "Perfis de Busca", icon: Target },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/leads", label: "Leads", icon: Users, badgeKey: "leads" },
  { to: "/cadencias", label: "Cadências", icon: Zap },
  { to: "/central", label: "Central", icon: MessagesSquare, badgeKey: "conversas" },
  { to: "/simulador", label: "Simulador SDR", icon: Bot },
  { to: "/handoffs", label: "Handoffs", icon: ArrowRightLeft, badgeKey: "handoffs" },
  { to: "/oportunidades", label: "Oportunidades", icon: Briefcase },
  { to: "/orcamentos", label: "Orçamentos (CPQ)", icon: FileText },
  { to: "/empresa-servicos", label: "Empresa & Serviços", icon: Building2 },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/relatorios-sdr", label: "Relatórios SDR", icon: LineChart },
  { to: "/observabilidade", label: "Observabilidade", icon: Activity },
  { to: "/portal", label: "Meu Portal", icon: UserCircle2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

// Módulos v2 / fase futura — mantidos mas colapsáveis
const NAV_FUTURE: NavItem[] = [
  { to: "/estrategia", label: "Estratégia (ICP)", icon: Compass },
  { to: "/scoring", label: "Scoring", icon: Gauge },
  { to: "/campanhas", label: "Campanhas", icon: Megaphone },
  { to: "/playbooks", label: "Playbooks", icon: BookOpen },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, signOut, hasRole } = useAuth();
  const { data: leads } = useLeads();
  const { data: conversations } = useConversations();
  const handoffsList = useHandoffs();
  const [open, setOpen] = useState(false);
  const futureIsActive = NAV_FUTURE.some((n) => pathname === n.to || pathname.startsWith(n.to + "/"));
  const [futureOpen, setFutureOpen] = useState(futureIsActive);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => { if (futureIsActive) setFutureOpen(true); }, [futureIsActive]);

  const badges: Record<"leads" | "conversas" | "handoffs", number> = {
    leads: (leads ?? []).filter((l) => !l.lastContactAt).length,
    conversas: (conversations ?? []).reduce((n, c) => n + c.unreadCount, 0),
    handoffs: handoffsList.filter((h) => h.status === "Aguardando vendedor").length,
  };

  const items = NAV.filter((n) => !n.adminOnly || hasRole("admin"));

  const renderLink = (item: NavItem) => {
    const Icon = item.icon;
    const active = pathname === item.to || pathname.startsWith(item.to + "/");
    const badge = item.badgeKey ? badges[item.badgeKey] : 0;
    return (
      <Link
        key={item.to}
        to={item.to}
        data-testid={`nav-${item.to.slice(1)}`}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-[18px] w-[18px] shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {badge > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  const NavContent = (
    <>
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold text-sm shadow-sm">WF</div>
          <div className="leading-tight flex-1">
            <div className="text-[13px] font-semibold text-foreground">WF Digital</div>
            <div className="text-[11px] text-muted-foreground">CRM &amp; Prospecção</div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {items.map(renderLink)}

        <div className="pt-2 mt-2 border-t border-sidebar-border">
          <button
            onClick={() => setFutureOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-expanded={futureOpen}
            data-testid="nav-future-toggle"
          >
            {futureOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Sparkles className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Fase futura (v2)</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground normal-case tracking-normal">{NAV_FUTURE.length}</span>
          </button>
          {futureOpen && (
            <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-border ml-3">
              {NAV_FUTURE.map(renderLink)}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {session && (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-2.5">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
              {session.user.avatarInitials}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-[13px] font-medium text-foreground truncate">{session.user.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize">{session.user.role}</div>
            </div>
            <button
              onClick={signOut}
              aria-label="Sair"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="md:hidden fixed top-3 left-3 z-40 h-10 w-10 rounded-lg border border-border bg-card grid place-items-center text-foreground shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside data-testid="app-sidebar" className="hidden md:flex md:flex-col w-[232px] border-r border-border bg-sidebar text-sidebar-foreground shrink-0">
        {NavContent}
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex flex-col w-[260px] max-w-[85vw] bg-sidebar text-sidebar-foreground border-r border-border shadow-xl animate-in slide-in-from-left">
            {NavContent}
          </aside>
        </div>
      )}
    </>
  );
}
