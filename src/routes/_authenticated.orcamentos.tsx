import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import {
  useOrcamentos,
  useOportunidades,
  useProdutos,
  useEmpresas,
  createOrcamento,
  updateOrcamento,
  aprovarOrcamento,
  type StatusOrcamento,
  type LinhaOrcamento,
} from "@/domain/canonical";
import { FileText, Plus, CheckCircle2, XCircle, Download, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos (CPQ) — WF Digital Leads" },
      { name: "description", content: "Cotação profissional com preços, descontos, aprovação e versões." },
    ],
  }),
  component: OrcamentosPage,
});

const STATUS_COR: Record<StatusOrcamento, string> = {
  Rascunho: "bg-slate-100 text-slate-700",
  "Aguardando aprovação": "bg-amber-100 text-amber-700",
  Aprovado: "bg-emerald-100 text-emerald-700",
  
  Enviado: "bg-blue-100 text-blue-700",
  Aceito: "bg-emerald-100 text-emerald-700",
  Recusado: "bg-red-100 text-red-700",
};

function OrcamentosPage() {
  const orcamentos = useOrcamentos();
  const oportunidades = useOportunidades();
  const empresas = useEmpresas();
  const produtos = useProdutos();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <AppShell title="Orçamentos (CPQ)" subtitle="Configure, cote e envie propostas com regras de aprovação e versionamento">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Novo orçamento
          </button>
        </div>

        {creating && (
          <CreateOrcamentoCard
            oportunidades={oportunidades}
            produtos={produtos}
            onClose={() => setCreating(false)}
          />
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Número</th>
                <th className="text-left px-4 py-2">Cliente</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-center px-4 py-2">Versão</th>
                <th className="text-right px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((o) => {
                const op = oportunidades.find((x) => x.id === o.oportunidadeId);
                const empresa = op ? empresas.find((e) => e.id === op.empresaId) : undefined;
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2 font-mono text-xs">{o.numero}</td>
                    <td className="px-4 py-2">{empresa?.nomeFantasia ?? empresa?.razaoSocial ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COR[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">R$ {o.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-center text-xs text-muted-foreground">v{o.versao}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => setOpenId(o.id)} className="h-7 px-2 rounded text-xs border border-border">Detalhes</button>
                        {o.status === "Aguardando aprovação" && (
                          <>
                            <button onClick={() => { aprovarOrcamento(o.id, true); toast.success("Aprovado"); }} className="h-7 px-2 rounded text-xs bg-emerald-600 text-white inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Aprovar</button>
                            <button onClick={() => { aprovarOrcamento(o.id, false); toast.info("Rejeitado"); }} className="h-7 px-2 rounded text-xs bg-red-600 text-white inline-flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejeitar</button>
                          </>
                        )}
                        {o.status === "Aprovado" && (
                          <button onClick={() => { updateOrcamento(o.id, { status: "Enviado", dataEnvio: new Date().toISOString() }); toast.success("Marcado como enviado"); }} className="h-7 px-2 rounded text-xs bg-blue-600 text-white">Enviar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orcamentos.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-xs italic">Nenhum orçamento ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {openId && (
          <OrcamentoDetail id={openId} onClose={() => setOpenId(null)} />
        )}
      </div>
    </AppShell>
  );
}

function CreateOrcamentoCard({
  oportunidades,
  produtos,
  onClose,
}: {
  oportunidades: ReturnType<typeof useOportunidades>;
  produtos: ReturnType<typeof useProdutos>;
  onClose: () => void;
}) {
  const [opId, setOpId] = useState("");
  const [linhas, setLinhas] = useState<Array<{ produtoId: string; qtd: number; desconto: number }>>([]);
  const [descontoGeral, setDescontoGeral] = useState(0);

  const addLinha = (produtoId: string) => setLinhas((l) => [...l, { produtoId, qtd: 1, desconto: 0 }]);
  const remLinha = (i: number) => setLinhas((l) => l.filter((_, idx) => idx !== i));

  const linhasCompletas: LinhaOrcamento[] = linhas.map((l, i) => {
    const p = produtos.find((x) => x.id === l.produtoId);
    const precoUnit = p?.precoBase ?? 0;
    const subtotal = precoUnit * l.qtd * (1 - l.desconto / 100);
    return {
      id: `line-${i}`,
      produtoId: l.produtoId,
      descricao: p?.nome ?? "—",
      quantidade: l.qtd,
      precoUnitario: precoUnit,
      desconto: l.desconto,
      subtotal,
    };
  });

  const subtotal = linhasCompletas.reduce((s, l) => s + l.subtotal, 0);
  const total = subtotal * (1 - descontoGeral / 100);

  const submit = () => {
    if (!opId) return toast.error("Selecione a oportunidade");
    if (linhasCompletas.length === 0) return toast.error("Adicione pelo menos uma linha");
    const requerAprovacao = descontoGeral > 15 || linhasCompletas.some((l) => l.desconto > 20);
    createOrcamento({
      oportunidadeId: opId,
      linhas: linhasCompletas,
      subtotal,
      descontoGeral,
      total,
      status: requerAprovacao ? "Aguardando aprovação" : "Rascunho",
      validadeDias: 30,
      versao: 1,
      observacoes: "",
    });
    toast.success(requerAprovacao ? "Orçamento criado · requer aprovação (desconto > 15%)" : "Orçamento criado");
    onClose();
  };

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select value={opId} onChange={(e) => setOpId(e.target.value)} className="h-9 px-2 rounded-md border border-input bg-background text-sm md:col-span-2">
          <option value="">Oportunidade…</option>
          {oportunidades.map((o) => <option key={o.id} value={o.id}>{o.id.slice(0, 8)} · R$ {o.valorEstimado.toLocaleString("pt-BR")}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Desconto geral %</label>
          <input type="number" value={descontoGeral} onChange={(e) => setDescontoGeral(parseFloat(e.target.value) || 0)} className="flex-1 h-9 px-2 rounded-md border border-input bg-background text-sm" />
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-1">Adicionar produtos:</div>
        <div className="flex gap-1.5 flex-wrap">
          {produtos.map((p) => (
            <button key={p.id} onClick={() => addLinha(p.id)} className="text-xs px-2 py-1 rounded-full border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary">
              + {p.nome} <span className="text-muted-foreground">R$ {p.precoBase.toLocaleString("pt-BR")}</span>
            </button>
          ))}
        </div>
      </div>

      {linhas.length > 0 && (
        <div className="rounded-lg border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left px-2 py-1">Item</th>
                <th className="text-right px-2 py-1 w-20">Qtd</th>
                <th className="text-right px-2 py-1 w-24">Desc %</th>
                <th className="text-right px-2 py-1 w-32">Subtotal</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {linhasCompletas.map((lc, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-2 py-1">{lc.descricao}</td>
                  <td className="px-2 py-1">
                    <input type="number" value={linhas[i].qtd} onChange={(e) => setLinhas((l) => l.map((x, idx) => idx === i ? { ...x, qtd: parseInt(e.target.value) || 1 } : x))} className="w-full h-7 px-1 text-right rounded border border-input bg-background" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" value={linhas[i].desconto} onChange={(e) => setLinhas((l) => l.map((x, idx) => idx === i ? { ...x, desconto: parseFloat(e.target.value) || 0 } : x))} className="w-full h-7 px-1 text-right rounded border border-input bg-background" />
                  </td>
                  <td className="px-2 py-1 text-right font-medium">R$ {lc.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-2 py-1"><button onClick={() => remLinha(i)} className="text-red-600 text-xs">×</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/40 text-sm font-semibold">
              <tr className="border-t border-border">
                <td colSpan={3} className="px-2 py-2 text-right">Total</td>
                <td className="px-2 py-2 text-right text-primary">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="h-9 px-3 rounded-lg border border-border text-sm">Cancelar</button>
        <button onClick={submit} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar orçamento</button>
      </div>
    </div>
  );
}

function OrcamentoDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const orcamentos = useOrcamentos();
  const o = orcamentos.find((x) => x.id === id);
  if (!o) return null;

  const exportPDF = () => {
    const conteudo = [
      `ORÇAMENTO ${o.numero} (v${o.versao})`,
      `Status: ${o.status}`,
      `Data: ${new Date(o.criadoEm).toLocaleDateString("pt-BR")}`,
      "",
      "LINHAS:",
      ...o.linhas.map((l) => `- ${l.descricao} × ${l.quantidade} @ R$ ${l.precoUnitario.toFixed(2)} = R$ ${l.subtotal.toFixed(2)}`),
      "",
      `Subtotal: R$ ${o.subtotal.toFixed(2)}`,
      `Desconto geral: ${o.descontoGeral}%`,
      `TOTAL: R$ ${o.total.toFixed(2)}`,
      `Validade: ${o.validadeDias} dias`,
    ].join("\n");
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${o.numero}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documento gerado (sandbox — texto simulando PDF)");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {o.numero} <span className="text-xs text-muted-foreground">v{o.versao}</span></h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">×</button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COR[o.status]}`}>{o.status}</span>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Validade {o.validadeDias} dias</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr><th className="text-left py-1">Item</th><th className="text-right py-1">Qtd</th><th className="text-right py-1">Unit</th><th className="text-right py-1">Desc</th><th className="text-right py-1">Subtotal</th></tr>
            </thead>
            <tbody>
              {o.linhas.map((l) => (
                <tr key={l.id} className="border-b border-border/50">
                  <td className="py-1.5">{l.descricao}</td>
                  <td className="text-right">{l.quantidade}</td>
                  <td className="text-right">R$ {l.precoUnitario.toLocaleString("pt-BR")}</td>
                  <td className="text-right">{l.desconto}%</td>
                  <td className="text-right font-medium">R$ {l.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-sm">
              <tr><td colSpan={4} className="py-1 text-right text-muted-foreground">Subtotal</td><td className="text-right">R$ {o.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
              <tr><td colSpan={4} className="py-1 text-right text-muted-foreground">Desconto geral</td><td className="text-right">{o.descontoGeral}%</td></tr>
              <tr className="border-t border-border font-bold text-primary"><td colSpan={4} className="py-2 text-right">TOTAL</td><td className="text-right">R$ {o.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
            </tfoot>
          </table>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={exportPDF} className="h-9 px-3 rounded-lg border border-border text-sm inline-flex items-center gap-1.5"><Download className="h-4 w-4" /> Exportar PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
}
