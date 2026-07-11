import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Stat {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "primary" | "warning" | "success";
}

interface Props {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: Stat[];
}

const toneClass: Record<NonNullable<Stat["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  warning: "text-amber-600",
  success: "text-emerald-600",
};

export function PageHero({ icon: Icon, eyebrow, title, description, actions, stats }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card p-5 mb-5">
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary grid place-items-center shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">{eyebrow}</div>
            <h1 className="text-[20px] font-semibold text-foreground leading-tight">{title}</h1>
            {description && <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
          {stats.map((s, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/70 backdrop-blur px-3 py-2.5">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{s.label}</div>
              <div className={`text-[18px] font-semibold ${toneClass[s.tone ?? "default"]}`}>{s.value}</div>
              {s.hint && <div className="text-[10px] text-muted-foreground mt-0.5">{s.hint}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
