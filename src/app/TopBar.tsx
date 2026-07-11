import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/repositories/hooks";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title, subtitle, actions }: Props) {
  const { data: notifications } = useNotifications();
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <header className="h-[72px] border-b border-border bg-background/80 backdrop-blur px-6 flex items-center gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-semibold text-foreground leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions}
      <div className="relative hidden lg:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar empresa, lead ou contato…"
          className="h-10 w-[300px] rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
          aria-label="Busca global"
        />
      </div>
      <button
        aria-label={`Notificações${unread ? ` (${unread})` : ""}`}
        className="relative h-10 w-10 rounded-lg border border-border bg-card grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" aria-hidden />
        )}
      </button>
    </header>
  );
}
