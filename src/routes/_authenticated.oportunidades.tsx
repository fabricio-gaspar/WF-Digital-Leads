import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import {
  useOportunidades,
  updateOportunidade,
  createOportunidade,
  useVendedores,
  useEmpresas,
  distributeLead,
  computeMultiScores,
  type OportunidadeEstagio,
} from "@/domain/canonical";
import { useServicesList } from "@/domain/sdrVirtual";
import { DollarSign, TrendingUp, Users, Award, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/oportunidades")({
  head: () => ({
    meta: [
      { title: "Oportunidades — WF Digital Leads" },
      { name: "description", content: "Funil de oportunidades separado do funil de leads." },
    ],
  }),
  component: OportunidadesPage,
});

const ESTAGIOS: OportunidadeEstagio[] = [
  "Descoberta",
  "Qualificado",
  "Proposta enviada",
  "Negociação",
  "Ganho",
  "Perdido",
];

const ESTAGIO_COR: Record<OportunidadeEstagio, string> = {
  Descoberta: "bg-slate-100 text-slate-700",
  Qualificado: "bg-blue-100 text-blue-700",
  "Proposta enviada": "bg-amber-100 text-amber-700",
  Negociação: "bg-purple-100 text-purple-700",
  Ganho: "bg-emerald-100 text-emerald-700",
  Perdido: "bg-red-100 text-red-700",
};

function OportunidadesPage() {
  const ops = useOportunidades();
  const vendedores = useVendedores();
  const empresas = useEmpresas();
  const services = useServicesList();
  const [showCreate, setShowCreate] = useState(false);

  const stats = {
    ativas: ops.filter((o) => !["Ganho", "Perdido"].includes(o.estagio)).length,
    ganhas: ops.filter((o) => o.estagio === "Ganho").length,
    valorTotal: ops.filter((o) => o.estagio === "Ganho").reduce((s, o) => s + o.valorEstimado, 0),
    valorPipeline: ops
      .filter((o) => !["Ganho", "Perdido"].includes(o.estagio))
      .reduce((s, o) => s + o.valorEstimado * (o.probabilidade / 100), 0),
  };

  return (
    <AppShell
      title="Oportunidades"
      subtitle="Funil comercial separado do funil de leads — só entra aqui após handoff aceito"
    >
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Ativas" value={stats.ativas} icon={TrendingUp} tone="primary" />
          <Stat label="Ganhas" value={stats.ganhas} icon={Award} tone="emerald" />
          <Stat label="Pipeline ponderado" value={`R$ ${Math.round(stats.valorPipeline).toLocaleString("pt-BR")}`} icon={DollarSign} tone="amber" />
          <Stat label="Receita ganha" value={`R$ ${stats.valorTotal.toLocaleString("pt-BR")}`} icon={Users} tone="emerald" />
        </div>

        <div className="flex justify-end">
          <button onClick={() => setShowCreate(true)} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Nova oportunidade
          </button>
        </div>

        {showCreate && (
          <CreateOportunidadeCard
            empresas={empresas}
            vendedores={vendedores}
            services={services}
            onClose={() => setShowCreate(false)}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ESTAGIOS.map((estagio) => {
            const col = ops.filter((o) => o.estagio === estagio);
            const total = col.reduce((s, o) => s + o.valorEstimado, 0);
            return (
              <div key={estagio} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ESTAGIO_COR[estagio]}`}>{estagio}</span>
                  <span className="text-xs text-muted-foreground">{col.length}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">R$ {total.toLocaleString("pt-BR")}</div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {col.map((o) => {
                    const empresa = empresas.find((e) => e.id === o.empresaId);
                    const vendedor = vendedores.find((v) => v.id === o.vendedorId);
                    return (
                      <div key={o.id} className="rounded-lg border border-border bg-background p-2.5 text-xs space-y-1.5">
                        <div className="font-semibold text-foreground truncate">{empresa?.nomeFantasia ?? empresa?.razaoSocial ?? "—"}</div>
                        <div className="text-muted-foreground">R$ {o.valorEstimado.toLocaleString("pt-BR")} · {o.probabilidade}%</div>
                        <div className="text-[10px] text-muted-foreground">Vend.: {vendedor?.nome ?? "—"}</div>
                        <div className="flex gap-1 flex-wrap">
                          <ScoreDot label="F" value={o.scores.fit} />
                          <ScoreDot label="I" value={o.scores.intent} />
                          <ScoreDot label="E" value={o.scores.engagement} />
                          <ScoreDot label="Q" value={o.scores.qualidade} />
                          <ScoreDot label="H" value={o.scores.heat} />
                        </div>
                        <select
                          value={o.estagio}
                          onChange={(e) => {
                            updateOportunidade(o.id, { estagio: e.target.value as OportunidadeEstagio });
                            toast.success(`Movida para ${e.target.value}`);
                          }}
                          className="w-full text-[11px] h-7 rounded border border-border bg-background"
                        >
                          {ESTAGIOS.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    );
                  })}
                  {col.length === 0 && <div className="text-[11px] text-muted-foreground italic py-4 text-center">—</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><ArrowRight className="h-4 w-4 text-primary" /> Próxima Melhor Ação (NBA) por vendedor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {vendedores.map((v) => {
              const suas = ops.filter((o) => o.vendedorId === v.id && !["Ganho", "Perdido"].includes(o.estagio));
              const next = suas.sort((a, b) => b.scores.heat - a.scores.heat)[0];
              return (
                <div key={v.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-semibold text-foreground">{v.nome}</div>
                  <div className="text-xs text-muted-foreground">Carga {v.cargaAtual}/{v.cargaMax} · {suas.length} oportunidades</div>
                  {next ? (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="text-[11px] text-muted-foreground uppercase">Próxima ação</div>
                      <div className="text-sm text-foreground">
                        Contatar {empresas.find((e) => e.id === next.empresaId)?.nomeFantasia ?? "—"} (heat {next.scores.heat})
                      </div>
                      <div className="text-[11px] text-muted-foreground italic">Estágio: {next.estagio}</div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-muted-foreground italic">Sem oportunidades em aberto</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function CreateOportunidadeCard({
  empresas,
  vendedores,
  services,
  onClose,
}: {
  empresas: ReturnType<typeof useEmpresas>;
  vendedores: ReturnType<typeof useVendedores>;
  services: ReturnType<typeof useServicesList>;
  onClose: () => void;
}) {
  const [empresaId, setEmpresaId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [valor, setValor] = useState(15000);
  const [prob, setProb] = useState(30);

  const submit = () => {
    if (!empresaId) return toast.error("Selecione a empresa");
    const empresa = empresas.find((e) => e.id === empresaId);
    const vendedor = distributeLead({ servicoId, uf: empresa?.uf });
    if (!vendedor) return toast.error("Nenhum vendedor disponível");
    createOportunidade({
      empresaId,
      vendedorId: vendedor.id,
      servicoId: servicoId || undefined,
      origem: "Manual",
      estagio: "Descoberta",
      valorEstimado: valor,
      probabilidade: prob,
      dataPrevisaoFechamento: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      scores: computeMultiScores({ segmentoMatch: true, porteMatch: true, mensagensTrocadas: 2, emailValido: true, telefoneValido: true }),
    });
    toast.success(`Oportunidade criada · distribuída para ${vendedor.nome}`);
    onClose();
  };

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <select value={empresaId} onChange={(e) => setEmpresaId(e.target.value)} className="h-9 px-2 rounded-md border border-input bg-background text-sm md:col-span-2">
          <option value="">Empresa…</option>
          {empresas.map((e) => <option key={e.id} value={e.id}>{e.nomeFantasia ?? e.razaoSocial}</option>)}
        </select>
        <select value={servicoId} onChange={(e) => setServicoId(e.target.value)} className="h-9 px-2 rounded-md border border-input bg-background text-sm">
          <option value="">Serviço…</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="number" value={valor} onChange={(e) => setValor(parseFloat(e.target.value) || 0)} className="flex-1 h-9 px-2 rounded-md border border-input bg-background text-sm" placeholder="Valor R$" />
          <input type="number" value={prob} onChange={(e) => setProb(parseInt(e.target.value) || 0)} className="w-16 h-9 px-2 rounded-md border border-input bg-background text-sm" placeholder="%" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-9 px-3 rounded-lg border border-border text-sm">Cancelar</button>
        <button onClick={submit} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar e distribuir</button>
      </div>
      <p className="text-xs text-muted-foreground italic">A distribuição usa round-robin ponderado por carga, território e especialidade.</p>
    </div>
  );
}

function ScoreDot({ label, value }: { label: string; value: number }) {
  const cor = value >= 75 ? "bg-emerald-100 text-emerald-700" : value >= 50 ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground";
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cor}`} title={`${label}: ${value}`}>{label}{value}</span>;
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: typeof TrendingUp; tone: "primary" | "emerald" | "amber" }) {
  const cls = tone === "primary" ? "text-primary" : tone === "emerald" ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg bg-muted grid place-items-center ${cls}`}><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={`text-lg font-bold ${cls} truncate`}>{value}</div>
      </div>
    </div>
  );
}
