import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  History,
  Loader2,
  CheckCircle2,
  FlaskConical,
  RadioTower,
  AlertTriangle,
  Database,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card, SectionTitle } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApproachModal, type ApproachChoice } from "@/components/ApproachModal";
import type { ExternalCompany, SourceId } from "@/lib/prospecting.functions";
import {
  getLeadSearchCapabilities,
  importLeadProspects,
  listLeadSearchHistory,
  searchLeadProspects,
  type SearchExecutionMode,
} from "@/lib/lead-search.functions";

export const Route = createFileRoute("/_authenticated/busca-leads")({ component: BuscaLeads });

const PORTES = ["MEI", "Micro", "Pequeno", "Médio", "Grande"];
const ALL_SOURCES: SourceId[] = ["google_places", "apify", "cnpj_ws"];

const sourceLabel = (source: SourceId) => {
  if (source === "google_places") return "Google Places";
  if (source === "apify") return "Apify / Google Maps";
  if (source === "cnpj_ws") return "CNPJ.ws Comercial";
  return "IA somente";
};

function BuscaLeads() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SearchExecutionMode>("test");
  const [raio, setRaio] = useState([25]);
  const [uf, setUf] = useState("SP");
  const [cidade, setCidade] = useState("São Paulo");
  const [keyword, setKeyword] = useState("");
  const [cnae, setCnae] = useState("");
  const [porte, setPorte] = useState<string | null>(null);
  const [limite, setLimite] = useState(15);
  const [source, setSource] = useState<SourceId>("google_places");

  const [cacheId, setCacheId] = useState<string | null>(null);
  const [results, setResults] = useState<ExternalCompany[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const capabilitiesFn = useServerFn(getLeadSearchCapabilities);
  const searchFn = useServerFn(searchLeadProspects);
  const historyFn = useServerFn(listLeadSearchHistory);
  const importFn = useServerFn(importLeadProspects);

  const capabilitiesQuery = useQuery({
    queryKey: ["lead-search-capabilities"],
    queryFn: () => capabilitiesFn(),
    retry: 1,
  });

  const { data: history = [], refetch: refetchHistory, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["lead-search-history"],
    queryFn: () => historyFn(),
  });

  const capabilities = capabilitiesQuery.data;

  const liveSources = useMemo(() => {
    if (!capabilities?.sources) return [] as SourceId[];
    return ALL_SOURCES.filter((id) => Boolean((capabilities.sources as any)[id]?.enabled));
  }, [capabilities]);

  const visibleSources = mode === "test" ? ALL_SOURCES : liveSources;

  useEffect(() => {
    if (mode === "live" && liveSources.length > 0 && !liveSources.includes(source)) {
      setSource(liveSources[0]);
    }
  }, [mode, liveSources, source]);

  useEffect(() => {
    setCacheId(null);
    setResults([]);
    setSelected(new Set());
  }, [mode]);

  const sourceInfo = capabilities?.sources ? (capabilities.sources as any)[source] : null;
  const liveReady = liveSources.length > 0;
  const searchDisabled = searchFn == null || (mode === "live" && !liveReady);

  const searchMut = useMutation({
    mutationFn: () =>
      searchFn({
        data: {
          mode,
          source,
          uf: uf || null,
          municipio: cidade || null,
          keyword: keyword || null,
          cnae: cnae || null,
          porte,
          radius_km: source === "google_places" ? Math.min(50, raio[0]) : null,
          limit: limite,
        },
      }),
    onSuccess: (response: any) => {
      setCacheId(response.cache_id);
      setResults(response.results ?? []);
      setSelected(new Set());
      refetchHistory();
      if (response.mode === "test") {
        toast.success(`${response.results?.length ?? 0} lead(s) fictício(s) gerado(s) para homologação. Nenhum contato real será feito.`);
      } else {
        toast.success(`${response.results?.length ?? 0} prospecto(s) real(is) encontrado(s) pela fonte ${sourceLabel(source)}.`);
      }
    },
    onError: (error: any) => toast.error(error?.message ?? "Falha na busca de leads"),
  });

  const importMut = useMutation({
    mutationFn: (choice: ApproachChoice) =>
      importFn({
        data: {
          cache_id: cacheId!,
          keys: Array.from(selected),
          approach: choice.approach,
          assignee_id: choice.assignee_id ?? null,
          sla_hours: choice.sla_hours,
        },
      }),
    onSuccess: (response: any) => {
      setModalOpen(false);
      setSelected(new Set());
      const skipped = response.skipped?.length ?? 0;
      const blocked = response.blocked?.length ?? 0;
      if (response.mode === "test") {
        toast.success(`${response.imported} lead(s) de TESTE enviado(s) ao CRM. Disparos externos permaneceram bloqueados.`, {
          action: { label: "Abrir no Kanban", onClick: () => navigate({ to: "/leads" }) },
        });
      } else {
        toast.success(`${response.imported} lead(s) real(is) importado(s); ${response.started ?? 0} abordagem(ns) da Ana iniciada(s); ${skipped + blocked} ignorado(s)/bloqueado(s).`, {
          action: { label: "Abrir no Kanban", onClick: () => navigate({ to: "/leads" }) },
        });
      }
    },
    onError: (error: any) => toast.error(error?.message ?? "Falha ao enviar os leads para o CRM"),
  });

  const allSelected = results.length > 0 && selected.size === results.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(results.map((r) => r.cnpj)));
  const toggleOne = (key: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-title">Busca de Leads</h1>
            <Badge variant={mode === "test" ? "outline" : "default"} className="gap-1">
              {mode === "test" ? <FlaskConical className="h-3 w-3" /> : <RadioTower className="h-3 w-3" />}
              {mode === "test" ? "TESTE / HOMOLOGAÇÃO" : "USO OFICIAL"}
            </Badge>
          </div>
          <p className="text-sm text-text-sec">
            Pesquise empresas, valide os dados e envie os selecionados ao Kanban para abordagem pela Ana ou pela equipe.
          </p>
        </div>

        <div className="flex rounded-lg border border-border-card bg-bg-card p-1">
          <Button
            type="button"
            size="sm"
            variant={mode === "test" ? "default" : "ghost"}
            className="gap-2"
            onClick={() => setMode("test")}
          >
            <FlaskConical className="h-4 w-4" />
            Teste
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "live" ? "default" : "ghost"}
            className="gap-2"
            onClick={() => setMode("live")}
          >
            <RadioTower className="h-4 w-4" />
            Oficial
          </Button>
        </div>
      </div>

      {mode === "test" ? (
        <Alert>
          <FlaskConical className="h-4 w-4" />
          <AlertTitle>Ambiente seguro para testar o fluxo completo</AlertTitle>
          <AlertDescription>
            Os resultados são fictícios e identificados como teste. Você pode selecionar, importar, criar tarefas e validar o Kanban, mas a Ana não dispara WhatsApp, e-mail ou ligação para esses registros.
          </AlertDescription>
        </Alert>
      ) : !capabilitiesQuery.isLoading && !liveReady ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhuma fonte oficial está pronta</AlertTitle>
          <AlertDescription>
            Configure ao menos uma credencial válida para Google Places, Apify ou CNPJ.ws Comercial. A busca oficial fica bloqueada enquanto não houver uma fonte real configurada.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Modo oficial conectado ao CRM e ao banco da empresa</AlertTitle>
          <AlertDescription>
            Os resultados vêm da fonte externa selecionada e são persistidos por empresa. Antes de importar, o backend valida duplicidade, canal de contato e supressão/opt-out.
          </AlertDescription>
        </Alert>
      )}

      {capabilitiesQuery.isError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível validar as integrações</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{(capabilitiesQuery.error as Error)?.message ?? "Falha ao consultar as configurações da empresa."}</span>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => capabilitiesQuery.refetch()}>
              <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle title="Localização" hint="Defina a área geográfica da prospecção." />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>País</Label>
                <Input defaultValue="Brasil" disabled />
              </div>
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Input value={uf} maxLength={2} onChange={(event) => setUf(event.target.value.toUpperCase())} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={cidade} onChange={(event) => setCidade(event.target.value)} />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <Label>Raio de atuação</Label>
                <span className="font-semibold text-primary">{raio[0]} km</span>
              </div>
              <Slider value={raio} min={1} max={50} step={1} onValueChange={setRaio} disabled={source !== "google_places"} />
              <p className="text-[11px] text-text-sec">
                O raio é usado no Google Places. As demais fontes trabalham com cidade/UF e seus próprios filtros.
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Perfil do lead" hint="Defina o tipo de empresa que deseja encontrar." />
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Segmento / palavra-chave</Label>
                <Input
                  value={keyword}
                  placeholder="Ex.: lavanderia industrial, logística, clínica, tecnologia"
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <p className="text-[11px] text-text-sec">Obrigatório para Google Places e Apify. No CNPJ.ws pode ser combinado com CNAE.</p>
              </div>
              <div className="space-y-2">
                <Label>CNAE</Label>
                <Input
                  value={cnae}
                  placeholder="Ex.: 6201501"
                  inputMode="numeric"
                  onChange={(event) => setCnae(event.target.value.replace(/[^0-9.-]/g, ""))}
                />
              </div>
              <div>
                <Label className="mb-2 block">Porte</Label>
                <div className="flex flex-wrap gap-2">
                  {PORTES.map((value) => (
                    <Badge
                      key={value}
                      onClick={() => setPorte(porte === value ? null : value)}
                      variant={porte === value ? "default" : "outline"}
                      className="cursor-pointer"
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Fonte de dados" hint={mode === "test" ? "No modo teste a fonte serve para simular o comportamento da integração." : "Somente integrações realmente configuradas ficam disponíveis."} />
            <div className="mt-4 space-y-4">
              <Select value={source} onValueChange={(value) => setSource(value as SourceId)} disabled={mode === "live" && !liveReady}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma fonte" />
                </SelectTrigger>
                <SelectContent>
                  {visibleSources.map((id) => (
                    <SelectItem key={id} value={id}>{sourceLabel(id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {mode === "live" && sourceInfo && (
                <div className="flex items-center justify-between rounded-lg border border-border-card bg-bg-general p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-text-title">{sourceInfo.label}</div>
                      <div className="text-text-sec">{sourceInfo.configured ? "Credencial encontrada no servidor" : "Credencial não configurada"}</div>
                    </div>
                  </div>
                  <Badge variant={sourceInfo.enabled ? "default" : "outline"}>{sourceInfo.enabled ? "Pronta" : "Indisponível"}</Badge>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle title="Volume e execução" />
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Input
                type="number"
                className="w-24"
                min={1}
                max={30}
                value={limite}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setLimite(Number.isFinite(value) ? Math.max(1, Math.min(30, value)) : 1);
                }}
              />
              <span className="text-sm text-text-sec">prospectos por busca</span>
            </div>

            <Button
              className="mt-6 w-full gap-2"
              onClick={() => searchMut.mutate()}
              disabled={searchMut.isPending || searchDisabled || capabilitiesQuery.isLoading}
            >
              {searchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "test" ? <FlaskConical className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {searchMut.isPending ? "Buscando..." : mode === "test" ? "Executar busca de teste" : "Buscar leads reais agora"}
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <SectionTitle title="Resumo da busca" />
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-text-sec">Ambiente</span><span className="text-right font-medium">{mode === "test" ? "Teste" : "Oficial"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-text-sec">Fonte</span><span className="text-right font-medium">{sourceLabel(source)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-text-sec">Local</span><span className="text-right font-medium">{cidade || "—"} {uf ? `- ${uf}` : ""}</span></div>
              {source === "google_places" && <div className="flex justify-between gap-4"><span className="text-text-sec">Raio</span><span className="font-medium">{raio[0]} km</span></div>}
              <div className="flex justify-between gap-4"><span className="text-text-sec">Segmento</span><span className="max-w-44 truncate text-right font-medium">{keyword || "todos"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-text-sec">CNAE</span><span className="font-medium">{cnae || "—"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-text-sec">Porte</span><span className="font-medium">{porte ?? "todos"}</span></div>
              <hr className="border-border-card" />
              <div className="flex justify-between text-lg font-bold"><span className="text-text-sec">Resultados</span><span>{results.length}</span></div>
              <div className="flex justify-between"><span className="text-text-sec">Selecionados</span><span className="font-medium">{selected.size}</span></div>
              <Button className="w-full" disabled={!selected.size || !cacheId} onClick={() => setModalOpen(true)}>
                Enviar selecionados para Leads
              </Button>
              {mode === "test" && (
                <p className="rounded-md bg-bg-general p-2 text-[11px] leading-relaxed text-text-sec">
                  Leads de teste entram no CRM para validação do fluxo, mas permanecem impedidos de disparar mensagens externas.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {results.length > 0 && (
        <Card>
          <SectionTitle
            title={mode === "test" ? "Leads de teste encontrados" : "Prospectos reais encontrados"}
            hint={mode === "test" ? "Dados fictícios para validar interface, banco, Kanban e abordagem sem comunicação externa." : "Revise os dados antes de enviar ao CRM. O contato só começa depois da abordagem escolhida."}
          />
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Selecionar todos" />
                  </TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Canais</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((company) => (
                  <TableRow key={company.cnpj}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(company.cnpj)}
                        onCheckedChange={() => toggleOne(company.cnpj)}
                        aria-label={`Selecionar ${company.razao_social}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium text-text-title">
                        {company.nome_fantasia || company.razao_social}
                        {mode === "test" && <Badge variant="outline" className="text-[10px]">TESTE</Badge>}
                      </div>
                      <div className="text-xs text-text-sec">{company.cnpj}</div>
                    </TableCell>
                    <TableCell className="max-w-64 text-xs">{company.cnae_descricao ?? "—"}</TableCell>
                    <TableCell className="text-xs">{[company.municipio, company.uf].filter(Boolean).join("/") || "—"}</TableCell>
                    <TableCell className="space-x-1 text-xs">
                      {company.whatsapp && <Badge variant="outline">WhatsApp</Badge>}
                      {company.email && <Badge variant="outline">E-mail</Badge>}
                      {company.telefone && <Badge variant="outline">Telefone</Badge>}
                      {!company.whatsapp && !company.email && !company.telefone && <span className="text-text-sec">Sem canal</span>}
                    </TableCell>
                    <TableCell title={company.score_reason ?? undefined}>
                      <span className="font-semibold text-primary">{company.score ?? "—"}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle
          title="Histórico de prospecções"
          action={
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => refetchHistory()} disabled={historyLoading}>
              {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
              Atualizar
            </Button>
          }
        />
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Busca</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Resultados</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-text-sec">
                    Nenhuma prospecção registrada para este usuário nesta empresa.
                  </TableCell>
                </TableRow>
              )}
              {history.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(item.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={item.mode === "test" ? "outline" : "default"} className="text-[10px]">
                      {item.mode === "test" ? "TESTE" : "OFICIAL"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{sourceLabel(item.source as SourceId)}</TableCell>
                  <TableCell className="text-xs">{item.total_found}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-ok">
                      <CheckCircle2 className="h-3 w-3" /> Concluída
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ApproachModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        count={selected.size}
        submitting={importMut.isPending}
        onConfirm={(choice) => importMut.mutate(choice)}
      />
    </div>
  );
}
