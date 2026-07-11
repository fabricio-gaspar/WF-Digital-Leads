// Importador de listas de leads (CSV/XLSX) — 100% no navegador.
// Bibliotecas: papaparse (CSV) + xlsx SheetJS Community (XLSX). Sem backend.
// Fluxo: upload -> parse -> mapeamento de colunas -> preview + dedupe -> criar lista.
import { useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { addLeadList, useServicesList } from "@/domain/sdrVirtual";
import { toast } from "sonner";

type RawRow = Record<string, string>;

const TARGET_FIELDS = [
  { key: "empresa", label: "Empresa", required: true },
  { key: "contato", label: "Contato", required: false },
  { key: "telefone", label: "Telefone / WhatsApp", required: false },
  { key: "email", label: "E-mail", required: false },
  { key: "cidade", label: "Cidade", required: false },
  { key: "uf", label: "UF", required: false },
] as const;

type TargetKey = (typeof TARGET_FIELDS)[number]["key"];

function autoMap(header: string): TargetKey | "" {
  const h = header.toLowerCase().trim();
  if (/empresa|razao|company|nome.*empresa/.test(h)) return "empresa";
  if (/contato|responsavel|nome/.test(h)) return "contato";
  if (/tel|whats|celular|phone/.test(h)) return "telefone";
  if (/mail/.test(h)) return "email";
  if (/cidade|city/.test(h)) return "cidade";
  if (/uf|estado|state/.test(h)) return "uf";
  return "";
}

function normalizePhone(v: string) {
  return v.replace(/\D/g, "");
}

export function LeadListImporter({ onClose }: { onClose: () => void }) {
  const services = useServicesList();
  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, TargetKey | "">>({});
  const [nome, setNome] = useState("");
  const [servicoId, setServicoId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setBusy(true);
    try {
      let parsed: RawRow[] = [];
      if (/\.csv$/i.test(file.name)) {
        const text = await file.text();
        const res = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
        parsed = (res.data || []).filter(Boolean);
      } else if (/\.xlsx?$/i.test(file.name)) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        parsed = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
      } else {
        toast.error("Formato não suportado. Use .csv ou .xlsx");
        setBusy(false);
        return;
      }
      const hdrs = parsed.length ? Object.keys(parsed[0]) : [];
      setHeaders(hdrs);
      setRows(parsed);
      const map: Record<string, TargetKey | ""> = {};
      hdrs.forEach((h) => (map[h] = autoMap(h)));
      setMapping(map);
      if (!nome) setNome(file.name.replace(/\.(csv|xlsx?)$/i, ""));
    } catch (e) {
      toast.error("Falha ao ler arquivo: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Mapeia + dedupe (por telefone normalizado, senão empresa+contato)
  const analysis = useMemo(() => {
    const seen = new Set<string>();
    let validos = 0;
    let duplicados = 0;
    let bloqueados = 0;
    const preview: Array<{ ok: boolean; reason?: string; empresa: string; contato: string; telefone: string }> = [];
    const empresaCol = Object.keys(mapping).find((k) => mapping[k] === "empresa");
    for (const r of rows) {
      const empresa = empresaCol ? String(r[empresaCol] ?? "").trim() : "";
      const contatoCol = Object.keys(mapping).find((k) => mapping[k] === "contato");
      const telCol = Object.keys(mapping).find((k) => mapping[k] === "telefone");
      const contato = contatoCol ? String(r[contatoCol] ?? "").trim() : "";
      const telefone = telCol ? normalizePhone(String(r[telCol] ?? "")) : "";
      if (!empresa) {
        bloqueados++;
        preview.push({ ok: false, reason: "Empresa vazia", empresa, contato, telefone });
        continue;
      }
      const key = telefone || `${empresa.toLowerCase()}|${contato.toLowerCase()}`;
      if (seen.has(key)) {
        duplicados++;
        preview.push({ ok: false, reason: "Duplicado", empresa, contato, telefone });
        continue;
      }
      seen.add(key);
      validos++;
      preview.push({ ok: true, empresa, contato, telefone });
    }
    return { validos, duplicados, bloqueados, preview };
  }, [rows, mapping]);

  const canImport = rows.length > 0 && nome.trim() && servicoId && analysis.validos > 0;

  const doImport = () => {
    if (!canImport) return;
    addLeadList({
      nome: nome.trim(),
      descricao: `Importação ${fileName}`,
      servicoId,
      origem: `Importação manual (${/\.csv$/i.test(fileName) ? "CSV" : "XLSX"})`,
      responsavelId: "u-gestor",
      quantidade: rows.length,
      validos: analysis.validos,
      duplicados: analysis.duplicados,
      bloqueados: analysis.bloqueados,
      status: "Ativa",
    });
    toast.success(`Lista "${nome}" criada com ${analysis.validos} leads válidos`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-xl bg-card border border-border shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Importar lista de leads</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">SANDBOX DEMO — sem envio ao WhatsApp</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {rows.length === 0 ? (
            <label className="block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <div className="font-medium text-foreground">Selecione um arquivo CSV ou XLSX</div>
              <div className="text-xs text-muted-foreground mt-1">Colunas esperadas (mapeáveis): empresa, contato, telefone, e-mail, cidade, UF</div>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {busy && <div className="text-xs text-muted-foreground mt-2">Lendo…</div>}
            </label>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Nome da lista">
                  <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </Field>
                <Field label="Serviço vinculado">
                  <select value={servicoId} onChange={(e) => setServicoId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    <option value="">Selecione…</option>
                    {services.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </Field>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Mapeamento de colunas</h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                      <tr><th className="text-left px-3 py-2">Coluna do arquivo</th><th className="text-left px-3 py-2">Campo do CRM</th></tr>
                    </thead>
                    <tbody>
                      {headers.map((h) => (
                        <tr key={h} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs text-foreground">{h}</td>
                          <td className="px-3 py-2">
                            <select value={mapping[h] ?? ""} onChange={(e) => setMapping({ ...mapping, [h]: e.target.value as TargetKey | "" })} className="px-2 py-1 rounded border border-border bg-background text-xs">
                              <option value="">— ignorar —</option>
                              {TARGET_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <Stat label="Total" value={rows.length} />
                <Stat label="Válidos" value={analysis.validos} tone="emerald" />
                <Stat label="Duplicados" value={analysis.duplicados} tone="amber" />
                <Stat label="Bloqueados" value={analysis.bloqueados} tone="red" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Preview (10 primeiras linhas)</h3>
                <div className="rounded-lg border border-border overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 text-muted-foreground uppercase sticky top-0">
                      <tr><th className="text-left px-3 py-2">Status</th><th className="text-left px-3 py-2">Empresa</th><th className="text-left px-3 py-2">Contato</th><th className="text-left px-3 py-2">Telefone</th></tr>
                    </thead>
                    <tbody>
                      {analysis.preview.slice(0, 10).map((p, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2">{p.ok ? <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" />OK</span> : <span className="inline-flex items-center gap-1 text-amber-600"><AlertTriangle className="h-3 w-3" />{p.reason}</span>}</td>
                          <td className="px-3 py-2 text-foreground">{p.empresa || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{p.contato || "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground font-mono">{p.telefone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {rows.length > 0 ? `${fileName} • ${rows.length} linhas lidas` : "Nenhum arquivo carregado"}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancelar</button>
            <button onClick={doImport} disabled={!canImport} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90">Criar lista</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "amber" | "red" }) {
  const cls = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}
