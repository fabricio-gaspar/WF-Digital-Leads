// ============================================================
// canonical.ts — Fatia 1 (Modelo de dados canônico)
// Entidades transversais + níveis de autonomia + kill-switch global
// Persistidas em localStorage, escopadas por organizationId.
// ============================================================
import { useSyncExternalStore } from "react";
import { ORGANIZATION_ID, CURRENT_USER_ID, appendAudit } from "./DemoDataProvider";

// ---------- persistência genérica ----------
function persistedStore<T>(key: string, initial: T[]) {
  let data: T[] = initial;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) data = JSON.parse(raw) as T[];
    } catch {
      /* ignore */
    }
  }
  const listeners = new Set<() => void>();
  const persist = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }
  };
  return {
    get: () => data,
    set: (fn: (d: T[]) => T[]) => {
      data = fn(data);
      persist();
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

function persistedValue<T>(key: string, initial: T) {
  let data: T = initial;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) data = JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
  }
  const listeners = new Set<() => void>();
  const persist = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }
  };
  return {
    get: () => data,
    set: (v: T) => {
      data = v;
      persist();
      listeners.forEach((l) => l());
    },
    subscribe: (l: () => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

// ============================================================
// Empresas — registro único canônico (deduplicado)
// ============================================================
export interface Empresa {
  id: string;
  organizationId: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  segmento?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  site?: string;
  porte?: string;
  proveniencia: Array<{ source: string; at: string }>;
  criadoEm: string;
}

const empresasStore = persistedStore<Empresa>("wfdl:empresas", [
  {
    id: "emp-seed-1",
    organizationId: ORGANIZATION_ID,
    razaoSocial: "Padaria Trigo Dourado LTDA",
    nomeFantasia: "Padaria Trigo Dourado",
    segmento: "Alimentos",
    cidade: "São Roque",
    uf: "SP",
    porte: "5-10 func",
    proveniencia: [{ source: "seed", at: new Date().toISOString() }],
    criadoEm: new Date().toISOString(),
  },
  {
    id: "emp-seed-2",
    organizationId: ORGANIZATION_ID,
    razaoSocial: "Metalúrgica Aço Vale LTDA",
    nomeFantasia: "Metalúrgica Aço Vale",
    segmento: "Metalurgia",
    cidade: "Sorocaba",
    uf: "SP",
    porte: "50-100 func",
    proveniencia: [{ source: "seed", at: new Date().toISOString() }],
    criadoEm: new Date().toISOString(),
  },
]);
export const useEmpresas = () =>
  useSyncExternalStore(empresasStore.subscribe, empresasStore.get, empresasStore.get);
export function upsertEmpresa(e: Omit<Empresa, "id" | "organizationId" | "criadoEm"> & { id?: string }) {
  const now = new Date().toISOString();
  const list = empresasStore.get();
  // Dedupe por CNPJ ou razaoSocial+cidade
  const existing = list.find(
    (x) =>
      (e.cnpj && x.cnpj && x.cnpj === e.cnpj) ||
      (x.razaoSocial.toLowerCase() === e.razaoSocial.toLowerCase() && x.cidade === e.cidade),
  );
  if (existing) {
    empresasStore.set((d) =>
      d.map((x) =>
        x.id === existing.id
          ? { ...x, ...e, proveniencia: [...x.proveniencia, ...e.proveniencia] }
          : x,
      ),
    );
    return existing;
  }
  const empresa: Empresa = {
    id: e.id ?? `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organizationId: ORGANIZATION_ID,
    criadoEm: now,
    ...e,
  };
  empresasStore.set((d) => [empresa, ...d]);
  return empresa;
}

// ============================================================
// Produtos e Ofertas
// ============================================================
export interface Produto {
  id: string;
  organizationId: string;
  nome: string;
  descricao: string;
  precoBase: number;
  unidade: string;
  categoria: string;
  ativo: boolean;
}

const produtosStore = persistedStore<Produto>("wfdl:produtos", [
  {
    id: "pr-1",
    organizationId: ORGANIZATION_ID,
    nome: "Site institucional 5 páginas",
    descricao: "Site responsivo, formulário e integração básica",
    precoBase: 4500,
    unidade: "projeto",
    categoria: "Sites",
    ativo: true,
  },
  {
    id: "pr-2",
    organizationId: ORGANIZATION_ID,
    nome: "Sistema web sob medida (MVP)",
    descricao: "Módulo inicial customizado + 90 dias de suporte",
    precoBase: 28000,
    unidade: "projeto",
    categoria: "Software",
    ativo: true,
  },
  {
    id: "pr-3",
    organizationId: ORGANIZATION_ID,
    nome: "Automação com IA (mensal)",
    descricao: "Agente IA + integração + suporte",
    precoBase: 2900,
    unidade: "mês",
    categoria: "IA",
    ativo: true,
  },
  {
    id: "pr-4",
    organizationId: ORGANIZATION_ID,
    nome: "Manutenção mensal",
    descricao: "Suporte, backups e atualizações",
    precoBase: 890,
    unidade: "mês",
    categoria: "Suporte",
    ativo: true,
  },
]);
export const useProdutos = () =>
  useSyncExternalStore(produtosStore.subscribe, produtosStore.get, produtosStore.get);
export function upsertProduto(p: Omit<Produto, "id" | "organizationId"> & { id?: string }) {
  const list = produtosStore.get();
  if (p.id && list.some((x) => x.id === p.id)) {
    produtosStore.set((d) => d.map((x) => (x.id === p.id ? { ...x, ...p } as Produto : x)));
    return list.find((x) => x.id === p.id)!;
  }
  const novo: Produto = {
    id: p.id ?? `pr-${Date.now()}`,
    organizationId: ORGANIZATION_ID,
    ...p,
  };
  produtosStore.set((d) => [novo, ...d]);
  return novo;
}
export function removeProduto(id: string) {
  produtosStore.set((d) => d.filter((x) => x.id !== id));
}

export interface Oferta {
  id: string;
  organizationId: string;
  nome: string;
  servicoId?: string;
  produtoIds: string[];
  desconto: number; // %
  observacao: string;
  ativa: boolean;
}
const ofertasStore = persistedStore<Oferta>("wfdl:ofertas", [
  {
    id: "of-1",
    organizationId: ORGANIZATION_ID,
    nome: "Combo Presença Digital",
    produtoIds: ["pr-1", "pr-4"],
    desconto: 10,
    observacao: "Site + manutenção 3 meses inclusos",
    ativa: true,
  },
]);
export const useOfertas = () =>
  useSyncExternalStore(ofertasStore.subscribe, ofertasStore.get, ofertasStore.get);
export function upsertOferta(o: Omit<Oferta, "id" | "organizationId"> & { id?: string }) {
  const list = ofertasStore.get();
  if (o.id && list.some((x) => x.id === o.id)) {
    ofertasStore.set((d) => d.map((x) => (x.id === o.id ? { ...x, ...o } as Oferta : x)));
    return list.find((x) => x.id === o.id)!;
  }
  const novo: Oferta = { id: o.id ?? `of-${Date.now()}`, organizationId: ORGANIZATION_ID, ...o };
  ofertasStore.set((d) => [novo, ...d]);
  return novo;
}
export function removeOferta(id: string) {
  ofertasStore.set((d) => d.filter((x) => x.id !== id));
}

// ============================================================
// Vendedores
// ============================================================
export interface Vendedor {
  id: string;
  organizationId: string;
  nome: string;
  email: string;
  especialidades: string[]; // serviçoIds
  territorio: string[]; // UFs
  cargaMax: number;
  cargaAtual: number;
  disponivel: boolean;
}
const vendedoresStore = persistedStore<Vendedor>("wfdl:vendedores", [
  { id: "v-1", organizationId: ORGANIZATION_ID, nome: "Carlos SDR", email: "carlos@wfdigital.com.br", especialidades: ["sv-sites", "sv-sistemas"], territorio: ["SP"], cargaMax: 15, cargaAtual: 6, disponivel: true },
  { id: "v-2", organizationId: ORGANIZATION_ID, nome: "Marina Vendas", email: "marina@wfdigital.com.br", especialidades: ["sv-sistemas", "sv-ia"], territorio: ["SP", "RJ", "MG"], cargaMax: 12, cargaAtual: 4, disponivel: true },
  { id: "v-3", organizationId: ORGANIZATION_ID, nome: "Roberto KA", email: "roberto@wfdigital.com.br", especialidades: ["sv-ia", "sv-rede"], territorio: ["SP", "PR", "RS"], cargaMax: 10, cargaAtual: 9, disponivel: true },
]);
export const useVendedores = () =>
  useSyncExternalStore(vendedoresStore.subscribe, vendedoresStore.get, vendedoresStore.get);
export function updateVendedor(id: string, patch: Partial<Vendedor>) {
  vendedoresStore.set((d) => d.map((v) => (v.id === id ? { ...v, ...patch } : v)));
}

// Round-robin com peso: menor carga%, território batendo, especialidade batendo, disponível.
export function distributeLead(input: {
  servicoId?: string;
  uf?: string;
}): Vendedor | null {
  const list = vendedoresStore.get().filter((v) => v.disponivel && v.cargaAtual < v.cargaMax);
  if (!list.length) return null;
  const scored = list.map((v) => {
    let score = 100 - (v.cargaAtual / v.cargaMax) * 100;
    if (input.servicoId && v.especialidades.includes(input.servicoId)) score += 30;
    if (input.uf && v.territorio.includes(input.uf)) score += 20;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.v ?? null;
}

// ============================================================
// Scores multidimensionais
// ============================================================
export interface MultiScores {
  fit: number;
  intent: number;
  engagement: number;
  qualidade: number;
  heat: number;
}
export function computeMultiScores(input: {
  segmentoMatch?: boolean;
  porteMatch?: boolean;
  respondeuUltimaMsg?: boolean;
  mensagensTrocadas?: number;
  emailValido?: boolean;
  telefoneValido?: boolean;
  perguntouPreco?: boolean;
  pediuReuniao?: boolean;
}): MultiScores {
  const fit = 40 + (input.segmentoMatch ? 30 : 0) + (input.porteMatch ? 30 : 0);
  const intent =
    30 + (input.perguntouPreco ? 30 : 0) + (input.pediuReuniao ? 40 : 0);
  const engagement =
    20 + Math.min(60, (input.mensagensTrocadas ?? 0) * 10) + (input.respondeuUltimaMsg ? 20 : 0);
  const qualidade = 40 + (input.emailValido ? 30 : 0) + (input.telefoneValido ? 30 : 0);
  const heat = Math.round((fit + intent + engagement) / 3);
  return {
    fit: Math.min(100, fit),
    intent: Math.min(100, intent),
    engagement: Math.min(100, engagement),
    qualidade: Math.min(100, qualidade),
    heat: Math.min(100, heat),
  };
}

// ============================================================
// Oportunidades (funil separado do funil de Leads)
// ============================================================
export type OportunidadeEstagio =
  | "Descoberta"
  | "Qualificado"
  | "Proposta enviada"
  | "Negociação"
  | "Ganho"
  | "Perdido";

export interface Oportunidade {
  id: string;
  organizationId: string;
  empresaId: string;
  leadId?: string;
  vendedorId: string;
  servicoId?: string;
  origem: string;
  estagio: OportunidadeEstagio;
  valorEstimado: number;
  probabilidade: number;
  dataPrevisaoFechamento: string;
  scores: MultiScores;
  motivoPerda?: string;
  criadoEm: string;
  atualizadoEm: string;
}

const oportunidadesStore = persistedStore<Oportunidade>("wfdl:oportunidades", [
  {
    id: "op-seed-1",
    organizationId: ORGANIZATION_ID,
    empresaId: "emp-seed-2",
    vendedorId: "v-2",
    servicoId: "sv-sistemas",
    origem: "Handoff SDR",
    estagio: "Proposta enviada",
    valorEstimado: 45000,
    probabilidade: 65,
    dataPrevisaoFechamento: new Date(Date.now() + 15 * 86_400_000).toISOString().slice(0, 10),
    scores: { fit: 90, intent: 78, engagement: 82, qualidade: 80, heat: 84 },
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
]);
export const useOportunidades = () =>
  useSyncExternalStore(oportunidadesStore.subscribe, oportunidadesStore.get, oportunidadesStore.get);

export function createOportunidade(o: Omit<Oportunidade, "id" | "organizationId" | "criadoEm" | "atualizadoEm">): Oportunidade {
  const now = new Date().toISOString();
  const nova: Oportunidade = {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organizationId: ORGANIZATION_ID,
    criadoEm: now,
    atualizadoEm: now,
    ...o,
  };
  oportunidadesStore.set((d) => [nova, ...d]);
  appendAudit({
    action: "handoff.updated",
    entityType: "oportunidade",
    entityId: nova.id,
    metadata: { empresaId: nova.empresaId, valor: nova.valorEstimado, vendedorId: nova.vendedorId },
  });
  return nova;
}

export function updateOportunidade(id: string, patch: Partial<Oportunidade>) {
  oportunidadesStore.set((d) =>
    d.map((o) => (o.id === id ? { ...o, ...patch, atualizadoEm: new Date().toISOString() } : o)),
  );
  appendAudit({
    action: "handoff.updated",
    entityType: "oportunidade",
    entityId: id,
    metadata: { patch: JSON.stringify(patch).slice(0, 120) },
  });
}

// ============================================================
// Orçamentos (CPQ)
// ============================================================
export interface LinhaOrcamento {
  id: string;
  produtoId?: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  desconto: number; // %
}
export type StatusOrcamento =
  | "Rascunho"
  | "Aguardando aprovação"
  | "Aprovado"
  | "Enviado"
  | "Aceito"
  | "Recusado";

export interface Orcamento {
  id: string;
  organizationId: string;
  numero: string;
  versao: number;
  oportunidadeId: string;
  empresaId: string;
  vendedorId: string;
  linhas: LinhaOrcamento[];
  descontoGeral: number; // %
  observacoes: string;
  validadeDias: number;
  status: StatusOrcamento;
  criadoEm: string;
  atualizadoEm: string;
  aprovadoPor?: string;
}

const orcamentosStore = persistedStore<Orcamento>("wfdl:orcamentos", []);
export const useOrcamentos = () =>
  useSyncExternalStore(orcamentosStore.subscribe, orcamentosStore.get, orcamentosStore.get);

export function nextOrcamentoNumero(): string {
  const y = new Date().getFullYear();
  const count = orcamentosStore.get().length + 1;
  return `ORC-${y}-${String(count).padStart(4, "0")}`;
}
export function createOrcamento(o: Omit<Orcamento, "id" | "organizationId" | "criadoEm" | "atualizadoEm" | "numero" | "versao" | "status"> & { status?: StatusOrcamento }): Orcamento {
  const now = new Date().toISOString();
  const novo: Orcamento = {
    id: `orc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    organizationId: ORGANIZATION_ID,
    numero: nextOrcamentoNumero(),
    versao: 1,
    criadoEm: now,
    atualizadoEm: now,
    status: o.status ?? "Rascunho",
    ...o,
  };
  orcamentosStore.set((d) => [novo, ...d]);
  appendAudit({
    action: "handoff.updated",
    entityType: "orcamento",
    entityId: novo.id,
    metadata: { numero: novo.numero, oportunidadeId: novo.oportunidadeId },
  });
  return novo;
}
export function updateOrcamento(id: string, patch: Partial<Orcamento>) {
  orcamentosStore.set((d) =>
    d.map((o) => (o.id === id ? { ...o, ...patch, atualizadoEm: new Date().toISOString() } : o)),
  );
}
export function aprovarOrcamento(id: string, aprovado: boolean, aprovadoPor?: string) {
  updateOrcamento(id, {
    status: aprovado ? "Aprovado" : "Rascunho",
    aprovadoPor: aprovado ? aprovadoPor ?? "gestor@wfdl" : undefined,
  });
  appendAudit({
    action: aprovado ? "handoff.accepted" : "handoff.rejected",
    entityType: "orcamento",
    entityId: id,
    metadata: {},
  });
}
export function nextVersaoOrcamento(id: string) {
  const orig = orcamentosStore.get().find((o) => o.id === id);
  if (!orig) return null;
  const clone: Orcamento = {
    ...orig,
    id: `orc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    versao: orig.versao + 1,
    status: "Rascunho",
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
  orcamentosStore.set((d) => [clone, ...d]);
  return clone;
}
export function computeOrcamentoTotals(o: Orcamento) {
  const subtotal = o.linhas.reduce(
    (s, l) => s + l.quantidade * l.precoUnitario * (1 - l.desconto / 100),
    0,
  );
  const totalDesconto = subtotal * (o.descontoGeral / 100);
  const total = subtotal - totalDesconto;
  return { subtotal, totalDesconto, total };
}

// ============================================================
// Metas / Mission Control
// ============================================================
export interface Meta {
  id: string;
  organizationId: string;
  titulo: string;
  descricao: string;
  servicoId?: string;
  perfilBuscaId?: string;
  metricaAlvo: number;
  metricaTipo: "leads" | "oportunidades" | "receita";
  prazo: string; // ISO date
  status: "Ativa" | "Concluída" | "Pausada";
  planoGerado?: PlanoAcao;
  criadoEm: string;
}
export interface PlanoAcao {
  passos: Array<{ titulo: string; descricao: string; done: boolean }>;
  criadoEm: string;
}
const metasStore = persistedStore<Meta>("wfdl:metas", []);
export const useMetas = () =>
  useSyncExternalStore(metasStore.subscribe, metasStore.get, metasStore.get);
export function createMeta(m: Omit<Meta, "id" | "organizationId" | "criadoEm" | "status" | "planoGerado"> & { status?: Meta["status"] }): Meta {
  const nova: Meta = {
    id: `mt-${Date.now()}`,
    organizationId: ORGANIZATION_ID,
    criadoEm: new Date().toISOString(),
    status: m.status ?? "Ativa",
    ...m,
    planoGerado: gerarPlanoAcao(m),
  };
  metasStore.set((d) => [nova, ...d]);
  appendAudit({
    action: "handoff.updated",
    entityType: "meta",
    entityId: nova.id,
    metadata: { titulo: nova.titulo, alvo: nova.metricaAlvo, tipo: nova.metricaTipo },
  });
  return nova;
}
export function updateMeta(id: string, patch: Partial<Meta>) {
  metasStore.set((d) => d.map((m) => (m.id === id ? { ...m, ...patch } : m)));
}
export function toggleMetaPasso(id: string, idx: number) {
  metasStore.set((d) =>
    d.map((m) =>
      m.id === id && m.planoGerado
        ? {
            ...m,
            planoGerado: {
              ...m.planoGerado,
              passos: m.planoGerado.passos.map((p, i) => (i === idx ? { ...p, done: !p.done } : p)),
            },
          }
        : m,
    ),
  );
}
function gerarPlanoAcao(m: Omit<Meta, "id" | "organizationId" | "criadoEm" | "status" | "planoGerado">): PlanoAcao {
  const passos = [
    { titulo: "1. Validar Perfil de Busca", descricao: `Confirmar critérios do perfil vinculado à meta "${m.titulo}"`, done: false },
    { titulo: "2. Executar busca multifonte", descricao: `Rodar busca até atingir ${Math.round(m.metricaAlvo * 3)} candidatos brutos`, done: false },
    { titulo: "3. Enriquecer e deduplicar", descricao: "Passar pela cascata gmaps → linkedin → web e dedupe canônico", done: false },
    { titulo: "4. Elegibilidade e priorização", descricao: "Rodar motor de elegibilidade e ordenar por scores", done: false },
    { titulo: "5. Distribuir aos vendedores", descricao: "Round-robin considerando território/carga/especialidade", done: false },
    { titulo: "6. SDR: apresentação e aquecimento", descricao: "Fluxo apresentação → permissão → aquecimento → qualificação", done: false },
    { titulo: "7. Fechar oportunidades e orçamentos", descricao: `Meta: ${m.metricaAlvo} ${m.metricaTipo} até ${m.prazo}`, done: false },
  ];
  return { passos, criadoEm: new Date().toISOString() };
}

// ============================================================
// Autonomia + kill-switch global
// ============================================================
export type AutonomyLevel = "Sombra" | "Copiloto" | "Semiautomático" | "PilotoAutomatico";
export const AUTONOMY_DESCRIPTIONS: Record<AutonomyLevel, string> = {
  Sombra: "SDR apenas observa e registra sugestões — nenhuma ação vai para produção.",
  Copiloto: "SDR sugere próxima ação; humano executa clique a clique.",
  Semiautomático: "SDR gera rascunhos aprovados por humano antes de enviar (padrão).",
  PilotoAutomatico: "SDR envia sozinho respeitando guardrails; humano audita depois.",
};

interface AutonomyState {
  level: AutonomyLevel;
  killSwitch: boolean;
  updatedAt: string;
}
const autonomyStore = persistedValue<AutonomyState>("wfdl:autonomy", {
  level: "Semiautomático",
  killSwitch: false,
  updatedAt: new Date().toISOString(),
});
export const useAutonomy = () =>
  useSyncExternalStore(autonomyStore.subscribe, autonomyStore.get, autonomyStore.get);
export function setAutonomyLevel(level: AutonomyLevel, userId = CURRENT_USER_ID) {
  const prev = autonomyStore.get();
  autonomyStore.set({ ...prev, level, updatedAt: new Date().toISOString() });
  appendAudit({
    action: "service.sdr_toggled",
    entityType: "autonomy",
    entityId: "global",
    metadata: { from: prev.level, to: level },
    userId,
  });
}
export function setGlobalKillSwitch(v: boolean, userId = CURRENT_USER_ID) {
  const prev = autonomyStore.get();
  autonomyStore.set({ ...prev, killSwitch: v, updatedAt: new Date().toISOString() });
  appendAudit({
    action: "service.sdr_toggled",
    entityType: "kill_switch_global",
    entityId: "global",
    metadata: { enabled: v },
    userId,
  });
}

// ============================================================
// Motor de elegibilidade (Fatia 4)
// ============================================================
export interface EligibilityInput {
  empresaId?: string;
  segmento?: string;
  porte?: string;
  emailValido?: boolean;
  telefoneValido?: boolean;
  optOut?: boolean;
  blacklist?: boolean;
  ultimoContatoDias?: number;
  cnaes?: string[];
  perfilCnaes?: string[];
  perfilSegmento?: string;
  perfilPorteMin?: number;
  perfilPorteMax?: number;
}
export interface EligibilityResult {
  elegivel: boolean;
  motivos: string[];
  avisos: string[];
}
export function checkEligibility(i: EligibilityInput): EligibilityResult {
  const motivos: string[] = [];
  const avisos: string[] = [];
  if (i.optOut) motivos.push("Contato em opt-out (LGPD)");
  if (i.blacklist) motivos.push("Empresa em blacklist");
  if (!i.emailValido && !i.telefoneValido) motivos.push("Sem canal válido (email/telefone)");
  if (typeof i.ultimoContatoDias === "number" && i.ultimoContatoDias < 30)
    avisos.push(`Contato recente há ${i.ultimoContatoDias}d — evitar reabordagem`);
  if (i.perfilSegmento && i.segmento && !i.segmento.toLowerCase().includes(i.perfilSegmento.toLowerCase())) {
    avisos.push(`Segmento "${i.segmento}" fora do perfil "${i.perfilSegmento}"`);
  }
  return { elegivel: motivos.length === 0, motivos, avisos };
}

// ============================================================
// SDR — estados de aquecimento (Fatia 4)
// ============================================================
export type SdrEstadoAquecimento =
  | "Apresentacao"
  | "AguardandoPermissao"
  | "Aquecimento"
  | "Qualificacao"
  | "Handoff"
  | "Encerrado";

export function proximoEstadoSdr(atual: SdrEstadoAquecimento, sinal: {
  respostaPositiva?: boolean;
  respostaNegativa?: boolean;
  perguntouPreco?: boolean;
  optOut?: boolean;
}): SdrEstadoAquecimento {
  if (sinal.optOut) return "Encerrado";
  if (sinal.perguntouPreco) return "Handoff";
  switch (atual) {
    case "Apresentacao":
      return sinal.respostaPositiva ? "Aquecimento" : "AguardandoPermissao";
    case "AguardandoPermissao":
      return sinal.respostaPositiva ? "Aquecimento" : sinal.respostaNegativa ? "Encerrado" : "AguardandoPermissao";
    case "Aquecimento":
      return sinal.respostaPositiva ? "Qualificacao" : "Aquecimento";
    case "Qualificacao":
      return "Handoff";
    default:
      return atual;
  }
}

// ============================================================
// Test helpers
// ============================================================
export const __canonical_test__ = {
  clearAll: () => {
    if (typeof window === "undefined") return;
    [
      "wfdl:empresas",
      "wfdl:produtos",
      "wfdl:ofertas",
      "wfdl:vendedores",
      "wfdl:oportunidades",
      "wfdl:orcamentos",
      "wfdl:metas",
      "wfdl:autonomy",
    ].forEach((k) => window.localStorage.removeItem(k));
  },
};
