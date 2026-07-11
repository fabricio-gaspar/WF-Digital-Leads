import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useAuth } from "@/auth/AuthProvider";
import { useLeads, useTasks, useActivities, useUsers } from "@/repositories/hooks";
import { useMemo } from "react";
import { STAGE_MAP } from "@/domain/constants";
import {
  Users, Flame, PhoneOff, Target, DollarSign, ClipboardList, MessageSquare, User2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — WF Digital CRM" }] }),
  component: Dashboard,
});

function greet(name: string) {
  const h = new Date().getHours();
  const g = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${g}, ${name.split(" ")[0]} 👋`;
}

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Dashboard() {
  const { session } = useAuth();
  const { data: leads = [] } = useLeads();
  const { data: tasks = [] } = useTasks();
  const { data: activities = [] } = useActivities();
  const { data: users = [] } = useUsers();

  const kpis = useMemo(() => {
    const open = leads.filter((l) => l.stage !== "fechado" && l.stage !== "perdido");
    const mine = leads.filter((l) => l.ownerId === session?.user.id);
    const hot = leads.filter((l) => l.temperature === "quente" && l.stage !== "fechado" && l.stage !== "perdido");
    const noContact = leads.filter((l) => !l.lastContactAt && l.stage !== "fechado");
    const weighted = open.reduce((s, l) => s + l.estimatedValue * STAGE_MAP[l.stage].probability, 0);
    const closed = leads.filter((l) => l.stage === "fechado").reduce((s, l) => s + (l.closedValue ?? l.estimatedValue), 0);
    const overdue = tasks.filter((t) => t.status === "aberta" && new Date(t.dueAt) < new Date()).length;
    const responseRate = 0.62;
    return { total: leads.length, mine: mine.length, hot: hot.length, noContact: noContact.length, weighted, closed, overdue, responseRate };
  }, [leads, tasks, session]);

  const upcoming = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "aberta")
        .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
        .slice(0, 6),
    [tasks],
  );

  const feed = useMemo(
    () => [...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [activities],
  );

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const kpiCards = [
    { icon: Users, label: "Total de leads", value: kpis.total, hint: "Todos os leads ativos e fechados." },
    { icon: User2, label: "Meus leads", value: kpis.mine, hint: "Leads sob sua responsabilidade." },
    { icon: Flame, label: "Leads quentes", value: kpis.hot, hint: "Temperatura quente, funil aberto." },
    { icon: PhoneOff, label: "Sem contato", value: kpis.noContact, hint: "Leads sem atividade recente." },
    { icon: Target, label: "Previsão ponderada", value: currency(kpis.weighted), hint: "Σ valor × probabilidade da etapa." },
    { icon: DollarSign, label: "Valor fechado", value: currency(kpis.closed), hint: "Soma dos leads fechados." },
    { icon: ClipboardList, label: "Tarefas em atraso", value: kpis.overdue, hint: "Tarefas abertas vencidas." },
    { icon: MessageSquare, label: "Taxa de resposta", value: `${Math.round(kpis.responseRate * 100)}%`, hint: "Contatos que responderam / elegíveis." },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Visão geral da operação comercial">
      <h2 className="text-[15px] font-medium text-foreground mb-4">{greet(session!.user.name)}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              to="/leads"
              className="group bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
              title={k.hint}
            >
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-primary-soft/60 text-primary grid place-items-center">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <div className="mt-3 text-[12px] text-muted-foreground">{k.label}</div>
              <div className="text-[22px] font-semibold text-foreground leading-tight">{k.value}</div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold">Próximas tarefas</h3>
            <Link to="/leads" className="text-[12px] text-primary hover:underline">Ver todas</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg py-10 text-center text-muted-foreground text-[13px]">
              Nenhuma tarefa pendente. Crie uma nova a partir de um lead.
            </div>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="h-8 w-8 rounded-md bg-primary-soft/60 text-primary grid place-items-center text-xs font-semibold">
                    {t.type[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{t.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(t.dueAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} · {userMap[t.ownerId]?.name.split(" ")[0]}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.priority === "alta" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {t.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-[15px] font-semibold mb-4">Atividade recente do time</h3>
          <ul className="space-y-3">
            {feed.map((a) => (
              <li key={a.id} className="flex gap-3">
                <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground grid place-items-center text-[11px] font-semibold shrink-0">
                  {userMap[a.authorId]?.avatarInitials ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-foreground">
                    <span className="font-medium">{userMap[a.authorId]?.name.split(" ")[0] ?? "—"}</span>{" "}
                    <span className="text-muted-foreground">{a.type.replace("_", " ")}</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground truncate">{a.content}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(a.createdAt).toLocaleString("pt-BR")}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
