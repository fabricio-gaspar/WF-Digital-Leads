import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useHandoffs, updateHandoffStatus, useServicesList, type HandoffStatus } from "@/domain/sdrVirtual";
import { ArrowRight, Clock, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/handoffs")({
  head: () => ({ meta: [{ title: "Handoffs — WF Digital Leads" }] }),
  component: HandoffsPage,
});

const STATUS_COLOR: Record<HandoffStatus, string> = {
  "Rascunho": "bg-muted text-muted-foreground",
  "Revisão": "bg-amber-100 text-amber-700",
  "Aguardando vendedor": "bg-primary/10 text-primary",
  "Aceito": "bg-emerald-100 text-emerald-700",
  "Devolvido": "bg-orange-100 text-orange-700",
  "Recusado": "bg-red-100 text-red-700",
  "Expirado": "bg-red-100 text-red-700",
  "Redistribuído": "bg-blue-100 text-blue-700",
  "Concluído": "bg-emerald-100 text-emerald-800",
};

function HandoffsPage() {
  const handoffs = useHandoffs();
  const services = useServicesList();
  const [filter, setFilter] = useState<HandoffStatus | "todos">("todos");
  const getService = (id: string) => services.find((s) => s.id === id)?.nome ?? "—";

  const filtered = filter === "todos" ? handoffs : handoffs.filter((h) => h.status === filter);
  const filters: (HandoffStatus | "todos")[] = ["todos", "Aguardando vendedor", "Aceito", "Devolvido", "Concluído"];

  return (
    <AppShell title="Handoffs" subtitle="Transferência do SDR Virtual para o vendedor humano">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Aguardando" value={handoffs.filter((h) => h.status === "Aguardando vendedor").length} icon={Clock} tone="primary" />
          <Stat label="Aceitos" value={handoffs.filter((h) => h.status === "Aceito").length} icon={CheckCircle2} tone="emerald" />
          <Stat label="Devolvidos" value={handoffs.filter((h) => h.status === "Devolvido").length} icon={RotateCcw} tone="amber" />
          <Stat label="Concluídos" value={handoffs.filter((h) => h.status === "Concluído").length} icon={CheckCircle2} tone="emerald" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f === "todos" ? "Todos" : f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((h) => (
            <div key={h.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{h.empresa}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[h.status]}`}>{h.status}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${h.prioridade === "Alta" ? "bg-red-100 text-red-700" : h.prioridade === "Média" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{h.prioridade}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {h.contato} · {getService(h.servicoId)} · Criado em {h.criadoEm}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Heat</div>
                  <div className={`text-2xl font-bold ${h.heat >= 75 ? "text-red-600" : h.heat >= 60 ? "text-amber-600" : "text-muted-foreground"}`}>{h.heat}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Motivo</div>
                  <div className="text-foreground">{h.motivo}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Necessidade</div>
                  <div className="text-foreground">{h.necessidade}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Resumo da conversa</div>
                <p className="text-sm text-foreground mt-1 italic">"{h.resumoConversa}"</p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border gap-3 flex-wrap">
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Fit <b className="text-foreground">{h.fit}</b></span>
                  <span>Intent <b className="text-foreground">{h.intent}</b></span>
                  <span>Engagement <b className="text-foreground">{h.engagement}</b></span>
                  <span>Vendedor: <b className="text-foreground">{h.vendedorSugerido}</b></span>
                  <span>SLA: <b className="text-foreground">{h.sla}</b></span>
                </div>
                {h.status === "Aguardando vendedor" && (
                  <div className="flex gap-2">
                    <button onClick={() => updateHandoffStatus(h.id, "Aceito")} className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Aceitar
                    </button>
                    <button onClick={() => updateHandoffStatus(h.id, "Devolvido", "Precisa mais informações")} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Devolver
                    </button>
                    <button onClick={() => updateHandoffStatus(h.id, "Recusado", "Fora do perfil")} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5 text-red-600">
                      <XCircle className="h-3.5 w-3.5" /> Recusar
                    </button>
                  </div>
                )}
                {h.status === "Aceito" && (
                  <button onClick={() => updateHandoffStatus(h.id, "Concluído")} className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:opacity-90 inline-flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" /> Marcar concluído
                  </button>
                )}
                {h.motivoDevolucao && (
                  <div className="text-xs text-amber-700 italic">Devolvido: {h.motivoDevolucao}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Clock; tone: "primary" | "emerald" | "amber" }) {
  const cls = tone === "primary" ? "text-primary" : tone === "emerald" ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg bg-muted grid place-items-center ${cls}`}><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={`text-xl font-bold ${cls}`}>{value}</div>
      </div>
    </div>
  );
}
