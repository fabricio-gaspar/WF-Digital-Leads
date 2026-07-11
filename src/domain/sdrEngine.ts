// SDR Engine — motor de decisão determinístico do SDR Virtual (demo, sem IA real)
// Recebe mensagens do lead e produz: resposta sugerida, guardrails aplicados,
// score de confiança/intent/fit e recomendação de handoff automático.

import {
  companyProfile,
  knowledgeBase,
  sdrPolicies,
  services,
  type KnowledgeEntry,
  type Service,
} from "./sdrVirtual";

export type SdrState =
  | "GREETING"
  | "DISCOVERY"
  | "QUALIFYING"
  | "HANDOFF_PENDING"
  | "HUMAN_CONTROL"
  | "NURTURE"
  | "CLOSED";

export interface GuardrailHit {
  rule: string;
  detail: string;
  severity: "info" | "warn" | "block";
}

export interface SdrReply {
  text: string;
  source: "knowledge" | "service" | "policy" | "fallback" | "handoff" | "optout";
  knowledgeId?: string;
  serviceId?: string;
  requiresHuman: boolean;
  confidence: number;
  guardrails: GuardrailHit[];
  suggestedHandoff?: {
    motivo: string;
    urgencia: "Alta" | "Média" | "Baixa";
    fit: number;
    intent: number;
    heat: number;
    resumo: string;
  };
  nextState: SdrState;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function matchKnowledge(msg: string): KnowledgeEntry | undefined {
  const n = norm(msg);
  return knowledgeBase.find(
    (k) => k.status === "Ativo" && k.autorizada && k.gatilhos.some((g) => n.includes(norm(g))),
  );
}

function matchService(msg: string): Service | undefined {
  const n = norm(msg);
  return services.find(
    (sv) => sv.status === "Ativo" && sv.palavrasChave.some((p) => n.includes(norm(p))),
  );
}

function hasAny(msg: string, terms: string[]): boolean {
  const n = norm(msg);
  return terms.some((t) => n.includes(norm(t)));
}

function detectProhibited(msg: string): string[] {
  const hits: string[] = [];
  const n = norm(msg);
  for (const term of companyProfile.assuntosProibidos) {
    if (n.includes(norm(term))) hits.push(term);
  }
  return hits;
}

export interface EngineContext {
  turn: number;
  state: SdrState;
  leadName?: string;
  companyName?: string;
}

export function runSdrTurn(userMessage: string, ctx: EngineContext): SdrReply {
  const guardrails: GuardrailHit[] = [];
  const msg = userMessage.trim();

  // 1) Opt-out — encerra
  if (sdrPolicies.encerrarEmOptOut && hasAny(msg, sdrPolicies.termosOptOut)) {
    guardrails.push({ rule: "encerrarEmOptOut", detail: "Termo de opt-out detectado", severity: "block" });
    return {
      text: `Sem problemas${ctx.leadName ? `, ${ctx.leadName}` : ""}. Não enviaremos mais mensagens. Se precisar no futuro, é só chamar.`,
      source: "optout",
      requiresHuman: false,
      confidence: 1,
      guardrails,
      nextState: "CLOSED",
    };
  }

  // 2) Assunto proibido — recusa educada
  const prohibited = detectProhibited(msg);
  if (prohibited.length > 0) {
    guardrails.push({ rule: "assuntosProibidos", detail: `Assunto fora do escopo: ${prohibited.join(", ")}`, severity: "block" });
    return {
      text: "Esse assunto não é minha especialidade. Posso te ajudar com temas de tecnologia (sistemas, sites, IA, infraestrutura). Quer conversar sobre um deles?",
      source: "policy",
      requiresHuman: false,
      confidence: 0.9,
      guardrails,
      nextState: ctx.state,
    };
  }

  // 3) Gatilhos de handoff explícitos (preço, reunião, vendedor…)
  const handoffTerm = sdrPolicies.termosHandoff.find((t) => norm(msg).includes(norm(t)));
  if (handoffTerm) {
    guardrails.push({ rule: "termosHandoff", detail: `Gatilho "${handoffTerm}" — encaminhar ao vendedor`, severity: "info" });
    const service = matchService(msg);
    return {
      text: `Perfeito! Vou te conectar com um especialista${service ? ` de ${service.nome}` : ""}. Nosso responsável entra em contato dentro do SLA de ${companyProfile.slaVendedor}. Pode confirmar seu melhor horário?`,
      source: "handoff",
      serviceId: service?.id,
      requiresHuman: true,
      confidence: 0.92,
      guardrails,
      suggestedHandoff: {
        motivo: `Solicitou ${handoffTerm}`,
        urgencia: handoffTerm === "reunião" || handoffTerm === "demonstração" ? "Alta" : "Média",
        fit: 78,
        intent: 88,
        heat: 82,
        resumo: `Lead solicitou "${handoffTerm}"${service ? ` sobre ${service.nome}` : ""} no turno ${ctx.turn}.`,
      },
      nextState: "HANDOFF_PENDING",
    };
  }

  // 4) Base de conhecimento
  const kb = matchKnowledge(msg);
  if (kb) {
    if (!kb.podeEnviarAuto || kb.exigeVendedor) {
      guardrails.push({ rule: "kbExigeVendedor", detail: `Resposta "${kb.pergunta}" exige vendedor`, severity: "warn" });
      return {
        text: `${kb.resposta}\n\nVou te conectar com um especialista para detalhar.`,
        source: "knowledge",
        knowledgeId: kb.id,
        requiresHuman: true,
        confidence: 0.85,
        guardrails,
        suggestedHandoff: {
          motivo: `Pergunta sensível: ${kb.pergunta}`,
          urgencia: kb.categoria === "Preço" ? "Alta" : "Média",
          fit: 72,
          intent: 80,
          heat: 74,
          resumo: `Lead perguntou "${kb.pergunta}". Base marca como exige vendedor.`,
        },
        nextState: "HANDOFF_PENDING",
      };
    }
    return {
      text: kb.resposta,
      source: "knowledge",
      knowledgeId: kb.id,
      requiresHuman: false,
      confidence: 0.88,
      guardrails,
      nextState: "QUALIFYING",
    };
  }

  // 5) Match por serviço — apresenta com mensagem inicial
  const service = matchService(msg);
  if (service) {
    const template = service.mensagemInicial
      .replaceAll("{{nome}}", ctx.leadName ?? "tudo bem")
      .replaceAll("{{empresa}}", ctx.companyName ?? "sua empresa")
      .replaceAll("{{segmento}}", companyProfile.segmento)
      .replaceAll("{{cidade}}", companyProfile.cidadeUf);
    return {
      text: template,
      source: "service",
      serviceId: service.id,
      requiresHuman: false,
      confidence: 0.82,
      guardrails,
      nextState: "DISCOVERY",
    };
  }

  // 6) Fallback — confiança baixa: encaminha se política pede
  const lowConfidence = 0.45;
  if (sdrPolicies.encaminharBaixaConfianca && lowConfidence < sdrPolicies.confiancaMinima) {
    guardrails.push({
      rule: "encaminharBaixaConfianca",
      detail: `Confiança ${lowConfidence.toFixed(2)} < mínima ${sdrPolicies.confiancaMinima}`,
      severity: "warn",
    });
    return {
      text: "Entendi. Prefiro te conectar com um especialista humano para dar a resposta certa. Pode confirmar seu melhor horário hoje?",
      source: "fallback",
      requiresHuman: true,
      confidence: lowConfidence,
      guardrails,
      suggestedHandoff: {
        motivo: "Confiança baixa — sem match na base",
        urgencia: "Média",
        fit: 60,
        intent: 55,
        heat: 58,
        resumo: `Turno ${ctx.turn}: SDR sem confiança suficiente para responder.`,
      },
      nextState: "HANDOFF_PENDING",
    };
  }

  return {
    text: "Pode me contar um pouco mais sobre o contexto da empresa? Assim consigo te ajudar melhor.",
    source: "fallback",
    requiresHuman: false,
    confidence: 0.5,
    guardrails,
    nextState: "DISCOVERY",
  };
}

// ============ Métricas do SDR (para relatórios) ============
export interface SdrMetrics {
  totalHandoffs: number;
  aguardando: number;
  aceitos: number;
  devolvidos: number;
  recusados: number;
  concluidos: number;
  taxaAceite: number; // %
  taxaConclusao: number; // %
  heatMedio: number;
  motivosTop: Array<{ motivo: string; qtd: number }>;
  porServico: Array<{ servico: string; qtd: number }>;
  porUrgencia: Array<{ urgencia: string; qtd: number }>;
}

export function computeSdrMetrics(handoffs: import("./sdrVirtual").Handoff[]): SdrMetrics {
  const total = handoffs.length || 1;
  const aceitos = handoffs.filter((h) => h.status === "Aceito").length;
  const concluidos = handoffs.filter((h) => h.status === "Concluído").length;
  const aguardando = handoffs.filter((h) => h.status === "Aguardando vendedor").length;
  const devolvidos = handoffs.filter((h) => h.status === "Devolvido").length;
  const recusados = handoffs.filter((h) => h.status === "Recusado").length;

  const motivos = new Map<string, number>();
  const porServ = new Map<string, number>();
  const porUrg = new Map<string, number>();
  let heatSum = 0;
  for (const h of handoffs) {
    motivos.set(h.motivo, (motivos.get(h.motivo) ?? 0) + 1);
    porServ.set(h.servicoId, (porServ.get(h.servicoId) ?? 0) + 1);
    porUrg.set(h.urgencia, (porUrg.get(h.urgencia) ?? 0) + 1);
    heatSum += h.heat;
  }
  const svcName = (id: string) => services.find((s) => s.id === id)?.nome ?? id;

  return {
    totalHandoffs: handoffs.length,
    aguardando,
    aceitos,
    devolvidos,
    recusados,
    concluidos,
    taxaAceite: Math.round(((aceitos + concluidos) / total) * 100),
    taxaConclusao: Math.round((concluidos / total) * 100),
    heatMedio: handoffs.length ? Math.round(heatSum / handoffs.length) : 0,
    motivosTop: [...motivos.entries()]
      .map(([motivo, qtd]) => ({ motivo, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5),
    porServico: [...porServ.entries()].map(([id, qtd]) => ({ servico: svcName(id), qtd })),
    porUrgencia: [...porUrg.entries()].map(([urgencia, qtd]) => ({ urgencia, qtd })),
  };
}
