import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Building2,
  Check,
  Loader2,
  MapPin,
  Plug,
  Search,
  Settings,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Card, SectionTitle } from "@/components/ui-kit";
import { getCompanySettings, updateCompanySettings } from "@/lib/crm.functions";
import { getEnabledSources, testApifyToken } from "@/lib/prospecting.functions";

type CompanyTab = "dados" | "buscas" | "apresentacao";

type CompanyForm = {
  name: string;
  cnpj: string;
  segment: string;
  size: "pequena" | "media" | "grande" | "";
  annual_revenue: string;
  city: string;
  state: string;
  website: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  tone_of_voice: string;
  differentiators: string;
};

const EMPTY_FORM: CompanyForm = {
  name: "",
  cnpj: "",
  segment: "",
  size: "",
  annual_revenue: "",
  city: "",
  state: "",
  website: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  tone_of_voice: "",
  differentiators: "",
};

export function CompanySettingsPanel({ embedded = false }: { embedded?: boolean }) {
  const qc = useQueryClient();
  const getSettings = useServerFn(getCompanySettings);
  const updateSettings = useServerFn(updateCompanySettings);
  const getEnabled = useServerFn(getEnabledSources);
  const testApify = useServerFn(testApifyToken);

  const [tab, setTab] = useState<CompanyTab>("dados");
  const [form, setForm] = useState<CompanyForm>(EMPTY_FORM);
  const [sources, setSources] = useState({ cnpj_ws: true, google_places: false, ai_only: false, apify: false });
  const [apifyResult, setApifyResult] = useState<{ ok: boolean; message: string; username?: string | null; plan?: string | null } | null>(null);

  const settingsQ = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => getSettings(),
  });
  const sourcesQ = useQuery({
    queryKey: ["enabled-sources"],
    queryFn: () => getEnabled(),
  });

  useEffect(() => {
    const data = settingsQ.data as any;
    if (!data) return;
    setForm({
      name: data.name ?? "",
      cnpj: data.cnpj ?? "",
      segment: data.segment ?? "",
      size: data.size ?? "",
      annual_revenue: data.annual_revenue ?? "",
      city: data.city ?? "",
      state: data.state ?? "",
      website: data.website ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      description: data.description ?? "",
      tone_of_voice: data.tone_of_voice ?? "",
      differentiators: data.differentiators ?? "",
    });
  }, [settingsQ.data]);

  useEffect(() => {
    const enabled = sourcesQ.data;
    if (!enabled) return;
    setSources({
      cnpj_ws: enabled.cnpj_ws,
      google_places: enabled.google_places,
      ai_only: enabled.ai_only,
      apify: (enabled as { apify?: boolean }).apify ?? false,
    });
  }, [sourcesQ.data]);

  const saveCompany = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          name: form.name.trim() || null,
          cnpj: form.cnpj.trim() || null,
          segment: form.segment.trim() || null,
          size: form.size || null,
          annual_revenue: form.annual_revenue.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim().toUpperCase() || null,
          website: form.website.trim() || null,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          description: form.description.trim() || null,
          tone_of_voice: form.tone_of_voice.trim() || null,
          differentiators: form.differentiators.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Empresa atualizada.");
      qc.invalidateQueries({ queryKey: ["company-settings"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar Empresa", { description: e.message }),
  });

  const saveSources = useMutation({
    mutationFn: () => updateSettings({ data: { prospecting_sources: sources } }),
    onSuccess: () => {
      toast.success("Perfil de buscas atualizado.");
      qc.invalidateQueries({ queryKey: ["enabled-sources"] });
      qc.invalidateQueries({ queryKey: ["company-settings"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar perfil de buscas", { description: e.message }),
  });

  const testApifyMut = useMutation({
    mutationFn: () => testApify(),
    onSuccess: (result) => {
      setApifyResult(result);
      result.ok
        ? toast.success("Apify: token válido")
        : toast.error("Apify: falha na verificação", { description: result.message });
    },
    onError: (e: Error) => {
      setApifyResult({ ok: false, message: e.message });
      toast.error("Erro ao testar Apify", { description: e.message });
    },
  });

  const loading = settingsQ.isLoading || sourcesQ.isLoading;
  const enabled = sourcesQ.data;

  const sourceCards = [
    {
      id: "cnpj_ws" as const,
      title: "CNPJ.ws / bases CNPJ autorizadas",
      desc: "Consulta de empresas por dados cadastrais, localização, CNAE e porte conforme a integração disponível.",
      status: null as { ok: boolean; text: string } | null,
    },
    {
      id: "google_places" as const,
      title: "Google Places",
      desc: "Descoberta de empresas por palavra-chave e localização, incluindo telefone, endereço e site quando fornecidos pela API.",
      status: enabled
        ? { ok: Boolean(enabled.has_google_key), text: enabled.has_google_key ? "Credencial configurada" : "GOOGLE_PLACES_API_KEY não configurada" }
        : null,
    },
    {
      id: "apify" as const,
      title: "Apify / Google Maps",
      desc: "Prospecção por actor autorizado da Apify, conforme token e configuração existentes no servidor.",
      status: enabled
        ? { ok: Boolean((enabled as any).has_apify_token), text: (enabled as any).has_apify_token ? "Credencial configurada" : "APIFY_TOKEN não configurado" }
        : null,
    },
    {
      id: "ai_only" as const,
      title: "IA para sugestões",
      desc: "Sugestões geradas por IA. Não substituem uma fonte externa validada para dados oficiais de contato.",
      status: enabled
        ? { ok: Boolean(enabled.has_anthropic_key), text: enabled.has_anthropic_key ? "Credencial de IA configurada" : "Credencial de IA não configurada" }
        : null,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-text-sec">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando Empresa…
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-4" : "flex flex-col gap-6 p-6"}>
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-title">Empresa</h1>
          <p className="text-sm text-text-sec">Dados da empresa e perfil usado pelo LeadAI nas buscas e abordagens.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-sec">
          <Building2 className="h-4 w-4" />
          {form.name || "Empresa não cadastrada"}
          {(form.city || form.state) && <span>· {[form.city, form.state].filter(Boolean).join(" / ")}</span>}
        </div>
      </div>

      <div className="flex w-fit flex-wrap gap-1 rounded-lg border border-border-card bg-bg-card p-1">
        {([
          ["dados", "Dados", Settings],
          ["buscas", "Perfil de Buscas", Search],
          ["apresentacao", "Apresentação", Target],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${tab === id ? "bg-primary text-primary-foreground" : "text-text-sec hover:bg-bg-general hover:text-text-title"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "dados" && (
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Dados da empresa" hint="Informações gravadas no banco da organização." />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nome da empresa"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} /></Field>
              <Field label="CNPJ"><input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputClass} /></Field>
              <Field label="Segmento"><input value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} className={inputClass} /></Field>
              <Field label="Porte">
                <select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value as CompanyForm["size"] })} className={inputClass}>
                  <option value="">Não informado</option><option value="pequena">Pequena</option><option value="media">Média</option><option value="grande">Grande</option>
                </select>
              </Field>
              <Field label="Faturamento anual"><input value={form.annual_revenue} onChange={(e) => setForm({ ...form, annual_revenue: e.target.value })} className={inputClass} /></Field>
              <Field label="Website"><input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} /></Field>
              <Field label="Telefone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></Field>
              <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} /></Field>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Localização" hint="Endereço usado como referência operacional e geográfica." />
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3"><Field label="Endereço"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></Field></div>
              <Field label="Cidade"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></Field>
              <Field label="Estado (UF)"><input maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} className={inputClass} /></Field>
              <div className="flex items-end pb-2 text-xs text-text-sec"><MapPin className="mr-1 h-4 w-4" /> Brasil</div>
            </div>
          </Card>

          <SaveButton pending={saveCompany.isPending} onClick={() => saveCompany.mutate()} label="Salvar Empresa" />
        </div>
      )}

      {tab === "buscas" && (
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Perfil de Buscas" hint="Fontes disponíveis para a Busca de Leads. A disponibilidade real depende das credenciais do servidor." />
            <div className="space-y-3">
              {sourceCards.map((item) => {
                const on = sources[item.id];
                return (
                  <div key={item.id} className={`rounded-lg border p-4 ${on ? "border-primary/60 bg-primary/5" : "border-border-card"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-text-title">{item.title}</div>
                        <div className="mt-1 text-xs text-text-body">{item.desc}</div>
                        {item.status && (
                          <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${item.status.ok ? "bg-success-bg text-success" : "bg-error-bg text-error"}`}>
                            {item.status.ok ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}{item.status.text}
                          </div>
                        )}
                        {item.id === "apify" && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => testApifyMut.mutate()} disabled={testApifyMut.isPending} className="inline-flex items-center gap-1.5 rounded-md border border-border-card bg-bg-card px-3 py-1.5 text-xs hover:bg-bg-general disabled:opacity-50">
                              {testApifyMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />} Testar Apify
                            </button>
                            {apifyResult && <span className={apifyResult.ok ? "text-xs text-success" : "text-xs text-error"}>{apifyResult.ok ? `Conectado${apifyResult.username ? ` como ${apifyResult.username}` : ""}${apifyResult.plan ? ` · ${apifyResult.plan}` : ""}` : apifyResult.message}</span>}
                          </div>
                        )}
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" checked={on} onChange={(e) => setSources({ ...sources, [item.id]: e.target.checked })} />
                        <div className="peer h-6 w-11 rounded-full bg-bg-general after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <SaveButton pending={saveSources.isPending} onClick={() => saveSources.mutate()} label="Salvar Perfil de Buscas" />
        </div>
      )}

      {tab === "apresentacao" && (
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Apresentação comercial" hint="Contexto da empresa utilizado pela Ana nas conversas." />
            <div className="space-y-4">
              <Field label="Descrição da empresa"><textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={textareaClass} /></Field>
              <Field label="Tom de voz"><input value={form.tone_of_voice} onChange={(e) => setForm({ ...form, tone_of_voice: e.target.value })} className={inputClass} /></Field>
              <Field label="Diferenciais e argumentos"><textarea rows={5} value={form.differentiators} onChange={(e) => setForm({ ...form, differentiators: e.target.value })} className={textareaClass} /></Field>
            </div>
          </Card>
          <SaveButton pending={saveCompany.isPending} onClick={() => saveCompany.mutate()} label="Salvar Apresentação" />
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-text-title">{label}</span>{children}</label>;
}

function SaveButton({ pending, onClick, label }: { pending: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{label}
    </button>
  );
}

const inputClass = "h-9 w-full rounded-md border border-border-card bg-bg-card px-3 text-sm outline-none focus:border-primary";
const textareaClass = "w-full rounded-md border border-border-card bg-bg-card px-3 py-2 text-sm outline-none focus:border-primary";
