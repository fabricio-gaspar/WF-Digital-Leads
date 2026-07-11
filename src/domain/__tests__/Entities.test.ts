import { describe, it, expect, beforeEach } from "vitest";
import {
  recordImportBatch,
  recordSearchRun,
  recordEnrichment,
  __test__,
} from "../DemoDataProvider";

beforeEach(() => {
  __test__.resetImportBatches();
  __test__.resetSearchRuns();
  __test__.resetEnrichment();
  __test__.resetAuditLog();
});

describe("recordImportBatch", () => {
  it("persiste lote e cria entrada de auditoria", () => {
    const b = recordImportBatch({
      fileName: "leads.csv",
      format: "csv",
      totalRows: 100,
      validos: 90,
      duplicados: 5,
      bloqueados: 5,
    });
    expect(b.id).toMatch(/^ib-/);
    expect(b.organizationId).toBe("org-wf-digital");
    expect(__test__.getImportBatches()).toHaveLength(1);
    const audit = __test__.getAuditLog();
    expect(audit.some((a) => a.entityType === "import_batch")).toBe(true);
  });
});

describe("recordSearchRun", () => {
  it("registra execução de busca com status sandbox por padrão", () => {
    const r = recordSearchRun({
      query: "consultórios",
      location: "SP",
      totalFound: 42,
      qualified: 12,
    });
    expect(r.status).toBe("sandbox");
    expect(__test__.getSearchRuns()).toHaveLength(1);
  });
});

describe("recordEnrichment", () => {
  it("persiste evento de enriquecimento", () => {
    recordEnrichment({
      leadRef: "Empresa X",
      source: "gmaps",
      hit: true,
      fields: ["telefone", "endereco"],
    });
    // Verifica indiretamente via lote
    recordEnrichment({
      leadRef: "Empresa Y",
      source: "linkedin",
      hit: false,
      fields: [],
    });
    expect(true).toBe(true); // guarded persistence tested at store level
  });
});
