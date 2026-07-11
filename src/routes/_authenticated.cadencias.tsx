import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useCadences, useServicesList } from "@/domain/sdrVirtual";
import { Zap, Clock, MessageSquare, HelpCircle, CheckSquare, GitBranch, Sprout, StopCircle, ArrowRight } from "lucide-react";
import type { CadenceStepType } from "@/domain/sdrVirtual";

export const Route = createFileRoute("/_authenticated/cadencias")({
  head: () => ({ meta: [{ title: "Cadências — WF Digital Leads" }] }),
  component: CadenciasPage,
});

const STEP_ICON: Record<CadenceStepType, typeof Zap> = {
  apresentacao: MessageSquare,
  espera: Clock,
  descoberta: HelpCircle,
  "follow-up": MessageSquare,
  tarefa: CheckSquare,
  condicao: GitBranch,
  nutrir: Sprout,
  encerrar: StopCircle,
  handoff: ArrowRight,
};

function CadenciasPage() {
  const cadences = useCadences();
  const services = useServicesList();
  const getService = (id: string) => services.find((s) => s.id === id)?.nome ?? "—";

  return (
    <AppShell title="Cadências" subtitle="Sequências curtas e configuráveis — sem cadências agressivas">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-900 dark:text-amber-200 flex gap-3">
          <Zap className="h-5 w-5 shrink-0" />
          <span>Padrão demo: apresentação + até 2 follow-ups curtos. Parada imediata em: resposta positiva, pedido de humano/preço/reunião, opt-out, contato inválido ou humano assumir.</span>
        </div>

        {cadences.map((cd) => (
          <div key={cd.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">{cd.nome}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{cd.descricao}</p>
                <div className="text-xs text-muted-foreground mt-1">Serviço: <span className="text-foreground">{getService(cd.servicoId)}</span></div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                cd.status === "Ativa" ? "bg-emerald-100 text-emerald-700"
                : cd.status === "Rascunho" ? "bg-muted text-muted-foreground"
                : "bg-amber-100 text-amber-700"
              }`}>{cd.status}</span>
            </div>

            <div className="space-y-2">
              {cd.passos.map((step, idx) => {
                const Icon = STEP_ICON[step.tipo] ?? Zap;
                return (
                  <div key={step.ordem} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0 text-xs font-semibold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium text-foreground capitalize">{step.tipo.replace("-", " ")}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${step.auto ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
                          {step.auto ? "Automático" : "Requer revisão"}
                        </span>
                        {step.atrasoHoras > 0 && <span className="text-[10px] text-muted-foreground">+{step.atrasoHoras}h</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{step.descricao}</div>
                      {step.template && (
                        <div className="text-xs italic text-muted-foreground mt-1 bg-card border border-border rounded px-2 py-1">"{step.template}"</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
