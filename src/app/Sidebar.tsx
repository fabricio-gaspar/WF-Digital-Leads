import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Search, Users, MessagesSquare, BarChart3, Settings, LogOut,
  UserCircle2, Menu, X, Building2, FileText, Package, ChevronDown, ChevronRight,
  Sparkles, Target, List, Zap, ArrowRightLeft, Bot, LineChart, Activity,
  Rocket, Briefcase, Compass, Gauge, Megaphone, BookOpen,
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
  novo?: boolean;
  adminOnly?: boolean;
};

// Menu principal (fiel ao mock 4.0)
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/empresa-servicos", label: "Minha Empresa", icon: Building2, novo: true },
  { to: "/prospeccao", label: "Prospecção", icon: Search },
  { to: "/leads", label: "Leads", icon: Users, badgeKey: "leads" },
  { to: "/central", label: "Central", icon: MessagesSquare, badgeKey: "conversas", novo: true },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText, novo: true },
  { to: "/portal", label: "Portal do Vendedor", icon: UserCircle2, novo: true },
  { to: "/pedidos", label: "Pedidos", icon: Package, novo: true },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

// Módulos avançados / motor SDR (mantidos escondidos como "Fase futura")
const NAV_FUTURE: NavItem[] = [
  { to: "/mission-control", label: "Mission Control", icon: Rocket },
  { to: "/perfis-busca", label: "Perfis de Busca", icon: Target },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/cadencias", label: "Cadências", icon: Zap },
  { to: "/simulador", label: "Simulador SDR", icon: Bot },
  { to: "/handoffs", label: "Handoffs", icon: ArrowRightLeft, badgeKey: "handoffs" },
  { to: "/oportunidades", label: "Oportunidades", icon: Briefcase },
  { to: "/relatorios-sdr", label: "Relatórios SDR", icon: LineChart },
  { to: "/observabilidade", label: "Torre de Controle", icon: Activity },
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
    leads: (leads ?? []).length,
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
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors",
          active
            ? "bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)]"
            : "text-[color:var(--muted-foreground)] hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-[16px] w-[16px] shrink-0 opacity-90" />
        <span className="flex-1 truncate">{item.label}</span>
        {badge > 0 && (
          <span className="min-w-[22px] h-[18px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {item.novo && badge === 0 && (
          <span className="text-[9px] tracking-wide px-1.5 py-0.5 rounded-full bg-[#F1ECFE] text-[#6D3FE0] font-bold uppercase">novo</span>
        )}
      </Link>
    );
  };

  const NavContent = (
    <>
      <div className="px-4 py-[18px] border-b border-border/70 flex items-center gap-2.5">
        <div className="h-[34px] w-[34px] rounded-[9px] bg-primary text-primary-foreground grid place-items-center font-bold text-[12px]">WF</div>
        <div className="leading-tight flex-1 min-w-0">
          <div className="text-[14px] font-bold text-foreground truncate">WF Digital</div>
          <div className="text-[11px] text-muted-foreground truncate">CRM &amp; Prospecção</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="md:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <div className="text-[10px] tracking-[.09em] font-semibold text-muted-foreground/70 px-3 pb-2 pt-1 uppercase">Menu Principal</div>
        <div className="space-y-0.5">{items.map(renderLink)}</div>

        <div className="pt-3 mt-3 border-t border-border/60">
          <button
            onClick={() => setFutureOpen((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] uppercase tracking-[.09em] font-semibold text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors"
            aria-expanded={futureOpen}
            data-testid="nav-future-toggle"
          >
            {futureOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Sparkles className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Motor SDR (avançado)</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground normal-case tracking-normal">{NAV_FUTURE.length}</span>
          </button>
          {futureOpen && (
            <div className="mt-1 space-y-0.5 pl-1 border-l-2 border-border ml-3">
              {NAV_FUTURE.map(renderLink)}
            </div>
          )}
        </div>
      </nav>

      <div className="mt-auto border-t border-border/70 px-4 py-3.5 flex items-center gap-2.5">
        {session && (
          <>
            <div className="h-[30px] w-[30px] rounded-lg bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)] grid place-items-center text-[11px] font-bold">
              {session.user.avatarInitials}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-[13px] font-semibold text-foreground truncate">{session.user.name}</div>
              <div className="text-[11px] text-muted-foreground capitalize truncate">{session.user.role === "admin" ? "Administrador" : session.user.role}</div>
            </div>
            <button
              onClick={signOut}
              aria-label="Sair"
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
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

      <aside data-testid="app-sidebar" className="hidden md:flex md:flex-col w-[230px] border-r border-border bg-sidebar text-sidebar-foreground shrink-0 sticky top-0 h-screen">
        {NavContent}
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <aside className="relative flex flex-col w-[260px] max-w-[85vw] bg-sidebar text-sidebar-foreground border-r border-border shadow-xl animate-in slide-in-from-left">
            {NavContent}
          </aside>
        </div>
      )}
    </>
  );
}
