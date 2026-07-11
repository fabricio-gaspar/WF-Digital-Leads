// Etapas do funil — fonte única
import type { LeadStage, LeadStageId } from "./types";

export const LEAD_STAGES: LeadStage[] = [
  { id: "prospeccao", label: "Prospecção", order: 0, probability: 0.1, colorVar: "--stage-prospeccao" },
  { id: "qualificado", label: "Qualificado", order: 1, probability: 0.3, colorVar: "--stage-qualificado" },
  { id: "proposta", label: "Proposta", order: 2, probability: 0.5, colorVar: "--stage-proposta" },
  { id: "negociacao", label: "Negociação", order: 3, probability: 0.75, colorVar: "--stage-negociacao" },
  { id: "fechado", label: "Fechado", order: 4, probability: 1, colorVar: "--stage-fechado" },
  { id: "perdido", label: "Perdido", order: 5, probability: 0, colorVar: "--stage-perdido" },
];

export const STAGE_MAP: Record<LeadStageId, LeadStage> = Object.fromEntries(
  LEAD_STAGES.map((s) => [s.id, s]),
) as Record<LeadStageId, LeadStage>;

export const SOURCE_LABELS: Record<string, string> = {
  busca_ativa: "Busca Ativa",
  linkedin: "LinkedIn",
  google_maps: "Google Maps",
  indicacao: "Indicação",
  site: "Site",
  whatsapp: "WhatsApp",
  importacao: "Importação",
  outro: "Outro",
};

// Matriz de permissões — aplicada no AuthProvider.hasPermission e nos guards.
export const PERMISSIONS = {
  admin: new Set([
    "manage:users",
    "manage:integrations",
    "manage:pipeline",
    "manage:teams",
    "manage:templates",
    "view:audit",
    "view:reports:full",
    "view:conversations:all",
    "send:message",
    "assign:any",
    "export:data",
    "crud:lead:any",
    "view:portal",
  ]),
  gestor: new Set([
    "view:reports:team",
    "view:conversations:team",
    "send:message",
    "assign:team",
    "crud:lead:team",
    "view:audit:limited",
    "view:portal",
  ]),
  vendedor: new Set([
    "view:reports:own",
    "view:conversations:assigned",
    "send:message",
    "crud:lead:own",
    "view:portal",
  ]),
  atendente: new Set([
    "view:conversations:assigned",
    "send:message",
    "crud:lead:limited",
    "view:portal",
  ]),
  leitor: new Set(["view:reports:limited"]),
} as const;
