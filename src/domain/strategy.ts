// Módulo Estratégico — WF Digital CRM
// Types + seed para Diagnóstico, ICP, Personas, Territórios, Perfis de Venda.
// Vive isolado dos stores principais; hidratado por hooks dedicados.

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type UUID = string;

// ============ Diagnóstico ============
export interface DiagnosticAnswer {
  id: UUID;
  category: "posicionamento" | "mercado" | "operacao" | "vendas" | "marca";
  question: string;
  answer: string;
  score: number; // 0..5 (auto-avaliação)
}

export interface Diagnostic {
  id: UUID;
  companyName: string;
  updatedAt: string;
  maturityScore: number; // 0..100 derivado
  strengths: string[];
  gaps: string[];
  answers: DiagnosticAnswer[];
}

// ============ ICP ============
export interface ICP {
  id: UUID;
  name: string;
  description: string;
  segments: string[];
  porte: string[]; // ["Pequeno", "Médio", "Grande"]
  faturamento: string; // faixa
  regioes: string[];
  cargosDecisores: string[];
  doresPrincipais: string[];
  criteriosExclusao: string[];
  fitScore: number; // 0..100
  active: boolean;
}

// ============ Personas ============
export interface Persona {
  id: UUID;
  icpId: UUID;
  nome: string;
  cargo: string;
  perfil: string; // demográfico/comportamental
  responsabilidades: string[];
  objetivos: string[];
  dores: string[];
  gatilhos: string[];
  canaisPreferidos: string[];
  objecoes: string[];
}

// ============ Territórios ============
export interface Territory {
  id: UUID;
  nome: string;
  regiao: string;
  ufs: string[];
  segmentosFoco: string[];
  responsavelId?: string; // user id
  potencialEstimado: number; // R$
  contasAtivas: number;
  metaTrimestral: number;
}

// ============ Perfis de Venda ============
export interface SellingProfile {
  id: UUID;
  nome: string;
  descricao: string;
  cicloMedio: string; // ex: "45 dias"
  ticketMedio: number;
  canais: string[];
  cadenciaPadrao: string; // resumo
  playbookIds: string[];
  active: boolean;
}

// ============ Seed ============
const iso = (offsetHours = 0) => new Date(Date.now() + offsetHours * 3600 * 1000).toISOString();

export const diagnostics: Diagnostic[] = [
  {
    id: "dg-wf",
    companyName: "WF Digital",
    updatedAt: iso(-24 * 7),
    maturityScore: 72,
    strengths: [
      "Posicionamento claro em prospecção B2B",
      "Time comercial estruturado com papéis definidos",
      "Base de clientes ativa e referências fortes em MG",
    ],
    gaps: [
      "Cadências de follow-up não padronizadas",
      "Falta de scoring automatizado por engajamento",
      "Relatórios de conversão por canal ainda manuais",
    ],
    answers: [
      { id: "da-1", category: "posicionamento", question: "A proposta de valor está clara para o mercado?", answer: "Sim, focada em prospecção ativa B2B e implantação de CRM.", score: 4 },
      { id: "da-2", category: "mercado", question: "O ICP está documentado e validado?", answer: "Parcial — documentado, ainda em validação por segmento.", score: 3 },
      { id: "da-3", category: "operacao", question: "Existe playbook de vendas ativo?", answer: "Em construção. Cadências ainda informais.", score: 2 },
      { id: "da-4", category: "vendas", question: "Métricas de funil são monitoradas semanalmente?", answer: "Sim, com relatório automatizado do CRM.", score: 4 },
      { id: "da-5", category: "marca", question: "Presença digital ativa e consistente?", answer: "Site institucional + LinkedIn ativo. Falta conteúdo recorrente.", score: 3 },
    ],
  },
];

export const icps: ICP[] = [
  {
    id: "icp-industria",
    name: "Indústrias médias MG/SP",
    description: "Indústrias de transformação com operação consolidada, buscando estruturar comercial B2B.",
    segments: ["Metalurgia", "Alimentício", "Construção"],
    porte: ["Médio", "Grande"],
    faturamento: "R$ 20M – R$ 200M/ano",
    regioes: ["MG", "SP", "PR"],
    cargosDecisores: ["Diretor Comercial", "Sócio", "COO"],
    doresPrincipais: ["Time comercial sem previsibilidade", "Falta de CRM ativo", "Prospecção artesanal"],
    criteriosExclusao: ["Faturamento < R$ 5M", "Sem time comercial dedicado"],
    fitScore: 88,
    active: true,
  },
  {
    id: "icp-servicos",
    name: "Serviços profissionais premium",
    description: "Consultorias, contábeis e escritórios com alto ticket e ciclo de venda consultivo.",
    segments: ["Contábil", "Consultoria", "Jurídico"],
    porte: ["Pequeno", "Médio"],
    faturamento: "R$ 3M – R$ 30M/ano",
    regioes: ["MG", "SP", "RJ"],
    cargosDecisores: ["Sócio", "Diretor de Novos Negócios"],
    doresPrincipais: ["Dependência de indicação", "Poucos leads qualificados", "Sem processo comercial"],
    criteriosExclusao: ["Operação exclusivamente presencial", "Menos de 5 sócios/consultores"],
    fitScore: 74,
    active: true,
  },
  {
    id: "icp-varejo",
    name: "Redes de varejo especializado",
    description: "Redes com 3+ unidades buscando expansão e gestão comercial estruturada.",
    segments: ["Alimentação", "Fitness", "Saúde"],
    porte: ["Médio"],
    faturamento: "R$ 10M – R$ 80M/ano",
    regioes: ["MG", "SP"],
    cargosDecisores: ["Diretor", "Proprietário", "Gerente Regional"],
    doresPrincipais: ["Falta de CRM entre unidades", "Perda de leads no WhatsApp"],
    criteriosExclusao: ["Menos de 3 unidades"],
    fitScore: 62,
    active: false,
  },
];

export const personas: Persona[] = [
  {
    id: "p-diretor-comercial",
    icpId: "icp-industria",
    nome: "Diretor Comercial",
    cargo: "Diretor Comercial",
    perfil: "45–58 anos, background comercial forte, orientado a resultado trimestral.",
    responsabilidades: ["Meta anual da unidade", "Estrutura de vendas", "Contratação e treinamento"],
    objetivos: ["Previsibilidade de pipeline", "Reduzir CAC", "Expansão de mercado"],
    dores: ["Time sem cadência", "CRM desatualizado", "Prospecção dependente de 1–2 pessoas"],
    gatilhos: ["Queda de faturamento", "Pressão do sócio", "Concorrente ganhando conta"],
    canaisPreferidos: ["LinkedIn", "WhatsApp", "Indicação"],
    objecoes: ["Já temos CRM", "Time resiste a mudança", "Fez tentativas antes sem sucesso"],
  },
  {
    id: "p-socio-industria",
    icpId: "icp-industria",
    nome: "Sócio-Fundador",
    cargo: "Sócio",
    perfil: "50+, técnico de origem, aversão a mudança, decisor final.",
    responsabilidades: ["Estratégia de longo prazo", "Aprovação de investimentos"],
    objetivos: ["Perpetuidade do negócio", "ROI claro", "Reduzir dependência pessoal"],
    dores: ["Dependência pessoal em vendas", "Fluxo de caixa oscilante"],
    gatilhos: ["Aposentadoria próxima", "Sucessão familiar", "Venda da empresa"],
    canaisPreferidos: ["Reunião presencial", "WhatsApp", "Indicação"],
    objecoes: ["Custo", "Complexidade", "Falta de tempo do time"],
  },
  {
    id: "p-diretor-servicos",
    icpId: "icp-servicos",
    nome: "Diretor de Novos Negócios",
    cargo: "Diretor",
    perfil: "35–50 anos, comercial consultivo, foco em relacionamento.",
    responsabilidades: ["Captação de novos clientes", "Parcerias estratégicas"],
    objetivos: ["Diversificar carteira", "Aumentar ticket médio", "Reduzir dependência de indicação"],
    dores: ["Poucos leads inbound", "Ciclo longo sem previsibilidade"],
    gatilhos: ["Perda de cliente grande", "Investimento em marketing"],
    canaisPreferidos: ["LinkedIn", "E-mail", "Evento setorial"],
    objecoes: ["Não é hora", "Precisamos validar internamente"],
  },
];

export const territories: Territory[] = [
  { id: "tr-mg-centro", nome: "MG Centro", regiao: "Sudeste", ufs: ["MG"], segmentosFoco: ["Metalurgia", "Construção"], responsavelId: "u-vend3", potencialEstimado: 2400000, contasAtivas: 18, metaTrimestral: 360000 },
  { id: "tr-mg-sul", nome: "MG Sul de Minas", regiao: "Sudeste", ufs: ["MG"], segmentosFoco: ["Alimentício", "Agro"], responsavelId: "u-vend2", potencialEstimado: 1600000, contasAtivas: 12, metaTrimestral: 220000 },
  { id: "tr-sp-cap", nome: "SP Capital", regiao: "Sudeste", ufs: ["SP"], segmentosFoco: ["Serviços", "Varejo"], responsavelId: "u-vend1", potencialEstimado: 3100000, contasAtivas: 9, metaTrimestral: 480000 },
  { id: "tr-sul", nome: "Sul (PR/RS)", regiao: "Sul", ufs: ["PR", "RS"], segmentosFoco: ["Logística", "Indústria"], responsavelId: "u-vend2", potencialEstimado: 1200000, contasAtivas: 7, metaTrimestral: 180000 },
];

export const sellingProfiles: SellingProfile[] = [
  {
    id: "sp-inbound",
    nome: "Inbound Consultivo",
    descricao: "Lead entra via site/LinkedIn, qualificação por SDR, demo com AE.",
    cicloMedio: "30 dias",
    ticketMedio: 15000,
    canais: ["Site", "LinkedIn", "E-mail"],
    cadenciaPadrao: "D0 contato, D+2 e-mail, D+5 ligação, D+8 WhatsApp, D+14 breakup",
    playbookIds: ["pb-1"],
    active: true,
  },
  {
    id: "sp-outbound",
    nome: "Outbound B2B",
    descricao: "Prospecção ativa via lista curada, cold call e WhatsApp autorizado.",
    cicloMedio: "45 dias",
    ticketMedio: 28000,
    canais: ["Cold call", "WhatsApp", "LinkedIn InMail"],
    cadenciaPadrao: "D0 ligação, D+1 WhatsApp, D+3 e-mail, D+7 ligação, D+12 breakup",
    playbookIds: ["pb-2"],
    active: true,
  },
  {
    id: "sp-key-account",
    nome: "Key Account Enterprise",
    descricao: "Grandes contas com múltiplos stakeholders, ciclo longo.",
    cicloMedio: "90 dias",
    ticketMedio: 85000,
    canais: ["Reunião presencial", "LinkedIn", "Indicação"],
    cadenciaPadrao: "Mapeamento de stakeholders, POC, business case, aprovação executiva",
    playbookIds: ["pb-3"],
    active: true,
  },
];

// ============ Store simples in-memory ============
type Listener = () => void;
class SimpleStore<T extends { id: string }> {
  data: T[];
  private ls = new Set<Listener>();
  constructor(init: T[]) { this.data = [...init]; }
  list() { return [...this.data]; }
  get(id: string) { return this.data.find((r) => r.id === id); }
  upsert(row: T) {
    const i = this.data.findIndex((r) => r.id === row.id);
    if (i >= 0) this.data[i] = row; else this.data.unshift(row);
    this.ls.forEach((l) => l());
  }
  remove(id: string) {
    this.data = this.data.filter((r) => r.id !== id);
    this.ls.forEach((l) => l());
  }
  subscribe(l: Listener) { this.ls.add(l); return () => this.ls.delete(l); }
}

export const strategyStores = {
  diagnostics: new SimpleStore<Diagnostic>(diagnostics),
  icps: new SimpleStore<ICP>(icps),
  personas: new SimpleStore<Persona>(personas),
  territories: new SimpleStore<Territory>(territories),
  sellingProfiles: new SimpleStore<SellingProfile>(sellingProfiles),
};

// ============ Hooks ============
export function useStrategySync() {
  const qc = useQueryClient();
  useEffect(() => {
    const unsubs = Object.entries(strategyStores).map(([key, s]) =>
      s.subscribe(() => qc.invalidateQueries({ queryKey: [`strategy:${key}`] })),
    );
    return () => unsubs.forEach((u) => u());
  }, [qc]);
}

export const useDiagnostics = () =>
  useQuery({ queryKey: ["strategy:diagnostics"], queryFn: async () => strategyStores.diagnostics.list() });
export const useICPs = () =>
  useQuery({ queryKey: ["strategy:icps"], queryFn: async () => strategyStores.icps.list() });
export const usePersonas = () =>
  useQuery({ queryKey: ["strategy:personas"], queryFn: async () => strategyStores.personas.list() });
export const useTerritories = () =>
  useQuery({ queryKey: ["strategy:territories"], queryFn: async () => strategyStores.territories.list() });
export const useSellingProfiles = () =>
  useQuery({ queryKey: ["strategy:sellingProfiles"], queryFn: async () => strategyStores.sellingProfiles.list() });
