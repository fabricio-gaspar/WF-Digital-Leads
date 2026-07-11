import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { integrations, sdrPolicies, useSdrDrafts, updateSdrDraft, DEFAULT_SDR_MODE, type IntegrationStatus, type SdrMode } from "@/domain/sdrVirtual";
import { Plug, Bot, MessageCircle, Radio, Sparkles, ShieldCheck, Send, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/central")({
  head: () => ({ meta: [{ title: "Central de Conversas — WF Digital Leads" }] }),
  component: CentralPage,
});

const STATUS_STYLE: Record<IntegrationStatus, string> = {
  "Real": "bg-emerald-100 text-emerald-700",
  "Sandbox": "bg-amber-100 text-amber-700",
  "Não configurado": "bg-muted text-muted-foreground",
  "Desconectado": "bg-red-100 text-red-700",
  "Erro": "bg-red-100 text-red-700",
};

function CentralPage() {
  const conversas = [
    { id: "cv-1", empresa: "Padaria Trigo Dourado", contato: "Ana Ribeiro", ultima: "Ok, pode explicar mais?", estado: "DISCOVERY", heat: 72, naolidas: 1, humano: false },
    { id: "cv-2", empresa: "Metalúrgica Aço Vale", contato: "Marcos Tavares", ultima: "Quero uma reunião esta semana", estado: "HANDOFF_PENDING", heat: 84, naolidas: 0, humano: false },
    { id: "cv-3", empresa: "Tech Frota", contato: "Fernanda Alves", ultima: "[Vendedor assumiu]", estado: "HUMAN_CONTROL", heat: 70, naolidas: 0, humano: true },
    { id: "cv-4", empresa: "Alicerce Forte", contato: "Ana Ribeiro", ultima: "Obrigada!", estado: "CLOSED", heat: 45, naolidas: 0, humano: false },
    { id: "cv-5", empresa: "Ápice Contabil", contato: "Renata Souza", ultima: "Não estou interessada agora", estado: "NURTURE", heat: 32, naolidas: 0, humano: false },
  ];

  return (
    <AppShell title="Central de Conversas" subtitle="SDR Virtual e atendimento humano no mesmo lugar">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <aside className="rounded-xl border border-border bg-card p-3 space-y-1 h-fit sticky top-4">
          <FilterItem label="Todas" count={conversas.length} active />
          <FilterItem label="Não lidas" count={conversas.reduce((a, c) => a + c.naolidas, 0)} />
          <FilterItem label="SDR ativo" count={conversas.filter((c) => !c.humano && c.estado !== "CLOSED").length} />
          <FilterItem label="Aguardando cliente" count={2} />
          <FilterItem label="Handoff pendente" count={conversas.filter((c) => c.estado === "HANDOFF_PENDING").length} />
          <FilterItem label="Humano ativo" count={conversas.filter((c) => c.humano).length} />
          <FilterItem label="Encerradas" count={conversas.filter((c) => c.estado === "CLOSED").length} />

          <div className="pt-3 mt-3 border-t border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide px-2 mb-1.5">Modo SDR</div>
            <div className="px-2 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> {DEFAULT_SDR_MODE}
            </div>
            <div className="text-[10px] text-muted-foreground px-2 mt-1">Rascunhos exigem aprovação humana antes do envio.</div>
          </div>
        </aside>


        <div className="space-y-3">
          <SdrDraftsPanel />

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {conversas.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-4 border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold shrink-0">
                  {c.contato.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground text-sm">{c.empresa}</span>
                    <span className="text-xs text-muted-foreground">· {c.contato}</span>
                    {c.humano && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">Humano ativo</span>}
                    {!c.humano && c.estado !== "CLOSED" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">SDR</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5 truncate">{c.ultima}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="font-mono">{c.estado}</span>
                    <span>·</span>
                    <span>Heat <b className={c.heat >= 75 ? "text-red-600" : c.heat >= 50 ? "text-amber-600" : "text-muted-foreground"}>{c.heat}</b></span>
                  </div>
                </div>
                {c.naolidas > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">{c.naolidas}</span>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3 text-sm text-amber-900 dark:text-amber-200">
            <Radio className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-medium">Z-API Sandbox ativo</div>
              <div className="text-xs mt-0.5">Nenhuma mensagem real está sendo enviada. O simulador demonstrativo processa respostas fictícias. Configure a integração Real em <b>Configurações → Integrações</b>.</div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">Saúde das Integrações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {integrations.map((it) => {
                const Icon = it.categoria === "WhatsApp" ? MessageCircle : it.categoria === "Prospecção" ? Plug : it.categoria === "IA" ? Sparkles : ShieldCheck;
                return (
                  <div key={it.id} className="flex items-start gap-2.5 rounded-lg border border-border p-3">
                    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{it.nome}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_STYLE[it.status]}`}>{it.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{it.descricao}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FilterItem({ label, count, active }: { label: string; count: number; active?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors ${
      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}>
      <span>{label}</span>
      <span className="text-xs">{count}</span>
    </button>
  );
}
