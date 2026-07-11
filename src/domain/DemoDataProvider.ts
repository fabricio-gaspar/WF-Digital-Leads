// ============================================================
// DemoDataProvider — Prompt 5.0 / Fase 1
// Camada unificada de estado da demo (multi-tenant scaffolding).
// Consolida acesso a stores existentes (compat) + introduz:
//   - organizationId / currentUserId
//   - MessagingProvider (SandboxMessagingProvider por padrão)
//   - sentMessagesStore (persistido em localStorage)
//   - auditLogStore (persistido em localStorage)
//   - sendApprovedDraft() — gate de autorização + envio + audit
// Nenhum dado é enviado para um WhatsApp real. Tudo permanece
// no navegador (localStorage) até que um provider real seja plugado.
// ============================================================

import { useSyncExternalStore } from "react";
import {
  useSdrDrafts as _useSdrDrafts,
  updateSdrDraft as _updateSdrDraft,
  isServiceSdrActive,
  type SdrDraft,
} from "./sdrVirtual";

// ---------- Multi-tenant scaffolding ----------
export const ORGANIZATION_ID = "org-wf-digital";
export const CURRENT_USER_ID = "u-demo-admin";

export interface TenantContext {
  organizationId: string;
  userId: string;
}

export function useTenantContext(): TenantContext {
  return { organizationId: ORGANIZATION_ID, userId: CURRENT_USER_ID };
}

// ---------- Persisted store helper (localStorage) ----------
function createPersistedStore<T>(key: string, initial: T[]) {
  let data: T[] = initial;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) data = JSON.parse(raw) as T[];
    } catch {
      /* corrupt payload — ignore */
    }
  }
  const listeners = new Set<() => void>();
  const persist = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
      } catch {
        /* quota / disabled — ignore */
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
    reset: () => {
      data = initial;
      persist();
      listeners.forEach((l) => l());
    },
  };
}

// ---------- Sent messages (persisted) ----------
export interface SentMessage {
  id: string;
  organizationId: string;
  conversaId: string;
  draftId: string;
  empresa: string;
  contato: string;
  body: string;
  channel: "whatsapp-sandbox" | "whatsapp-real" | "email-sandbox";
  status: "sent" | "failed";
  sentBy: string;
  sentAt: string; // ISO
  provider: string;
}

const sentMessagesStore = createPersistedStore<SentMessage>(
  "wfdl:sent-messages",
  [],
);

export const useSentMessages = () =>
  useSyncExternalStore(
    sentMessagesStore.subscribe,
    sentMessagesStore.get,
    () => sentMessagesStore.get(),
  );

// ---------- Audit log (persisted) ----------
export type AuditAction =
  | "draft.approved"
  | "draft.discarded"
  | "draft.batch_approved"
  | "message.sent"
  | "message.blocked"
  | "service.sdr_toggled"
  | "handoff.updated";

export interface AuditEntry {
  id: string;
  organizationId: string;
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, string | number | boolean | null | undefined>;
  createdAt: string; // ISO
}

const auditLogStore = createPersistedStore<AuditEntry>("wfdl:audit-log", []);

export const useAuditLog = () =>
  useSyncExternalStore(
    auditLogStore.subscribe,
    auditLogStore.get,
    () => auditLogStore.get(),
  );

export function appendAudit(
  entry: Omit<AuditEntry, "id" | "organizationId" | "userId" | "createdAt"> & {
    userId?: string;
    organizationId?: string;
  },
): AuditEntry {
  const full: AuditEntry = {
    id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: entry.organizationId ?? ORGANIZATION_ID,
    userId: entry.userId ?? CURRENT_USER_ID,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
    createdAt: new Date().toISOString(),
  };
  auditLogStore.set((d) => [full, ...d].slice(0, 500));
  return full;
}

// ---------- MessagingProvider abstraction ----------
export interface OutgoingMessage {
  conversaId: string;
  empresa: string;
  contato: string;
  body: string;
}

export interface MessagingProviderResult {
  ok: boolean;
  provider: string;
  channel: SentMessage["channel"];
  error?: string;
}

export interface MessagingProvider {
  readonly name: string;
  readonly channel: SentMessage["channel"];
  send(msg: OutgoingMessage): Promise<MessagingProviderResult>;
}

export class SandboxMessagingProvider implements MessagingProvider {
  readonly name = "sandbox";
  readonly channel: SentMessage["channel"] = "whatsapp-sandbox";
  async send(_msg: OutgoingMessage): Promise<MessagingProviderResult> {
    // Simula latência mínima; em produção seria uma chamada ao Z-API/WhatsApp.
    return { ok: true, provider: this.name, channel: this.channel };
  }
}

let activeProvider: MessagingProvider = new SandboxMessagingProvider();
export function getMessagingProvider(): MessagingProvider {
  return activeProvider;
}
export function setMessagingProvider(p: MessagingProvider): void {
  activeProvider = p;
}

// ---------- Authorization gate ----------
export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

export function authorizeDraftSend(
  draft: Pick<SdrDraft, "guardrails" | "status">,
  servicoId?: string,
): AuthorizationResult {
  if (draft.status !== "pendente" && draft.status !== "editado") {
    return { allowed: false, reason: "Rascunho já foi processado." };
  }
  const blocking = draft.guardrails?.find((g) => g.severity === "block");
  if (blocking) {
    return { allowed: false, reason: `Guardrail bloqueou: ${blocking.rule}` };
  }
  if (servicoId && !isServiceSdrActive(servicoId)) {
    return { allowed: false, reason: "SDR desativado para este serviço." };
  }
  return { allowed: true };
}

// ---------- sendApprovedDraft — orquestração completa ----------
export interface SendApprovedDraftInput {
  draft: SdrDraft;
  editedBody?: string;
  servicoId?: string;
  userId?: string;
}

export interface SendApprovedDraftResult {
  ok: boolean;
  message?: SentMessage;
  audit?: AuditEntry;
  reason?: string;
}

export async function sendApprovedDraft(
  input: SendApprovedDraftInput,
): Promise<SendApprovedDraftResult> {
  const { draft, editedBody, servicoId, userId = CURRENT_USER_ID } = input;

  const auth = authorizeDraftSend(draft, servicoId);
  if (!auth.allowed) {
    const audit = appendAudit({
      action: "message.blocked",
      entityType: "sdr_draft",
      entityId: draft.id,
      metadata: { reason: auth.reason },
      userId,
    });
    return { ok: false, reason: auth.reason, audit };
  }

  const body = (editedBody ?? draft.draftReply).trim();
  if (!body) {
    return { ok: false, reason: "Mensagem vazia." };
  }

  const provider = getMessagingProvider();
  const result = await provider.send({
    conversaId: draft.conversaId,
    empresa: draft.empresa,
    contato: draft.contato,
    body,
  });

  const message: SentMessage = {
    id: `sm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: ORGANIZATION_ID,
    conversaId: draft.conversaId,
    draftId: draft.id,
    empresa: draft.empresa,
    contato: draft.contato,
    body,
    channel: result.channel,
    status: result.ok ? "sent" : "failed",
    sentBy: userId,
    sentAt: new Date().toISOString(),
    provider: result.provider,
  };
  sentMessagesStore.set((d) => [message, ...d].slice(0, 500));

  // Reflete no store legado (compat wrapper)
  _updateSdrDraft(draft.id, {
    status: editedBody ? "editado" : "aprovado",
    ...(editedBody && { draftReply: editedBody }),
  });

  const audit = appendAudit({
    action: editedBody ? "draft.approved" : "message.sent",
    entityType: "sdr_draft",
    entityId: draft.id,
    metadata: {
      conversaId: draft.conversaId,
      empresa: draft.empresa,
      edited: !!editedBody,
      provider: result.provider,
    },
    userId,
  });

  return { ok: result.ok, message, audit };
}

// ---------- Batch approval (usa sendApprovedDraft) ----------
export async function batchApproveDrafts(
  drafts: SdrDraft[],
  userId: string = CURRENT_USER_ID,
): Promise<{ approved: number; blocked: number; reasons: string[] }> {
  let approved = 0;
  let blocked = 0;
  const reasons: string[] = [];
  for (const draft of drafts) {
    const res = await sendApprovedDraft({ draft, userId });
    if (res.ok) approved++;
    else {
      blocked++;
      if (res.reason) reasons.push(`${draft.empresa}: ${res.reason}`);
    }
  }
  appendAudit({
    action: "draft.batch_approved",
    entityType: "sdr_batch",
    entityId: `batch-${Date.now()}`,
    metadata: { total: drafts.length, approved, blocked },
    userId,
  });
  return { approved, blocked, reasons };
}

// ---------- Compat re-exports ----------
export { _useSdrDrafts as useSdrDrafts };
export const useDraftsFromProvider = _useSdrDrafts;

// Test-only utilities
export const __test__ = {
  resetSentMessages: () => sentMessagesStore.reset(),
  resetAuditLog: () => auditLogStore.reset(),
  getSentMessages: () => sentMessagesStore.get(),
  getAuditLog: () => auditLogStore.get(),
};
