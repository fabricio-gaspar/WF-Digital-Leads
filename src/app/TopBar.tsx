import { Bell } from "lucide-react";
import { useNotifications } from "@/repositories/hooks";
import { GlobalSearch } from "@/components/GlobalSearch";
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
    <header className="h-[72px] border-b border-border bg-background/80 backdrop-blur px-4 md:px-6 flex items-center gap-3 shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-[19px] font-semibold text-foreground leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {actions}
      <GlobalSearch />
      <button
        aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ""}`}
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
