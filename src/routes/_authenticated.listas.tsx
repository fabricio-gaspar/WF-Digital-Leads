import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { useLeadLists, useServicesList } from "@/domain/sdrVirtual";
import { List, CheckCircle2, XCircle, Copy, Upload } from "lucide-react";
import { LeadListImporter } from "@/components/LeadListImporter";

export const Route = createFileRoute("/_authenticated/listas")({
  head: () => ({ meta: [{ title: "Listas de Leads — WF Digital Leads" }] }),
  component: ListasPage,
});

function ListasPage() {
  const lists = useLeadLists();
  const services = useServicesList();
  const [importing, setImporting] = useState(false);
  const getServiceName = (id: string) => services.find((s) => s.id === id)?.nome ?? "—";

  return (
    <AppShell title="Listas de Leads" subtitle="Resultados de buscas transformados em listas trabalháveis">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">SANDBOX DEMO — dados em memória, sem envio real</span>
          <button onClick={() => setImporting(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Upload className="h-4 w-4" /> Importar CSV/XLSX
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Stat label="Total de listas" value={lists.length} />
          <Stat label="Leads válidos" value={lists.reduce((a, l) => a + l.validos, 0)} tone="emerald" />
          <Stat label="Duplicados" value={lists.reduce((a, l) => a + l.duplicados, 0)} tone="amber" />
          <Stat label="Bloqueados" value={lists.reduce((a, l) => a + l.bloqueados, 0)} tone="red" />
        </div>


        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">Lista</th>
                <th className="text-left px-4 py-2.5">Serviço</th>
                <th className="text-left px-4 py-2.5">Origem</th>
                <th className="text-right px-4 py-2.5">Total</th>
                <th className="text-right px-4 py-2.5">Válidos</th>
                <th className="text-right px-4 py-2.5">Dup.</th>
                <th className="text-right px-4 py-2.5">Bloq.</th>
                <th className="text-left px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {lists.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium text-foreground">{l.nome}</div>
                        <div className="text-xs text-muted-foreground">{l.descricao}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{getServiceName(l.servicoId)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.origem}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{l.quantidade}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium"><span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{l.validos}</span></td>
                  <td className="px-4 py-3 text-right text-amber-600"><span className="inline-flex items-center gap-1"><Copy className="h-3 w-3" />{l.duplicados}</span></td>
                  <td className="px-4 py-3 text-right text-red-600"><span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3" />{l.bloqueados}</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      l.status === "Em campanha" ? "bg-primary/10 text-primary"
                      : l.status === "Ativa" ? "bg-emerald-100 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                    }`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground flex items-center justify-between">
          <span>Listas geradas por buscas Vibe/Apify/Importação sandbox — clique em uma busca em <Link to="/prospeccao" className="text-primary hover:underline">Prospecção</Link> para criar uma nova.</span>
        </div>
      </div>
      {importing && <LeadListImporter onClose={() => setImporting(false)} />}
    </AppShell>
  );
}


function Stat({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "amber" | "red" }) {
  const cls = tone === "emerald" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : tone === "red" ? "text-red-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
