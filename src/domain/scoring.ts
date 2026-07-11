// Motor de Scoring & Qualificação — WF Digital CRM
// Framework BANT + CHAMP + fit ICP. Regras editáveis em memória.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Lead } from "./types";

export type ScoringDimension = "budget" | "authority" | "need" | "timeline" | "fit" | "engagement";

export interface ScoringRule {
  id: string;
  dimension: ScoringDimension;
  label: string;
  weight: number; // 0..100 (soma ≈ 100)
  description: string;
  active: boolean;
}

export interface QualificationTier {
  id: "mql" | "sql" | "sao" | "descartar";
  label: string;
  min: number;
  max: number;
  colorVar: string;
  description: string;
}

// ============ Seed ============
export const DEFAULT_RULES: ScoringRule[] = [
  { id: "r-budget", dimension: "budget", label: "Orçamento declarado", weight: 20, description: "Cliente confirmou faixa de investimento compatível com nossos serviços.", active: true },
  { id: "r-authority", dimension: "authority", label: "Poder de decisão", weight: 15, description: "Contato é decisor ou influenciador direto.", active: true },
  { id: "r-need", dimension: "need", label: "Dor identificada", weight: 20, description: "Dor mapeada bate com ICP e casos de sucesso.", active: true },
  { id: "r-timeline", dimension: "timeline", label: "Prazo definido", weight: 10, description: "Cliente tem janela clara para implementar.", active: true },
  { id: "r-fit", dimension: "fit", label: "Fit com ICP", weight: 20, description: "Segmento, porte e região dentro do ICP ativo.", active: true },
  { id: "r-engagement", dimension: "engagement", label: "Engajamento recente", weight: 15, description: "Respostas em <48h, abertura de e-mails, cliques em propostas.", active: true },
];

export const QUALIFICATION_TIERS: QualificationTier[] = [
  { id: "sao", label: "SAO — Pronto p/ oferta", min: 80, max: 100, colorVar: "--stage-fechado", description: "Sales Accepted Opportunity: pode receber proposta." },
  { id: "sql", label: "SQL — Qualificado", min: 60, max: 79, colorVar: "--stage-negociacao", description: "Sales Qualified Lead: agendar diagnóstico." },
  { id: "mql", label: "MQL — Nutrição", min: 30, max: 59, colorVar: "--temp-morno", description: "Marketing Qualified Lead: nutrir com cadência." },
  { id: "descartar", label: "Descartar / reciclar", min: 0, max: 29, colorVar: "--stage-perdido", description: "Fit muito baixo — reciclar em 90 dias." },
];

export function tierForScore(score: number): QualificationTier {
  return QUALIFICATION_TIERS.find((t) => score >= t.min && score <= t.max) ?? QUALIFICATION_TIERS[3];
}

// Compõe uma nota BANT+CHAMP+fit a partir de sinais do lead demo
export function computeScoreBreakdown(lead: Lead, rules: ScoringRule[]) {
  const factors = new Set(lead.scoreFactors ?? []);
  const heat = lead.temperature === "quente" ? 1 : lead.temperature === "morno" ? 0.6 : 0.3;
  const stageBoost = ["proposta", "negociacao", "fechado"].includes(lead.stage) ? 1 : 0.7;
  const map: Record<ScoringDimension, number> = {
    budget: factors.has("orcamento") ? 1 : 0.4,
    authority: factors.has("decisor") ? 1 : 0.5,
    need: factors.has("dor_clara") ? 1 : heat * 0.9,
    timeline: factors.has("prazo") ? 1 : 0.55,
    fit: factors.has("fit_icp") ? 1 : 0.7,
    engagement: lead.lastContactAt ? 0.9 : 0.3,
  };
  const breakdown = rules.filter((r) => r.active).map((r) => ({
    rule: r,
    ratio: map[r.dimension],
    points: Math.round(map[r.dimension] * r.weight * stageBoost),
  }));
  const total = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
  return { total, breakdown, tier: tierForScore(total) };
}

// ============ Store simples ============
type Listener = () => void;
class RuleStore {
  private data: ScoringRule[] = [...DEFAULT_RULES];
  private listeners = new Set<Listener>();
  list() { return [...this.data]; }
  update(id: string, patch: Partial<ScoringRule>) {
    this.data = this.data.map((r) => (r.id === id ? { ...r, ...patch } : r));
    this.emit();
  }
  reset() { this.data = [...DEFAULT_RULES]; this.emit(); }
  subscribe(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit() { this.listeners.forEach((l) => l()); }
}
export const ruleStore = new RuleStore();

export function useScoringRules() {
  const qc = useQueryClient();
  useEffect(() => ruleStore.subscribe(() => qc.invalidateQueries({ queryKey: ["scoringRules"] })), [qc]);
  return useQuery({ queryKey: ["scoringRules"], queryFn: async () => ruleStore.list() });
}
