import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useAuth } from "@/auth/AuthProvider";
import { useTasks, useActivities, useUsers, useToggleTask } from "@/repositories/hooks";
import { useMemo } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({ meta: [{ title: "Portal do Funcionário — WF Digital CRM" }] }),
  component: PortalPage,
});

function PortalPage() {
  const { session } = useAuth();
  const { data: tasks = [] } = useTasks();
  const { data: activities = [] } = useActivities();
  const { data: users = [] } = useUsers();
  const toggle = useToggleTask();

  const uid = session!.user.id;
  const myTasks = useMemo(() => tasks.filter((t) => t.ownerId === uid).sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [tasks, uid]);
  const myActivities = useMemo(
    () => activities.filter((a) => a.authorId === uid).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
    [activities, uid],
  );

  const openTasks = myTasks.filter((t) => t.status === "aberta");
  const doneToday = myTasks.filter((t) => t.status === "concluida" && t.completedAt && t.completedAt.startsWith(new Date().toISOString().slice(0, 10))).length;
  const overdue = openTasks.filter((t) => new Date(t.dueAt) < new Date()).length;

  const teammates = users.filter((u) => u.id !== uid).slice(0, 6);

  return (
    <AppShell title="Portal do Funcionário" subtitle="Minhas tarefas, produtividade e escala do time">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { l: "Tarefas abertas", v: openTasks.length },
          { l: "Concluídas hoje", v: doneToday },
          { l: "Em atraso", v: overdue },
          { l: "Meu papel", v: session!.user.role },
        ].map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-xl p-4">
            <div className="text-[12px] text-muted-foreground">{k.l}</div>
            <div className="text-[20px] font-semibold capitalize">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <h3 className="text-[14px] font-semibold mb-3">Minhas tarefas</h3>
          {myTasks.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-lg py-10 text-center text-muted-foreground text-[13px]">Nenhuma tarefa atribuída.</div>
          ) : (
            <ul className="space-y-1.5">
              {myTasks.map((t) => {
                const done = t.status === "concluida";
                const late = !done && new Date(t.dueAt) < new Date();
                return (
                  <li key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                    <button onClick={() => toggle.mutate(t.id)} aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"} className="shrink-0">
                      {done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</div>
                      <div className={`text-[11px] flex items-center gap-1 ${late ? "text-destructive" : "text-muted-foreground"}`}>
                        <Clock className="h-3 w-3" />
                        {new Date(t.dueAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {late && " · atrasada"}
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.priority === "alta" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{t.priority}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-[14px] font-semibold mb-3">Time online</h3>
          <ul className="space-y-2">
            {teammates.map((u) => (
              <li key={u.id} className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold">{u.avatarInitials}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate">{u.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{u.availability ?? "offline"}</div>
                </div>
              </li>
            ))}
          </ul>

          <h3 className="text-[14px] font-semibold mt-5 mb-3">Minha atividade</h3>
          <ul className="space-y-2">
            {myActivities.map((a) => (
              <li key={a.id} className="text-[12px]">
                <div className="text-foreground truncate">{a.content}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleString("pt-BR")}</div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
