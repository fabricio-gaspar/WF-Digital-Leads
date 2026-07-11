import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import {
  useMetas,
  createMeta,
  toggleMetaPasso,
  updateMeta,
  type Meta,
} from "@/domain/canonical";
import { useSearchProfiles, useServicesList } from "@/domain/sdrVirtual";
import { useState } from "react";
import { Target, Plus, CheckCircle2, Circle, Pause, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mission-control")({
  head: () => ({
    meta: [
      { title: "Mission Control — WF Digital Leads" },
      { name: "description", content: "Objetivos comerciais e plano de prospecção gerado automaticamente." },
    ],
  }),
  component: MissionControlPage,
});

function MissionControlPage() {
  const metas = useMetas();
  const perfis = useSearchProfiles();
  const servicos = useServicesList();
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    servicoId: "",
    perfilBuscaId: "",
    metricaAlvo: 20,
    metricaTipo: "leads" as Meta["metricaTipo"],
    prazo: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  });

  const submit = () => {
    if (!form.titulo.trim()) return toast.error("Descreva o objetivo");
    createMeta({
      titulo: form.titulo,
      descricao: form.descricao,
      servicoId: form.servicoId || undefined,
      perfilBuscaId: form.perfilBuscaId || undefined,
      metricaAlvo: form.metricaAlvo,
      metricaTipo: form.metricaTipo,
      prazo: form.prazo,
    });
    toast.success("Meta criada — plano de ação gerado automaticamente");
    setCriando(false);
    setForm({ ...form, titulo: "", descricao: "" });
  };

  return (
    <AppShell
      title="Mission Control"
      subtitle="Descreva um objetivo comercial e o sistema monta o plano de prospecção end-to-end"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-foreground">Como funciona</div>
            <p className="text-sm text-muted-foreground mt-1">
              Você descreve a meta ("captar 30 leads de indústria em 30 dias"). O sistema gera um plano com 7 passos
              cobrindo: perfil de busca → coleta multifonte → enriquecimento → elegibilidade → distribuição →
              apresentação/aquecimento → fechamento. Acompanhe cada passo aqui.
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">SANDBOX</span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Metas ativas</h2>
          <button
            onClick={() => setCriando(true)}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Nova meta
          </button>
        </div>

        {criando && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder='Ex.: "Captar 30 leads de indústria em 30 dias"'
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm"
            />
            <textarea
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Contexto extra (opcional)"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={form.servicoId}
                onChange={(e) => setForm({ ...form, servicoId: e.target.value })}
                className="h-10 px-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Serviço…</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              <select
                value={form.perfilBuscaId}
                onChange={(e) => setForm({ ...form, perfilBuscaId: e.target.value })}
                className="h-10 px-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="">Perfil de busca…</option>
                {perfis.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.metricaAlvo}
                  onChange={(e) => setForm({ ...form, metricaAlvo: parseInt(e.target.value) || 0 })}
                  className="w-20 h-10 px-2 rounded-lg border border-input bg-background text-sm"
                />
                <select
                  value={form.metricaTipo}
                  onChange={(e) => setForm({ ...form, metricaTipo: e.target.value as Meta["metricaTipo"] })}
                  className="flex-1 h-10 px-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="leads">leads</option>
                  <option value="oportunidades">oportunidades</option>
                  <option value="receita">R$ receita</option>
                </select>
              </div>
              <input
                type="date"
                value={form.prazo}
                onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                className="h-10 px-2 rounded-lg border border-input bg-background text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCriando(false)}
                className="h-9 px-3 rounded-lg border border-border text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Criar meta e gerar plano
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {metas.length === 0 && !criando && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nenhuma meta ainda. Crie a primeira para gerar um plano de prospecção.
            </div>
          )}
          {metas.map((m) => (
            <MetaCard key={m.id} m={m} servicoNome={servicos.find((s) => s.id === m.servicoId)?.nome} perfilNome={perfis.find((p) => p.id === m.perfilBuscaId)?.nome} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function MetaCard({ m, servicoNome, perfilNome }: { m: Meta; servicoNome?: string; perfilNome?: string }) {
  const done = m.planoGerado?.passos.filter((p) => p.done).length ?? 0;
  const total = m.planoGerado?.passos.length ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{m.titulo}</h3>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
              m.status === "Ativa" ? "bg-emerald-100 text-emerald-700" :
              m.status === "Pausada" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
            }`}>{m.status}</span>
          </div>
          {m.descricao && <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
            <span>Alvo: <b className="text-foreground">{m.metricaAlvo} {m.metricaTipo}</b></span>
            <span>Prazo: <b className="text-foreground">{m.prazo}</b></span>
            {servicoNome && <span>Serviço: <b className="text-foreground">{servicoNome}</b></span>}
            {perfilNome && <span>Perfil: <b className="text-foreground">{perfilNome}</b></span>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Progresso</div>
          <div className="text-2xl font-bold text-primary">{pct}%</div>
          <div className="text-[11px] text-muted-foreground">{done}/{total} passos</div>
          <button
            onClick={() => updateMeta(m.id, { status: m.status === "Ativa" ? "Pausada" : "Ativa" })}
            className="text-xs mt-1 text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {m.status === "Ativa" ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Retomar</>}
          </button>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Plano de ação gerado</div>
        <ul className="space-y-1.5">
          {m.planoGerado?.passos.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <button onClick={() => toggleMetaPasso(m.id, i)} className="mt-0.5">
                {p.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
              </button>
              <div className="flex-1">
                <div className={p.done ? "line-through text-muted-foreground" : "text-foreground"}>{p.titulo}</div>
                <div className="text-xs text-muted-foreground">{p.descricao}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
