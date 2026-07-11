// Campanhas & Cadências — WF Digital CRM
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export type CampaignChannel = "email" | "whatsapp" | "telefone" | "linkedin";
export type CampaignStatus = "rascunho" | "ativa" | "pausada" | "encerrada";

export interface CadenceStep {
  id: string;
  order: number;
  channel: CampaignChannel;
  delayDays: number;
  title: string;
  templateSnippet: string;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  icpId?: string;
  status: CampaignStatus;
  ownerId: string;
  audienceSize: number;
  sent: number;
  responses: number;
  meetings: number;
  wins: number;
  steps: CadenceStep[];
  startedAt?: string;
  updatedAt: string;
}

const seed: Campaign[] = [
  {
    id: "camp-1",
    name: "Indústrias RS · Q4",
    objective: "Agendar diagnóstico com indústrias de médio porte em Caxias/Passo Fundo.",
    icpId: "icp-industria",
    status: "ativa",
    ownerId: "u-carlos",
    audienceSize: 84,
    sent: 71,
    responses: 19,
    meetings: 6,
    wins: 2,
    startedAt: "2026-06-10T09:00:00Z",
    updatedAt: "2026-07-08T14:30:00Z",
    steps: [
      { id: "s1", order: 1, channel: "email", delayDays: 0, title: "Abertura — dor de produtividade", templateSnippet: "Olá {{nome}}, notei que a {{empresa}} vem crescendo em {{cidade}}…" },
      { id: "s2", order: 2, channel: "linkedin", delayDays: 2, title: "Conexão + comentário", templateSnippet: "Convite personalizado + comentário em post recente." },
      { id: "s3", order: 3, channel: "whatsapp", delayDays: 4, title: "Follow-up curto", templateSnippet: "Consegui te mandar o material sobre {{tema}}?" },
      { id: "s4", order: 4, channel: "telefone", delayDays: 7, title: "Ligação de qualificação", templateSnippet: "Script BANT + agendamento de diagnóstico." },
      { id: "s5", order: 5, channel: "email", delayDays: 12, title: "Break-up", templateSnippet: "Faz sentido pausarmos por 90 dias?" },
    ],
  },
  {
    id: "camp-2",
    name: "Serviços B2B · Reativação",
    objective: "Reengajar contas frias que já receberam proposta em 2025.",
    status: "pausada",
    ownerId: "u-patricia",
    audienceSize: 42,
    sent: 42,
    responses: 8,
    meetings: 3,
    wins: 1,
    startedAt: "2026-05-02T09:00:00Z",
    updatedAt: "2026-06-30T18:00:00Z",
    steps: [
      { id: "s1", order: 1, channel: "email", delayDays: 0, title: "Novidades 2026", templateSnippet: "Voltamos com novo case de {{segmento}}…" },
      { id: "s2", order: 2, channel: "whatsapp", delayDays: 3, title: "Pergunta aberta", templateSnippet: "O que mudou aí em {{empresa}} desde a nossa última conversa?" },
      { id: "s3", order: 3, channel: "telefone", delayDays: 6, title: "Ligar para decisor", templateSnippet: "Retomar contexto e propor call de 20min." },
    ],
  },
  {
    id: "camp-3",
    name: "Varejo Regional · Novos",
    objective: "Prospecção fria em redes de varejo com >5 lojas.",
    status: "rascunho",
    ownerId: "u-carlos",
    audienceSize: 0,
    sent: 0, responses: 0, meetings: 0, wins: 0,
    updatedAt: "2026-07-10T10:00:00Z",
    steps: [
      { id: "s1", order: 1, channel: "email", delayDays: 0, title: "Abertura — case varejo", templateSnippet: "Como a Rede X aumentou ticket em 22%…" },
      { id: "s2", order: 2, channel: "linkedin", delayDays: 2, title: "Conexão", templateSnippet: "Solicitação de conexão." },
    ],
  },
];

type Listener = () => void;
class CampaignStore {
  private data = [...seed];
  private listeners = new Set<Listener>();
  list() { return [...this.data]; }
  get(id: string) { return this.data.find((c) => c.id === id); }
  upsert(c: Campaign) {
    this.data = this.data.some((x) => x.id === c.id) ? this.data.map((x) => (x.id === c.id ? c : x)) : [c, ...this.data];
    this.emit();
  }
  toggleStatus(id: string) {
    const c = this.get(id); if (!c) return;
    const next: CampaignStatus = c.status === "ativa" ? "pausada" : c.status === "pausada" ? "ativa" : c.status;
    this.upsert({ ...c, status: next, updatedAt: new Date().toISOString() });
  }
  subscribe(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }
  private emit() { this.listeners.forEach((l) => l()); }
}
export const campaignStore = new CampaignStore();

export function useCampaigns() {
  const qc = useQueryClient();
  useEffect(() => campaignStore.subscribe(() => qc.invalidateQueries({ queryKey: ["campaigns"] })), [qc]);
  return useQuery({ queryKey: ["campaigns"], queryFn: async () => campaignStore.list() });
}
