// Tipos de domínio compartilhados — WF Digital CRM
// Nesta etapa, alimentados por DemoDataProvider. Futuramente, mesmos tipos serão
// hidratados a partir do banco/Supabase sem alterar telas.

export type UUID = string;

export type UserRole = "admin" | "gestor" | "vendedor" | "atendente" | "leitor";

export type Availability =
  | "disponivel"
  | "em_atendimento"
  | "pausa"
  | "ausente"
  | "offline";

export interface User {
  id: UUID;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  avatarInitials: string;
  teamId?: UUID;
  leadCount?: number;
  availability?: Availability;
}

export interface Team {
  id: UUID;
  name: string;
  managerId?: UUID;
  memberIds: UUID[];
}

export interface Queue {
  id: UUID;
  name: string;
  memberIds: UUID[];
  distribution: "manual" | "round_robin" | "capacidade" | "habilidade";
}

export type LeadStageId =
  | "prospeccao"
  | "qualificado"
  | "proposta"
  | "negociacao"
  | "fechado"
  | "perdido";

export interface LeadStage {
  id: LeadStageId;
  label: string;
  order: number;
  probability: number; // 0..1
  colorVar: string; // css var --stage-*
}

export type Temperature = "frio" | "morno" | "quente";

export interface Company {
  id: UUID;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  segmento?: string;
  cnae?: string;
  porte?: string;
  site?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  origem?: string;
  createdAt: string;
}

export interface Contact {
  id: UUID;
  companyId: UUID;
  nome: string;
  cargo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  melhorHorario?: string;
  optIn?: boolean;
  optInAt?: string;
  tags?: string[];
  observacoes?: string;
}

export type LeadSource =
  | "busca_ativa"
  | "linkedin"
  | "google_maps"
  | "indicacao"
  | "site"
  | "whatsapp"
  | "importacao"
  | "outro";

export interface Lead {
  id: UUID;
  companyId: UUID;
  contactId?: UUID;
  ownerId: UUID;
  teamId?: UUID;
  stage: LeadStageId;
  temperature: Temperature;
  score: number; // 0..100
  scoreFactors?: string[];
  estimatedValue: number;
  closedValue?: number;
  closedAt?: string;
  lossReason?: string;
  source: LeadSource;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastContactAt?: string;
  nextTaskAt?: string;
}

export type ActivityType =
  | "lead_criado"
  | "nota"
  | "tarefa"
  | "etapa_alterada"
  | "atribuicao"
  | "ligacao"
  | "email"
  | "mensagem_enviada"
  | "mensagem_recebida"
  | "fechamento"
  | "integracao";

export interface Activity {
  id: UUID;
  leadId?: UUID;
  conversationId?: UUID;
  authorId: UUID;
  type: ActivityType;
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export type TaskStatus = "aberta" | "concluida" | "cancelada";
export type TaskPriority = "baixa" | "media" | "alta";

export interface Task {
  id: UUID;
  title: string;
  description?: string;
  type: "ligacao" | "email" | "whatsapp" | "reuniao" | "outro";
  ownerId: UUID;
  leadId?: UUID;
  conversationId?: UUID;
  dueAt: string;
  status: TaskStatus;
  priority: TaskPriority;
  completedAt?: string;
}

export type ConversationStatus =
  | "aberta"
  | "aguardando_cliente"
  | "aguardando_time"
  | "resolvida"
  | "bloqueada";

export type Channel = "whatsapp" | "email" | "telefone";

export interface ConversationAssignment {
  id: UUID;
  userId: UUID;
  at: string;
  by?: UUID;
  reason?: string;
  releasedAt?: string;
}

export interface Conversation {
  id: UUID;
  contactId: UUID;
  companyId?: UUID;
  primaryLeadId?: UUID;
  linkedLeadIds?: UUID[];
  channel: Channel;
  channelAccountId?: UUID;
  queueId?: UUID;
  currentOwnerId?: UUID;
  status: ConversationStatus;
  priority: TaskPriority;
  slaDueAt?: string;
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
  assignments: ConversationAssignment[];
  tags?: string[];
}

export type MessageDirection = "in" | "out" | "system";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: UUID;
  conversationId: UUID;
  externalId?: string;
  direction: MessageDirection;
  authorId?: UUID; // funcionário que enviou (out) ou undefined (in)
  contactId?: UUID;
  content: string;
  attachments?: { name: string; url?: string; mime?: string }[];
  templateId?: UUID;
  status?: MessageStatus;
  failureReason?: string;
  internal?: boolean; // nota interna
  createdAt: string;
}

export interface ProspectingResult {
  id: UUID;
  searchId: UUID;
  empresa: string;
  cnpj?: string;
  segmento?: string;
  cnae?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  source: "vibe" | "apify" | "csv" | "demo" | "gmaps";
  collectedAt: string;
  confidence: number; // 0..1
  status: "novo" | "convertido" | "ignorado" | "duplicado" | "invalido" | "revisao";
}

export interface ProspectingSearch {
  id: UUID;
  createdBy: UUID;
  createdAt: string;
  provider: "vibe" | "apify" | "csv" | "demo";
  params: Record<string, unknown>;
  resultCount: number;
}

export interface Service {
  id: UUID;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco?: number;
  unidade?: string;
  active: boolean;
}

export interface Notification {
  id: UUID;
  userId: UUID;
  type: "atribuicao" | "transferencia" | "tarefa" | "sla" | "mencao" | "sistema";
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: UUID;
  actorId: UUID;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface MessageTemplate {
  id: UUID;
  name: string;
  category: "saudacao" | "followup" | "proposta" | "resolucao" | "outro";
  content: string;
  variables?: string[];
  status: "aprovado" | "pendente" | "rejeitado";
  usageCount: number;
}

export interface ChannelAccount {
  id: UUID;
  provider: "zapi";
  alias: string;
  phone?: string;
  instanceId?: string; // apenas metadado; token NUNCA no cliente
  status: "conectado" | "desconectado" | "aguardando_backend";
  lastEventAt?: string;
}
