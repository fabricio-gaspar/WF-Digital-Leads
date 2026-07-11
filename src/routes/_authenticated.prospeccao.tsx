import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useProspectingResults } from "@/repositories/hooks";
import { stores, generateId, nowIso } from "@/repositories/demo";
import { useAuth } from "@/auth/AuthProvider";
import { useState } from "react";
import { Search, Sparkles, Import, Loader2, Target, Zap, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchProfiles, useServicesList } from "@/domain/sdrVirtual";
import { recordSearchRun, recordEnrichment, useEnrichmentEvents } from "@/domain/DemoDataProvider";
import { checkEligibility, upsertEmpresa } from "@/domain/canonical";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  head: () => ({ meta: [{ title: "Prospecção — WF Digital CRM" }] }),
  component: ProspectingPage,
});

function ProspectingPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { data: results = [] } = useProspectingResults();
  const perfis = useSearchProfiles();
  const services = useServicesList();
  const enrichmentEvents = useEnrichmentEvents();

  const [tab, setTab] = useState<"apify" | "vibe" | "gmaps">("gmaps");
  const [perfilId, setPerfilId] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [enriquecendo, setEnriquecendo] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const perfil = perfis.find((p) => p.id === perfilId);
  const servico = perfil ? services.find((s) => s.id === perfil.servicoId) : undefined;

  function runSearch() {
    if (!perfil) return toast.error("Selecione um Perfil de Busca");
    setRunning(true);
    setTimeout(() => {
      const searchId = generateId("ps");
      const cidades = perfil.cidades.length ? perfil.cidades : ["São Paulo", "Curitiba", "Belo Horizonte"];
      const nFound = 6 + Math.floor(Math.random() * 6);
      let qualified = 0;
      for (let i = 0; i < nFound; i++) {
        const c = cidades[i % cidades.length];
        const confidence = 0.35 + Math.random() * 0.6;
        if (confidence > 0.6) qualified++;
        stores.prospectingResults.upsert({
          id: generateId("pr"),
          searchId,
          empresa: `${perfil.segmento.split(" ")[0]} ${["Indústria", "Comércio", "Serviços", "Tech"][i % 4]} ${i + 1}`,
          cnpj: `${10 + i}.${100 + i}.${200 + i}/0001-${10 + i}`,
          segmento: perfil.segmento,
          cidade: c,
          uf: perfil.ufs[0] ?? "SP",
          telefone: `+55 ${11 + (i % 20)} 9${1000 + i}-${1000 + i}`,
          source: tab,
          collectedAt: nowIso(),
          confidence,
          status: "novo",
        });
      }
      recordSearchRun({
        perfilId: perfil.id,
        query: `${perfil.nome} · fonte=${tab}`,
        location: cidades.slice(0, 2).join(", "),
        totalFound: nFound,
        qualified,
      });
      qc.invalidateQueries({ queryKey: ["prospectingResults"] });
      setRunning(false);
      toast.success(`${nFound} leads encontrados (${qualified} pré-qualificados) via ${tab.toUpperCase()}`);
    }, 900);
  }

  async function runEnrichmentCascade(resultId: string, empresaNome: string) {
    setEnriquecendo(resultId);
    // gmaps → linkedin → web (cascata visível)
    const chain: Array<"gmaps" | "linkedin" | "web"> = ["gmaps", "linkedin", "web"];
    for (const source of chain) {
      await new Promise((r) => setTimeout(r, 500));
      const hit = Math.random() > 0.3;
      recordEnrichment({
        leadRef: resultId,
        source,
        hit,
        fields: hit
          ? source === "gmaps"
            ? ["endereço", "telefone", "site"]
            : source === "linkedin"
            ? ["cargo", "porte", "decisor"]
            : ["email genérico", "descrição"]
          : [],
      });
      if (hit) {
        toast.success(`${source.toUpperCase()} enriqueceu ${empresaNome}`);
        break;
      }
      toast.message(`${source.toUpperCase()} sem match para ${empresaNome} — tentando próxima fonte`);
    }
    setEnriquecendo(null);
  }

  function importLead(id: string) {
    const r = stores.prospectingResults.get(id);
    if (!r) return;
    // Elegibilidade
    const eleg = checkEligibility({
      segmento: r.segmento,
      emailValido: false,
      telefoneValido: !!r.telefone,
      perfilSegmento: perfil?.segmento,
    });
    if (!eleg.elegivel) {
      return toast.error(`Bloqueado pela elegibilidade: ${eleg.motivos.join(", ")}`);
    }
    if (eleg.avisos.length) toast.warning(`Avisos: ${eleg.avisos.join("; ")}`);

    // Dedupe canônico via upsertEmpresa
    const empresa = upsertEmpresa({
      razaoSocial: r.empresa,
      nomeFantasia: r.empresa,
      cnpj: r.cnpj,
      segmento: r.segmento,
      cidade: r.cidade,
      uf: r.uf,
      telefone: r.telefone,
      proveniencia: [{ source: r.source, at: r.collectedAt }],
    });

    const companyId = generateId("co");
    stores.companies.upsert({
      id: companyId,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia ?? empresa.razaoSocial,
      cnpj: empresa.cnpj,
      segmento: empresa.segmento,
      cidade: empresa.cidade,
      uf: empresa.uf,
      createdAt: nowIso(),
    });
    stores.leads.upsert({
      id: generateId("ld"),
      companyId,
      ownerId: session!.user.id,
      stage: "prospeccao",
      temperature: "frio",
      score: Math.round(r.confidence * 100),
      estimatedValue: 5000 + Math.round(r.confidence * 10000),
      source: "busca_ativa",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    setImportedIds((s) => new Set(s).add(id));
    qc.invalidateQueries();
    toast.success("Lead importado (empresa canônica + pipeline)");
  }

  const filtered = results.filter((r) => r.source === tab);
  const enrichmentByRef = enrichmentEvents.reduce<Record<string, typeof enrichmentEvents>>((acc, e) => {
    (acc[e.leadRef] ??= []).push(e);
    return acc;
  }, {});

  return (
    <AppShell title="Prospecção" subtitle="Perfil de Busca + coleta multifonte + enriquecimento em cascata (sandbox)">
      <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <Target className="h-4 w-4 text-primary" />
            <select
              value={perfilId}
              onChange={(e) => setPerfilId(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm"
            >
              <option value="">Selecione um Perfil de Busca…</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {p.status}</option>
              ))}
            </select>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">SANDBOX</span>
        </div>

        {perfil && (
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
            <span><b className="text-foreground">Serviço:</b> {servico?.nome ?? "—"}</span>
            <span><b className="text-foreground">Segmento:</b> {perfil.segmento}</span>
            <span><MapPin className="inline h-3 w-3 mr-1" />{perfil.cidades.slice(0, 2).join(", ") || perfil.ufs.join(", ")}</span>
            <span><b className="text-foreground">Porte:</b> {perfil.porteMin}-{perfil.porteMax} func</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
            {(["gmaps", "apify", "vibe"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                <Search className="h-3.5 w-3.5" /> {t === "gmaps" ? "Google Maps" : t === "apify" ? "Apify" : "Vibe"}
              </button>
            ))}
          </div>
          <button
            disabled={running || !perfilId}
            onClick={runSearch}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-strong disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Executar busca
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border text-[13px] font-semibold">
          Resultados ({filtered.length}) — {tab.toUpperCase()}
        </div>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-[13px]">
            {perfilId ? "Nenhum resultado ainda. Execute uma busca acima." : "Selecione um Perfil de Busca para começar."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Empresa</th>
                <th className="text-left px-3 py-2">Local</th>
                <th className="text-left px-3 py-2">Enriquecimento</th>
                <th className="text-right px-3 py-2">Confiança</th>
                <th className="text-right px-3 py-2">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const imported = importedIds.has(r.id);
                const events = enrichmentByRef[r.id] ?? [];
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-3 py-2">
                      <div className="font-medium">{r.empresa}</div>
                      <div className="text-[11px] text-muted-foreground">{r.cnpj} · {r.segmento}</div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{r.cidade}/{r.uf}</td>
                    <td className="px-3 py-2">
                      {events.length === 0 ? (
                        <button
                          onClick={() => runEnrichmentCascade(r.id, r.empresa)}
                          disabled={enriquecendo === r.id}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {enriquecendo === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                          Enriquecer
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {events.map((e) => (
                            <span key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded-full ${e.hit ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground line-through"}`}>
                              {e.source}{e.hit && ` ✓${e.fields.length}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{Math.round(r.confidence * 100)}%</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => importLead(r.id)}
                        disabled={imported}
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] bg-primary-soft text-primary-strong hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                      >
                        {imported ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Import className="h-3.5 w-3.5" />}
                        {imported ? "Importado" : "Importar"}
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
