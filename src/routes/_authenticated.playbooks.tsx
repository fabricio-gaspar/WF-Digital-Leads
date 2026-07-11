import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { usePlaybooks } from "@/domain/playbooks";
import { STAGE_MAP } from "@/domain/constants";
import { BookOpen, CheckCircle2, Target } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/playbooks")({
  head: () => ({ meta: [{ title: "Playbooks — WF Digital CRM" }] }),
  component: PlaybooksPage,
});

function PlaybooksPage() {
  const { data: playbooks = [] } = usePlaybooks();
  const [activeId, setActiveId] = useState<string | null>(playbooks[0]?.id ?? null);
  const active = playbooks.find((p) => p.id === activeId) ?? playbooks[0];

  return (
    <AppShell title="Playbooks" subtitle="Biblioteca de roteiros por etapa e persona">
      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-4">
        <div className="space-y-2">
          {playbooks.map((p) => {
            const stageLabel = p.stage === "todos" ? "Todas etapas" : STAGE_MAP[p.stage]?.label ?? p.stage;
            const isActive = p.id === active?.id;
            return (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`w-full text-left bg-card border rounded-xl p-3 transition-colors ${isActive ? "border-primary/60 ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="text-[13px] font-semibold truncate">{p.name}</div>
                </div>
                <div className="text-[11px] text-muted-foreground mb-1">{stageLabel}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2">{p.objective}</div>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-[17px] font-semibold">{active.name}</div>
              <div className="text-[12px] text-muted-foreground mb-3">{active.objective}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground font-medium flex items-center gap-1.5 mb-2"><Target className="h-3.5 w-3.5" /> Critérios de sucesso</div>
                  <ul className="space-y-1.5">
                    {active.successCriteria.map((c, i) => (
                      <li key={i} className="text-[13px] flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground font-medium mb-2">Checklist de preparação</div>
                  <ul className="space-y-1.5">
                    {active.checklist.map((c, i) => (
                      <li key={i} className="text-[13px] flex items-start gap-2">
                        <input type="checkbox" className="mt-1 h-3.5 w-3.5 accent-primary" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-[13px] font-semibold uppercase text-muted-foreground mb-3">Roteiro ({active.steps.length} passos)</div>
              <ol className="space-y-3">
                {active.steps.map((s) => (
                  <li key={s.id} className="border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">{s.order}</div>
                      <div className="text-[14px] font-semibold">{s.title}</div>
                    </div>
                    <div className="text-[12px] text-muted-foreground mb-1.5 pl-8">{s.description}</div>
                    {s.script && (
                      <div className="pl-8 text-[12px] italic text-foreground/80 bg-muted/50 border-l-2 border-primary/40 pl-3 py-1.5 my-1.5 rounded">
                        "{s.script}"
                      </div>
                    )}
                    <div className="pl-8 text-[11px] text-primary-strong"><strong>Resultado esperado:</strong> {s.outcome}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {!active && (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            Nenhum playbook cadastrado ainda.
          </div>
        )}
      </div>
    </AppShell>
  );
}
