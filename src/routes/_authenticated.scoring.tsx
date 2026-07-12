import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { PageHero } from "@/app/PageHero";
import { useScoringRules, QUALIFICATION_TIERS, computeScoreBreakdown, tierForScore, ruleStore } from "@/domain/scoring";
import { useLeads, useCompanies } from "@/repositories/hooks";
import { Sparkles, TrendingUp, RotateCcw, Target } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/scoring")({
  head: () => ({ meta: [{ title: "Scoring & Qualificação — WF Digital CRM" }] }),
  component: ScoringPage,
});

function ScoringPage() {
  const { data: rules = [] } = useScoringRules();
  const { data: leads = [] } = useLeads();
  const { data: companies = [] } = useCompanies();
  const totalWeight = rules.filter((r) => r.active).reduce((s, r) => s + r.weight, 0);
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));

  const distribution = useMemo(() => {
    const buckets = Object.fromEntries(QUALIFICATION_TIERS.map((t) => [t.id, 0]));
    leads.forEach((l) => { buckets[tierForScore(l.score).id]++; });
    return buckets;
  }, [leads]);

  const topLeads = useMemo(
    () => [...leads].sort((a, b) => b.score - a.score).slice(0, 6),
    [leads],
  );

  return (
    <AppShell title="Scoring & Qualificação" subtitle="Motor de pontuação BANT + CHAMP + fit ICP">
      <PageHero
        icon={Target}
        eyebrow="Bloco Automação"
        title="Scoring & Qualificação"
        description="Régua transparente de pontuação — BANT + CHAMP + fit ICP com pesos ajustáveis e faixas por temperatura."
        stats={QUALIFICATION_TIERS.map((t) => ({
          label: t.label,
          value: distribution[t.id],
          hint: `${t.min}–${t.max} pts`,
        }))}
      />


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[15px] font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Régua de pontuação</div>
              <div className="text-[11px] text-muted-foreground">Soma dos pesos ativos: <strong className={totalWeight === 100 ? "text-primary" : "text-destructive"}>{totalWeight}</strong>/100</div>
            </div>
            <button
              onClick={() => ruleStore.reset()}
              className="h-8 px-2.5 rounded-md border border-border text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar padrão
            </button>
          </div>
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="border border-border rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium capitalize">{r.dimension} — {r.label}</div>
                    <div className="text-[11px] text-muted-foreground">{r.description}</div>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
                    <input
                      type="checkbox"
                      checked={r.active}
                      onChange={(e) => ruleStore.update(r.id, { active: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    Ativa
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0} max={40} value={r.weight}
                    onChange={(e) => ruleStore.update(r.id, { weight: Number(e.target.value) })}
                    className="flex-1 accent-primary"
                    aria-label={`Peso de ${r.label}`}
                  />
                  <span className="w-10 text-right text-[13px] font-semibold tabular-nums">{r.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[15px] font-semibold flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-primary" /> Top 6 leads</div>
          <div className="space-y-2">
            {topLeads.map((l) => {
              const c = companyMap[l.companyId];
              const b = computeScoreBreakdown(l, rules);
              return (
                <div key={l.id} className="border border-border rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[13px] font-medium truncate">{c?.nomeFantasia ?? c?.razaoSocial}</div>
                    <span className="text-[11px] font-semibold tabular-nums">{b.total}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mb-1.5">{b.tier.label}</div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.total}%`, background: `var(${b.tier.colorVar})` }} />
                  </div>
                </div>
              );
            })}
            {topLeads.length === 0 && (
              <div className="text-[12px] text-muted-foreground text-center py-6">Nenhum lead no funil ainda.</div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
