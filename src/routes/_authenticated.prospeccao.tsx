import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useProspectingResults, useLeads } from "@/repositories/hooks";
import { stores } from "@/repositories/demo";
import { useAuth } from "@/auth/AuthProvider";
import { useState } from "react";
import { Search, Sparkles, Import, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { generateId, nowIso } from "@/repositories/demo";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  head: () => ({ meta: [{ title: "Prospecção — WF Digital CRM" }] }),
  component: ProspectingPage,
});

function ProspectingPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { data: results = [] } = useProspectingResults();
  const { data: leads = [] } = useLeads();
  const [tab, setTab] = useState<"apify" | "vibe">("apify");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);

  const leadCompanyIds = new Set(leads.map((l) => l.companyId));

  function runSearch() {
    if (!query.trim()) return toast.error("Informe um termo de busca");
    setRunning(true);
    setTimeout(() => {
      // Sandbox: gera resultados fake
      const segmentos = ["Metalurgia", "Alimentos", "Logística", "TI", "Construção"];
      const cidades = [["São Paulo", "SP"], ["Curitiba", "PR"], ["Belo Horizonte", "MG"], ["Porto Alegre", "RS"]];
      for (let i = 0; i < 8; i++) {
        const c = cidades[i % cidades.length];
        stores.prospectingResults.upsert({
          id: generateId("pr"),
          source: tab,
          query,
          razaoSocial: `${query} ${["Indústria", "Comércio", "Serviços"][i % 3]} Ltda`,
          nomeFantasia: `${query} #${i + 1}`,
          cnpj: `${10 + i}.${100 + i}.${200 + i}/0001-${10 + i}`,
          segmento: segmentos[i % segmentos.length],
          cidade: c[0],
          uf: c[1],
          telefone: `+55 ${11 + (i % 20)} 9${1000 + i}-${1000 + i}`,
          site: `https://exemplo${i}.com.br`,
          score: 40 + ((i * 7) % 60),
          fetchedAt: nowIso(),
        });
      }
      qc.invalidateQueries({ queryKey: ["prospectingResults"] });
      setRunning(false);
      toast.success(`8 novos leads encontrados (${tab === "apify" ? "Apify" : "Vibe"})`);
    }, 900);
  }

  function importLead(id: string) {
    const r = stores.prospectingResults.get(id);
    if (!r) return;
    const company = stores.companies.upsert({
      id: generateId("co"),
      razaoSocial: r.razaoSocial,
      nomeFantasia: r.nomeFantasia,
      cnpj: r.cnpj,
      segmento: r.segmento,
      cidade: r.cidade,
      uf: r.uf,
      telefone: r.telefone,
      site: r.site,
      createdAt: nowIso(),
    });
    stores.leads.upsert({
      id: generateId("ld"),
      companyId: company.id,
      ownerId: session!.user.id,
      stage: "novo",
      temperature: "frio",
      score: r.score,
      estimatedValue: 5000 + Math.round(r.score * 100),
      source: r.source,
      createdAt: nowIso(),
    });
    qc.invalidateQueries();
    toast.success("Lead importado para o pipeline");
  }

  const filtered = results.filter((r) => r.source === tab);

  return (
    <AppShell title="Prospecção" subtitle="Buscar novos leads em fontes externas (sandbox)">
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
            <button onClick={() => setTab("apify")} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] ${tab === "apify" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <Search className="h-3.5 w-3.5" /> Apify
            </button>
            <button onClick={() => setTab("vibe")} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] ${tab === "vibe" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              <Sparkles className="h-3.5 w-3.5" /> Vibe Prospecting
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "apify" ? "Ex.: metalurgia SP" : "Descreva o ICP em linguagem natural…"} className="flex-1 min-w-[240px] h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          <button disabled={running} onClick={runSearch} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-strong disabled:opacity-60 inline-flex items-center gap-1.5">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border text-[13px] font-semibold">Resultados ({filtered.length})</div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-[13px]">Nenhum resultado ainda. Execute uma busca acima.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Empresa</th>
                <th className="text-left px-3 py-2">Segmento</th>
                <th className="text-left px-3 py-2">Local</th>
                <th className="text-left px-3 py-2">Telefone</th>
                <th className="text-right px-3 py-2">Score</th>
                <th className="text-right px-3 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const imported = leadCompanyIds.has(r.id);
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.nomeFantasia ?? r.razaoSocial}</div>
                      <div className="text-[11px] text-muted-foreground">{r.cnpj}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.segmento}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.cidade}/{r.uf}</td>
                    <td className="px-3 py-2 text-muted-foreground">{r.telefone ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-medium">{r.score}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => importLead(r.id)} disabled={imported} className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] bg-primary-soft text-primary-strong hover:bg-primary hover:text-primary-foreground disabled:opacity-50">
                        <Import className="h-3.5 w-3.5" /> {imported ? "Importado" : "Importar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
