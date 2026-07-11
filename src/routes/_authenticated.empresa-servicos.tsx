import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { PageHero } from "@/app/PageHero";
import { useCompanyProfile, useServicesList, useKnowledgeBase, sdrPolicies, toggleServiceSdr } from "@/domain/sdrVirtual";
import { useProdutos, useOfertas, upsertProduto, removeProduto, upsertOferta, removeOferta } from "@/domain/canonical";
import { Building2, Package, BookOpen, Shield, CheckCircle2, AlertTriangle, Power, PowerOff, ShoppingBag, Tag, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/empresa-servicos")({
  head: () => ({ meta: [{ title: "Empresa e Serviços — WF Digital Leads" }] }),
  component: EmpresaServicosPage,
});

type Tab = "empresa" | "servicos" | "produtos" | "ofertas" | "conhecimento" | "limites" | "revisao";

function EmpresaServicosPage() {
  const [tab, setTab] = useState<Tab>("empresa");
  const company = useCompanyProfile();
  const services = useServicesList();
  const knowledge = useKnowledgeBase();
  const produtos = useProdutos();
  const ofertas = useOfertas();

  const tabs: { id: Tab; label: string; icon: typeof Building2 }[] = [
    { id: "empresa", label: "Empresa", icon: Building2 },
    { id: "servicos", label: "Serviços", icon: Package },
    { id: "produtos", label: "Produtos", icon: ShoppingBag },
    { id: "ofertas", label: "Ofertas", icon: Tag },
    { id: "conhecimento", label: "Conhecimento SDR", icon: BookOpen },
    { id: "limites", label: "Limites SDR", icon: Shield },
    { id: "revisao", label: "Revisão", icon: CheckCircle2 },
  ];

  return (
    <AppShell title="Empresa e Serviços" subtitle="Perfil da empresa, catálogo e base do SDR">
      <div className="max-w-6xl mx-auto">
        <PageHero
          icon={Building2}
          eyebrow="Fundação Comercial"
          title="Empresa & Catálogo"
          description="Identidade, serviços, produtos, ofertas e base de conhecimento que alimentam o SDR virtual."
          stats={[
            { label: "Serviços ativos", value: services.filter((s) => s.sdrAtivo !== false).length, tone: "primary" },
            { label: "Produtos", value: produtos.length },
            { label: "Ofertas", value: ofertas.length },
            { label: "Docs SDR", value: knowledge.length, hint: "Base de conhecimento" },
          ]}
        />
      </div>
      <div className="max-w-6xl mx-auto space-y-6">



        <div className="flex gap-1 border-b border-border">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "empresa" && (
          <div className="space-y-4">
            <Card title="Identidade">
              <Row label="Nome Fantasia" value={company.nomeFantasia} />
              <Row label="Razão Social" value={company.razaoSocial} />
              <Row label="Segmento" value={company.segmento} />
              <Row label="Tipo" value={company.tipo} />
              <Row label="Cidade/UF" value={company.cidadeUf} />
              <Row label="Atendimento" value={company.modoAtendimento} />
              <Row label="Regiões" value={company.regioesAtendidas.join(", ")} />
              <Row label="Site" value={company.site} />
            </Card>

            <Card title="Apresentação Autorizada">
              <div className="space-y-3 text-sm">
                <div><div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Uma frase</div><p className="text-foreground italic">{company.frase}</p></div>
                <div><div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Curta (300 caracteres)</div><p className="text-foreground">{company.apresentacaoCurta}</p></div>
                <div><div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Completa</div><p className="text-foreground">{company.apresentacaoCompleta}</p></div>
                <div><div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Proposta de valor</div><p className="text-foreground">{company.propostaValor}</p></div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card title="Problemas que resolvemos">
                <ul className="space-y-1.5 text-sm">
                  {company.problemasQueResolve.map((p) => <li key={p} className="flex gap-2"><span className="text-primary">•</span>{p}</li>)}
                </ul>
              </Card>
              <Card title="Diferenciais">
                <ul className="space-y-1.5 text-sm">
                  {company.diferenciais.map((d) => <li key={d} className="flex gap-2"><span className="text-primary">•</span>{d}</li>)}
                </ul>
              </Card>
            </div>

            <Card title="Comunicação">
              <Row label="Tom" value={company.tom} />
              <Row label="Formalidade" value={company.formalidade} />
              <Row label="CTA principal" value={company.ctaPrincipal} />
              <Row label="Palavras preferidas" value={company.palavrasPreferidas.join(", ")} />
              <Row label="Palavras proibidas" value={company.palavrasProibidas.join(", ")} />
              <Row label="Assuntos proibidos" value={company.assuntosProibidos.join(", ")} />
              <Row label="Horário comercial" value={company.horarioComercial} />
              <Row label="Responsável handoff" value={company.responsavelHandoff} />
              <Row label="SLA vendedor" value={company.slaVendedor} />
            </Card>
          </div>
        )}

        {tab === "servicos" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {services.map((s) => {
              const sdrOn = s.sdrAtivo !== false;
              return (
                <div key={s.id} data-testid={`service-card-${s.id}`} className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.categoria}</div>
                      <h3 className="text-base font-semibold text-foreground mt-0.5">{s.nome}</h3>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{s.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.descricaoCurta}</p>

                  <div className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${sdrOn ? "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20" : "border-red-200 bg-red-50/60 dark:bg-red-950/20"}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {sdrOn ? <Power className="h-4 w-4 text-emerald-600 shrink-0" /> : <PowerOff className="h-4 w-4 text-red-600 shrink-0" />}
                      <div className="min-w-0">
                        <div className={`text-xs font-medium ${sdrOn ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}`}>
                          SDR {sdrOn ? "ativo" : "pausado"} para este serviço
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {sdrOn ? "Rascunhos serão gerados normalmente." : "Kill-switch acionado — nenhum rascunho será gerado."}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        toggleServiceSdr(s.id);
                        toast.message(sdrOn ? `SDR pausado para ${s.nome}` : `SDR reativado para ${s.nome}`);
                      }}
                      data-testid={`sdr-toggle-${s.id}`}
                      role="switch"
                      aria-checked={sdrOn}
                      aria-label={`Alternar SDR para ${s.nome}`}
                      className={`shrink-0 h-6 w-11 rounded-full relative transition-colors ${sdrOn ? "bg-emerald-500" : "bg-red-400"}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${sdrOn ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </div>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-border">
                    <div><span className="text-muted-foreground">Problema:</span> <span className="text-foreground">{s.problemaPrincipal}</span></div>
                    <div><span className="text-muted-foreground">Ticket:</span> <span className="text-foreground">{s.faixaTicket ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Preço:</span> <span className="text-foreground">{s.politicaPreco}</span></div>
                    <div><span className="text-muted-foreground">Prazo:</span> <span className="text-foreground">{s.prazoInformavel}</span></div>
                    <div><span className="text-muted-foreground">Personas:</span> <span className="text-foreground">{s.personas.join(", ")}</span></div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground mb-1.5">Mensagem inicial autorizada</div>
                    <p className="text-xs bg-muted/50 rounded-md p-2.5 text-foreground italic">{s.mensagemInicial}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "conhecimento" && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="text-left px-4 py-2.5">Categoria</th>
                  <th className="text-left px-4 py-2.5">Pergunta</th>
                  <th className="text-left px-4 py-2.5">Resposta autorizada</th>
                  <th className="text-left px-4 py-2.5">Auto</th>
                </tr>
              </thead>
              <tbody>
                {knowledge.map((k) => (
                  <tr key={k.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{k.categoria}</span></td>
                    <td className="px-4 py-3 font-medium text-foreground">{k.pergunta}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-md">{k.resposta}</td>
                    <td className="px-4 py-3">
                      {k.podeEnviarAuto ? (
                        <span className="text-emerald-600 text-xs font-medium">Sim</span>
                      ) : k.exigeVendedor ? (
                        <span className="text-amber-600 text-xs font-medium">Vendedor</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Revisar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "produtos" && <ProdutosTab produtos={produtos} />}
        {tab === "ofertas" && <OfertasTab ofertas={ofertas} produtos={produtos} services={services} />}

        {tab === "limites" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-200">
                Estas regras são absolutas. O SDR Virtual NUNCA as viola, mesmo quando o cliente pede explicitamente.
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Toggle label="Sempre se identificar como assistente virtual" on={sdrPolicies.sempreIdentificar} />
              <Toggle label="Nunca inventar informação" on={sdrPolicies.naoInventar} />
              <Toggle label="Não prometer prazo não cadastrado" on={sdrPolicies.naoPrometerPrazo} />
              <Toggle label="Não informar preço fora da política" on={sdrPolicies.naoInformarPreco} />
              <Toggle label="Não conceder desconto" on={sdrPolicies.naoConcederDesconto} />
              <Toggle label="Não negociar contrato" on={sdrPolicies.naoNegociarContrato} />
              <Toggle label="Não falar mal de concorrentes" on={sdrPolicies.naoFalarMalConcorrente} />
              <Toggle label="Não insistir após recusa" on={sdrPolicies.naoInsistirAposRecusa} />
              <Toggle label="Encerrar em opt-out" on={sdrPolicies.encerrarEmOptOut} />
              <Toggle label="Encaminhar em baixa confiança" on={sdrPolicies.encaminharBaixaConfianca} />
              <Toggle label="Pausar quando humano assumir" on={sdrPolicies.pausarQuandoHumano} />
            </div>
            <Card title="Parâmetros">
              <Row label="Modo operacional" value={sdrPolicies.modo} highlight />
              <Row label="Confiança mínima para envio auto" value={`${(sdrPolicies.confiancaMinima * 100).toFixed(0)}%`} />
              <Row label="Máx. mensagens por conversa" value={String(sdrPolicies.maxMensagensPorConversa)} />
              <Row label="Máx. perguntas consecutivas" value={String(sdrPolicies.maxPerguntasConsecutivas)} />
              <Row label="Termos de handoff imediato" value={sdrPolicies.termosHandoff.join(", ")} />
              <Row label="Termos de opt-out" value={sdrPolicies.termosOptOut.join(", ")} />
            </Card>
          </div>
        )}

        {tab === "revisao" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold">Configuração pronta para uso demonstrativo</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-emerald-900 dark:text-emerald-200/90">
              <li>✓ Perfil da empresa completo com apresentação autorizada</li>
              <li>✓ {services.length} serviços cadastrados com política de preço e mensagens iniciais</li>
              <li>✓ {knowledge.length} entradas na base de conhecimento</li>
              <li>✓ Limites do SDR configurados em modo {sdrPolicies.modo}</li>
              <li>✓ Templates de handoff e opt-out definidos</li>
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      <div className="p-5 space-y-2">{children}</div>
    </div>
  );
}
function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-3 text-sm py-1">
      <div className="w-56 shrink-0 text-muted-foreground">{label}</div>
      <div className={`flex-1 ${highlight ? "font-semibold text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <span className="text-sm text-foreground">{label}</span>
      <div className={`h-5 w-9 rounded-full ${on ? "bg-primary" : "bg-muted"} relative transition-colors`}>
        <div className={`absolute top-0.5 ${on ? "right-0.5" : "left-0.5"} h-4 w-4 rounded-full bg-white shadow-sm transition-all`} />
      </div>
    </div>
  );
}

function ProdutosTab({ produtos }: { produtos: ReturnType<typeof useProdutos> }) {
  const [form, setForm] = useState({ nome: "", descricao: "", precoBase: 0, unidade: "projeto", categoria: "" });
  const submit = () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    upsertProduto({ ...form, ativo: true });
    toast.success("Produto salvo");
    setForm({ nome: "", descricao: "", precoBase: 0, unidade: "projeto", categoria: "" });
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="h-4 w-4" /> Novo produto</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" className="h-9 px-2 rounded-md border border-input bg-background text-sm md:col-span-2" />
          <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Categoria" className="h-9 px-2 rounded-md border border-input bg-background text-sm" />
          <input type="number" value={form.precoBase} onChange={(e) => setForm({ ...form, precoBase: parseFloat(e.target.value) || 0 })} placeholder="Preço" className="h-9 px-2 rounded-md border border-input bg-background text-sm" />
          <input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} placeholder="Unidade" className="h-9 px-2 rounded-md border border-input bg-background text-sm" />
        </div>
        <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição" rows={2} className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-sm" />
        <button onClick={submit} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Adicionar</button>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr><th className="text-left px-4 py-2">Nome</th><th className="text-left px-4 py-2">Categoria</th><th className="text-right px-4 py-2">Preço</th><th className="text-left px-4 py-2">Unidade</th><th className="text-right px-4 py-2">Ação</th></tr>
          </thead>
          <tbody>
            {produtos.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-2"><div className="font-medium">{p.nome}</div><div className="text-xs text-muted-foreground">{p.descricao}</div></td>
                <td className="px-4 py-2 text-muted-foreground">{p.categoria}</td>
                <td className="px-4 py-2 text-right font-medium">R$ {p.precoBase.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.unidade}</td>
                <td className="px-4 py-2 text-right"><button onClick={() => removeProduto(p.id)} className="text-red-600 hover:opacity-70"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfertasTab({ ofertas, produtos, services }: { ofertas: ReturnType<typeof useOfertas>; produtos: ReturnType<typeof useProdutos>; services: ReturnType<typeof useServicesList> }) {
  const [form, setForm] = useState({ nome: "", servicoId: "", produtoIds: [] as string[], desconto: 0, observacao: "" });
  const toggleProduto = (id: string) => setForm((f) => ({ ...f, produtoIds: f.produtoIds.includes(id) ? f.produtoIds.filter((x) => x !== id) : [...f.produtoIds, id] }));
  const submit = () => {
    if (!form.nome.trim()) return toast.error("Nome da oferta é obrigatório");
    upsertOferta({ ...form, ativa: true });
    toast.success("Oferta salva");
    setForm({ nome: "", servicoId: "", produtoIds: [], desconto: 0, observacao: "" });
  };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Plus className="h-4 w-4" /> Nova oferta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" className="h-9 px-2 rounded-md border border-input bg-background text-sm" />
          <select value={form.servicoId} onChange={(e) => setForm({ ...form, servicoId: e.target.value })} className="h-9 px-2 rounded-md border border-input bg-background text-sm">
            <option value="">Serviço (opcional)</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
          <input type="number" value={form.desconto} onChange={(e) => setForm({ ...form, desconto: parseFloat(e.target.value) || 0 })} placeholder="Desconto %" className="h-9 px-2 rounded-md border border-input bg-background text-sm" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Produtos inclusos:</div>
          <div className="flex gap-1.5 flex-wrap">
            {produtos.map((p) => (
              <button key={p.id} onClick={() => toggleProduto(p.id)} className={`text-xs px-2 py-1 rounded-full border ${form.produtoIds.includes(p.id) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>
                {p.nome}
              </button>
            ))}
          </div>
        </div>
        <input value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Observação" className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm" />
        <button onClick={submit} className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Adicionar</button>
      </div>
      <div className="space-y-2">
        {ofertas.map((o) => (
          <div key={o.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-foreground">{o.nome}</div>
                <div className="text-xs text-muted-foreground">{o.observacao}</div>
                <div className="text-xs text-muted-foreground mt-1">Produtos: {o.produtoIds.map((id) => produtos.find((p) => p.id === id)?.nome).filter(Boolean).join(", ") || "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">-{o.desconto}%</span>
                <button onClick={() => removeOferta(o.id)} className="text-red-600 hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
