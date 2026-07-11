import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
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
