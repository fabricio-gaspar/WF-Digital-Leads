import { describe, it, expect, beforeEach } from "vitest";
import {
  sendApprovedDraft,
  batchApproveDrafts,
  authorizeDraftSend,
  __test__,
} from "../DemoDataProvider";
import type { SdrDraft } from "../sdrVirtual";

const baseDraft: SdrDraft = {
  id: "df-test-1",
  conversaId: "cv-x",
  empresa: "Empresa Teste",
  contato: "Contato Teste",
  leadMessage: "olá",
  draftReply: "Resposta demonstrativa dentro do padrão.",
  source: "service",
  confidence: 82,
  requiresHuman: false,
  guardrails: [{ rule: "TomVozOk", detail: "ok", severity: "info" }],
  status: "pendente",
  criadoEm: new Date().toISOString(),
};

describe("authorizeDraftSend", () => {
  it("libera rascunho pendente sem guardrails de bloqueio", () => {
    expect(authorizeDraftSend(baseDraft).allowed).toBe(true);
  });

  it("bloqueia rascunho com guardrail block", () => {
    const res = authorizeDraftSend({
      ...baseDraft,
      guardrails: [{ rule: "PrecoProibido", detail: "x", severity: "block" }],
    });
    expect(res.allowed).toBe(false);
    expect(res.reason).toMatch(/Guardrail/);
  });

  it("bloqueia rascunho já processado", () => {
    const res = authorizeDraftSend({ ...baseDraft, status: "aprovado" });
    expect(res.allowed).toBe(false);
  });
});

describe("sendApprovedDraft", () => {
  beforeEach(() => {
    __test__.resetSentMessages();
    __test__.resetAuditLog();
  });

  it("persiste mensagem enviada + entrada de auditoria", async () => {
    const res = await sendApprovedDraft({ draft: baseDraft });
    expect(res.ok).toBe(true);
    expect(res.message?.body).toContain("demonstrativa");
    expect(res.message?.channel).toBe("whatsapp-sandbox");
    expect(__test__.getSentMessages()).toHaveLength(1);
    expect(__test__.getAuditLog()[0].action).toBe("message.sent");
  });

  it("usa corpo editado quando fornecido", async () => {
    const res = await sendApprovedDraft({
      draft: baseDraft,
      editedBody: "Texto revisado pelo humano.",
    });
    expect(res.ok).toBe(true);
    expect(res.message?.body).toBe("Texto revisado pelo humano.");
    expect(__test__.getAuditLog()[0].action).toBe("draft.approved");
  });

  it("registra auditoria de bloqueio quando guardrail impede", async () => {
    const res = await sendApprovedDraft({
      draft: {
        ...baseDraft,
        guardrails: [{ rule: "PrecoProibido", detail: "x", severity: "block" }],
      },
    });
    expect(res.ok).toBe(false);
    expect(__test__.getSentMessages()).toHaveLength(0);
    expect(__test__.getAuditLog()[0].action).toBe("message.blocked");
  });
});

describe("batchApproveDrafts", () => {
  beforeEach(() => {
    __test__.resetSentMessages();
    __test__.resetAuditLog();
  });

  it("aprova elegíveis e conta bloqueados", async () => {
    const drafts: SdrDraft[] = [
      { ...baseDraft, id: "df-a" },
      {
        ...baseDraft,
        id: "df-b",
        guardrails: [{ rule: "PrecoProibido", detail: "x", severity: "block" }],
      },
      { ...baseDraft, id: "df-c" },
    ];
    const res = await batchApproveDrafts(drafts);
    expect(res.approved).toBe(2);
    expect(res.blocked).toBe(1);
    expect(__test__.getSentMessages()).toHaveLength(2);
  });
});
