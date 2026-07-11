// Playbooks — WF Digital CRM
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { LeadStageId } from "./types";

export interface PlaybookStep {
  id: string;
  order: number;
  title: string;
  description: string;
  outcome: string;
  script?: string;
}

export interface Playbook {
  id: string;
  name: string;
  stage: LeadStageId | "todos";
  personaIds: string[];
  objective: string;
  successCriteria: string[];
  checklist: string[];
  steps: PlaybookStep[];
  updatedAt: string;
}

const seed: Playbook[] = [
  {
    id: "pb-diag",
    name: "Diagnóstico de descoberta",
    stage: "prospeccao",
    personaIds: ["pers-diretor-industria", "pers-gerente-marketing"],
    objective: "Mapear dor, contexto e critérios de decisão em 40min.",
    successCriteria: [
      "Dor principal identificada e priorizada",
      "Decisor e influenciadores mapeados",
      "Orçamento e prazo pré-validados",
      "Próximo passo com data marcada",
    ],
    checklist: [
      "Pesquisar empresa (site, LinkedIn, notícias)",
      "Validar ICP no CRM",
      "Enviar convite com pauta 24h antes",
      "Preparar 3 perguntas específicas do segmento",
    ],
    steps: [
      { id: "s1", order: 1, title: "Rapport (5min)", description: "Contexto pessoal + confirmação da pauta.", outcome: "Cliente confortável e aberto." },
      { id: "s2", order: 2, title: "Situação atual (10min)", description: "Como funciona hoje? O que tentaram? O que já funcionou?", outcome: "Baseline documentado.", script: "Me conta como vocês fazem X hoje…" },
      { id: "s3", order: 3, title: "Dor & impacto (10min)", description: "Quantificar impacto financeiro / operacional.", outcome: "Dor priorizada por urgência.", script: "Se isso continuar por mais 6 meses, o que acontece?" },
      { id: "s4", order: 4, title: "Critérios & processo (10min)", description: "BANT: budget, authority, need, timeline.", outcome: "SQL confirmado ou reciclado." },
      { id: "s5", order: 5, title: "Fechar próximo passo (5min)", description: "Agendar apresentação de proposta.", outcome: "Data e participantes definidos." },
    ],
    updatedAt: "2026-07-01T14:00:00Z",
  },
  {
    id: "pb-obj",
    name: "Contorno de objeções — preço",
    stage: "negociacao",
    personaIds: ["pers-diretor-industria"],
    objective: "Reposicionar valor quando o cliente questiona investimento.",
    successCriteria: [
      "Objeção nomeada e reformulada",
      "Prova social entregue",
      "Novo próximo passo agendado",
    ],
    checklist: [
      "Ter 2 cases do mesmo segmento à mão",
      "Ter calculadora de ROI aberta",
      "Confirmar quem participa da conversa",
    ],
    steps: [
      { id: "s1", order: 1, title: "Escutar sem interromper", description: "Deixar cliente terminar o argumento completo.", outcome: "Objeção real identificada." },
      { id: "s2", order: 2, title: "Reformular a objeção", description: "'Então o que preocupa é X — está certo?'", outcome: "Cliente concorda com a reformulação.", script: "Só para eu entender bem: o que te preocupa é…" },
      { id: "s3", order: 3, title: "Trazer prova social", description: "Case com número comparável.", outcome: "Cliente reduz resistência." },
      { id: "s4", order: 4, title: "Propor teste ou ajuste", description: "Piloto, escopo reduzido ou pagamento em fases.", outcome: "Sinal de avanço." },
    ],
    updatedAt: "2026-06-20T12:00:00Z",
  },
  {
    id: "pb-fech",
    name: "Fechamento consultivo",
    stage: "proposta",
    personaIds: ["pers-diretor-industria", "pers-gerente-marketing"],
    objective: "Conduzir o cliente do 'gostei' para o 'assinei' em ≤14 dias.",
    successCriteria: [
      "Proposta apresentada ao decisor",
      "Todas as objeções mapeadas e tratadas",
      "Data de assinatura acordada",
    ],
    checklist: [
      "Revisar proposta com gestor",
      "Confirmar CNPJ e dados fiscais",
      "Preparar 3 caminhos de negociação",
    ],
    steps: [
      { id: "s1", order: 1, title: "Recapitular dor e valor", description: "Retomar o que motivou a proposta.", outcome: "Cliente reconhece o problema." },
      { id: "s2", order: 2, title: "Apresentar solução em blocos", description: "Escopo, entregáveis, prazos, investimento.", outcome: "Sem surpresas ao final." },
      { id: "s3", order: 3, title: "Perguntar diretamente", description: "'O que falta para começarmos?'", outcome: "Objeções finais na mesa.", script: "Da sua parte, o que falta para começarmos?" },
      { id: "s4", order: 4, title: "Formalizar", description: "Enviar contrato + link de assinatura.", outcome: "Fechamento confirmado." },
    ],
    updatedAt: "2026-07-05T09:00:00Z",
  },
];

type Listener = () => void;
class PlaybookStore {
  private data = [...seed];
  private listeners = new Set<Listener>();
  list() { return [...this.data]; }
  get(id: string) { return this.data.find((p) => p.id === id); }
  subscribe(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
}
export const playbookStore = new PlaybookStore();

export function usePlaybooks() {
  const qc = useQueryClient();
  useEffect(() => playbookStore.subscribe(() => qc.invalidateQueries({ queryKey: ["playbooks"] })), [qc]);
  return useQuery({ queryKey: ["playbooks"], queryFn: async () => playbookStore.list() });
}
