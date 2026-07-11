import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Search, Users, MessagesSquare,
  BarChart3, Settings, LogOut, UserCircle2, Menu, X, Compass,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useConversations, useLeads } from "@/repositories/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/estrategia", label: "Estratégia", icon: Compass },
  { to: "/leads", label: "Leads", icon: Users, badgeKey: "leads" as const },
  { to: "/prospeccao", label: "Prospecção", icon: Search },
  { to: "/atendimentos", label: "Atendimentos", icon: MessagesSquare, badgeKey: "conversas" as const },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/portal", label: "Meu Portal", icon: UserCircle2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { session, signOut, hasRole } = useAuth();
  const { data: leads } = useLeads();
  const { data: conversations } = useConversations();
  const [open, setOpen] = useState(false);

  // Fecha drawer ao trocar de rota
  useEffect(() => { setOpen(false); }, [pathname]);

  const badges = {
    leads: (leads ?? []).filter((l) => !l.lastContactAt).length,
    conversas: (conversations ?? []).reduce((n, c) => n + c.unreadCount, 0),
  };

  const items = NAV.filter((n) => !n.adminOnly || hasRole("admin"));

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
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <Link
              key={item.to}
              to={item.to}
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
        })}
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
      {/* Botão hambúrguer (mobile) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="md:hidden fixed top-3 left-3 z-40 h-10 w-10 rounded-lg border border-border bg-card grid place-items-center text-foreground shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:flex-col w-[232px] border-r border-border bg-sidebar text-sidebar-foreground shrink-0">
        {NavContent}
      </aside>

      {/* Drawer mobile */}
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
