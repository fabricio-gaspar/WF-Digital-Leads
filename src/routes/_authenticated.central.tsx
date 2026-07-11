import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { integrations, useSdrDrafts, updateSdrDraft, DEFAULT_SDR_MODE, type IntegrationStatus } from "@/domain/sdrVirtual";
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

const SEV_STYLE = {
  info: "bg-sky-100 text-sky-700",
  warn: "bg-amber-100 text-amber-700",
  block: "bg-red-100 text-red-700",
} as const;

function SdrDraftsPanel() {
  const drafts = useSdrDrafts();
  const pendentes = drafts.filter((d) => d.status === "pendente");
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [batchOpen, setBatchOpen] = useState(false);

  if (pendentes.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex gap-3 text-sm text-emerald-900 dark:text-emerald-200">
        <Bot className="h-5 w-5 shrink-0" />
        <div>
          <div className="font-medium">Fila do SDR vazia</div>
          <div className="text-xs mt-0.5">Nenhum rascunho aguardando aprovação. Novos rascunhos gerados pelo Simulador aparecem aqui automaticamente.</div>
        </div>
      </div>
    );
  }

  const approve = (id: string, novoTexto?: string) => {
    updateSdrDraft(id, { status: novoTexto ? "editado" : "aprovado", ...(novoTexto && { draftReply: novoTexto }) });
    toast.success("Rascunho aprovado (sandbox — sem envio real).");
    setEditing(null);
  };
  const discard = (id: string) => {
    updateSdrDraft(id, { status: "descartado" });
    toast.message("Rascunho descartado.");
  };

  const elegiveis = pendentes.filter((d) => !d.guardrails.some((g) => g.severity === "block"));
  const bloqueados = pendentes.length - elegiveis.length;

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Fila do SDR — {pendentes.length} rascunho(s) aguardando aprovação</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBatchOpen(true)}
            disabled={elegiveis.length === 0}
            data-testid="batch-open"
            className="text-xs px-3 py-1.5 rounded border border-primary/40 bg-white text-primary font-medium hover:bg-primary/10 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <CheckSquare className="h-3.5 w-3.5" /> Aprovar em lote ({elegiveis.length})
          </button>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Semiautomático</span>
        </div>
      </div>
      {pendentes.map((d) => {
        const blocked = d.guardrails.some((g) => g.severity === "block");
        return (
          <div key={d.id} data-testid={`draft-card-${d.id}`} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="text-foreground"><b>{d.empresa}</b> · {d.contato}</div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>fonte: <b>{d.source}</b></span>
                <span>· conf. <b className={d.confidence >= 75 ? "text-emerald-600" : d.confidence >= 50 ? "text-amber-600" : "text-red-600"}>{d.confidence}%</b></span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">Lead: "{d.leadMessage}"</div>
            {editing === d.id ? (
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="w-full text-sm px-3 py-2 rounded border border-border bg-background" />
            ) : (
              <div className="text-sm text-foreground bg-muted/40 rounded p-2">{d.draftReply}</div>
            )}
            {d.guardrails.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {d.guardrails.map((g, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${SEV_STYLE[g.severity]}`} title={g.detail}>
                    {g.severity === "block" && <AlertTriangle className="h-3 w-3" />}
                    {g.rule}
                  </span>
                ))}
              </div>
            )}
            {blocked && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">Guardrail bloqueou envio automático. Revise ou encaminhe para handoff.</div>
            )}
            <div className="flex items-center justify-end gap-2">
              {editing === d.id ? (
                <>
                  <button onClick={() => setEditing(null)} className="px-3 py-1.5 rounded text-xs border border-border hover:bg-muted">Cancelar</button>
                  <button onClick={() => approve(d.id, text)} className="px-3 py-1.5 rounded text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 inline-flex items-center gap-1"><Send className="h-3 w-3" /> Aprovar edição</button>
                </>
              ) : (
                <>
                  <button onClick={() => discard(d.id)} className="px-3 py-1.5 rounded text-xs border border-border hover:bg-muted inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Descartar</button>
                  <button onClick={() => { setEditing(d.id); setText(d.draftReply); }} className="px-3 py-1.5 rounded text-xs border border-border hover:bg-muted inline-flex items-center gap-1"><Pencil className="h-3 w-3" /> Editar</button>
                  <button
                    onClick={() => approve(d.id)}
                    disabled={blocked}
                    data-testid={`approve-${d.id}`}
                    className="px-3 py-1.5 rounded text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" /> Aprovar e enviar
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {batchOpen && (
        <BatchApprovalDialog
          elegiveis={elegiveis}
          bloqueados={bloqueados}
          onClose={() => setBatchOpen(false)}
        />
      )}
    </div>
  );
}

function BatchApprovalDialog({
  elegiveis,
  bloqueados,
  onClose,
}: {
  elegiveis: ReturnType<typeof useSdrDrafts>;
  bloqueados: number;
  onClose: () => void;
}) {
  const [minConfidence, setMinConfidence] = useState(70);
  const [selected, setSelected] = useState<Set<string>>(new Set(elegiveis.map((d) => d.id)));

  const filtrados = elegiveis.filter((d) => d.confidence >= minConfidence);
  const toApprove = filtrados.filter((d) => selected.has(d.id));

  const toggle = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const runBatch = () => {
    let count = 0;
    toApprove.forEach((d) => {
      updateSdrDraft(d.id, { status: "aprovado" });
      count++;
    });
    toast.success(`${count} rascunho(s) aprovado(s) em lote (sandbox — sem envio real).`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-foreground/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Aprovação em lote</h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <b>Sandbox demo — nenhum envio real.</b> Guardrails com severidade <b>block</b> são automaticamente excluídos da fila em lote.
              {bloqueados > 0 && <> {bloqueados} rascunho(s) bloqueado(s) por guardrail e não aparecem abaixo.</>}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <label htmlFor="min-conf" className="text-muted-foreground">Confiança mínima:</label>
            <input
              id="min-conf"
              type="range"
              min={0}
              max={100}
              step={5}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="flex-1"
            />
            <b className="tabular-nums text-foreground w-10 text-right">{minConfidence}%</b>
          </div>

          <div className="border border-border rounded-lg divide-y divide-border">
            {filtrados.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Nenhum rascunho passa no filtro atual.</div>
            ) : filtrados.map((d) => (
              <label key={d.id} className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30">
                <input
                  type="checkbox"
                  checked={selected.has(d.id)}
                  onChange={() => toggle(d.id)}
                  className="mt-1 accent-primary"
                  data-testid={`batch-check-${d.id}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{d.empresa} · {d.contato}</span>
                    <span className={`font-medium ${d.confidence >= 75 ? "text-emerald-600" : "text-amber-600"}`}>{d.confidence}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">{d.draftReply}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{toApprove.length} de {elegiveis.length} selecionado(s)</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded text-xs border border-border hover:bg-muted">Cancelar</button>
            <button
              onClick={runBatch}
              disabled={toApprove.length === 0}
              data-testid="batch-confirm"
              className="px-3 py-1.5 rounded text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Aprovar {toApprove.length} rascunho(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


