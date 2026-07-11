import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import { AppShell } from "@/app/AppShell";
import {
  companyProfile,
  sdrPolicies,
  services,
  addHandoff,
  addSdrDraft,
  DEFAULT_SDR_MODE,
} from "@/domain/sdrVirtual";
import { toast } from "sonner";
import { runSdrTurn, type SdrReply, type SdrState } from "@/domain/sdrEngine";
import {
  Bot, User, Send, ShieldCheck, AlertTriangle, ArrowRightLeft,
  Sparkles, RotateCcw, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/simulador")({
  head: () => ({ meta: [{ title: "Simulador SDR — WF Digital" }] }),
  component: SimuladorPage,
});

interface ChatMsg {
  id: string;
  role: "lead" | "sdr" | "system";
  text: string;
  reply?: SdrReply;
  at: string;
}

const SUGESTOES = [
  "Olá, tudo bem?",
  "Quanto custa um sistema?",
  "Preciso de um site novo",
  "Quero uma reunião com um vendedor",
  "Vocês fazem contabilidade?",
  "Não quero receber mensagens",
];

function SimuladorPage() {
  const [leadName, setLeadName] = useState("Ana Ribeiro");
  const [companyName, setCompanyName] = useState("Padaria Trigo Dourado");
  const [state, setState] = useState<SdrState>("GREETING");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "m-0",
      role: "system",
      text: `Sandbox demonstrativo. O SDR "${companyProfile.nomeFantasia}" responde com regras determinísticas usando base de conhecimento, políticas e catálogo de serviços. Nenhuma mensagem real é enviada.`,
      at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [handoffCreated, setHandoffCreated] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastReply = useMemo(
    () => [...messages].reverse().find((m) => m.role === "sdr")?.reply,
    [messages],
  );

  function sendUser(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const turn = messages.filter((m) => m.role === "lead").length + 1;
    const userMsg: ChatMsg = {
      id: `m-u-${Date.now()}`,
      role: "lead",
      text: trimmed,
      at: new Date().toISOString(),
    };
    const reply = runSdrTurn(trimmed, { turn, state, leadName, companyName });
    const sdrMsg: ChatMsg = {
      id: `m-s-${Date.now() + 1}`,
      role: "sdr",
      text: reply.text,
      reply,
      at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg, sdrMsg]);
    setState(reply.nextState);
    setInput("");
  }

  function reset() {
    setMessages([
      {
        id: `m-r-${Date.now()}`,
        role: "system",
        text: "Conversa reiniciada.",
        at: new Date().toISOString(),
      },
    ]);
    setState("GREETING");
    setHandoffCreated(null);
  }

  function gerarHandoff() {
    if (!lastReply?.suggestedHandoff) return;
    const sh = lastReply.suggestedHandoff;
    const service = services.find((s) => s.id === lastReply.serviceId) ?? services[0];
    const novo = addHandoff({
      leadId: `sim-${Date.now()}`,
      empresa: companyName,
      contato: leadName,
      servicoId: service.id,
      motivo: sh.motivo,
      necessidade: sh.resumo,
      urgencia: sh.urgencia,
      fit: sh.fit,
      intent: sh.intent,
      engagement: 70,
      heat: sh.heat,
      vendedorSugerido: companyProfile.responsavelHandoff,
      sla: companyProfile.slaVendedor,
      prioridade: sh.urgencia,
      status: "Aguardando vendedor",
      resumoConversa: messages
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role === "lead" ? leadName : "SDR"}: ${m.text}`)
        .join("\n"),
    });
    setHandoffCreated(novo.id);
  }

  return (
    <AppShell
      title="Simulador SDR Virtual"
      subtitle="Teste o cérebro configurado: tom, base de conhecimento e guardrails"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Chat */}
        <div className="rounded-xl border border-border bg-card flex flex-col min-h-[560px]">
          {/* Header */}
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">SDR {companyProfile.nomeFantasia}</div>
              <div className="text-xs text-muted-foreground">
                Modo <b>{sdrPolicies.modo}</b> · Estado <span className="font-mono">{state}</span>
              </div>
            </div>
            <button
              onClick={reset}
              className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
            </button>
          </div>

          {/* Lead identity */}
          <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-muted-foreground">Lead:</span>
            <input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs w-32"
              aria-label="Nome do lead"
            />
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="px-2 py-1 rounded border border-border bg-background text-foreground text-xs flex-1 min-w-[160px]"
              aria-label="Empresa do lead"
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              if (m.role === "system") {
                return (
                  <div key={m.id} className="text-[11px] text-muted-foreground text-center py-1">
                    {m.text}
                  </div>
                );
              }
              const isLead = m.role === "lead";
              return (
                <div key={m.id} className={`flex gap-2 ${isLead ? "justify-end" : "justify-start"}`}>
                  {!isLead && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                      isLead
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                    {m.reply && m.reply.guardrails.length > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-border/60 flex flex-wrap gap-1">
                        {m.reply.guardrails.map((g, i) => (
                          <span
                            key={i}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              g.severity === "block"
                                ? "bg-red-100 text-red-700"
                                : g.severity === "warn"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                            title={g.detail}
                          >
                            {g.rule}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isLead && (
                    <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground grid place-items-center shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Sugestões */}
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                onClick={() => sendUser(s)}
                className="text-[11px] px-2 py-1 rounded-full border border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendUser(input);
            }}
            className="p-3 border-t border-border flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite como se fosse o lead..."
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Mensagem do lead"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" /> Enviar
            </button>
          </form>
        </div>

        {/* Painel lateral */}
        <div className="space-y-3">
          {/* Última análise */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <Sparkles className="h-4 w-4 text-primary" /> Análise do turno
            </h3>
            {lastReply ? (
              <div className="space-y-2.5 text-xs">
                <Row label="Fonte" value={lastReply.source} />
                <Row
                  label="Confiança"
                  value={
                    <span
                      className={
                        lastReply.confidence >= sdrPolicies.confiancaMinima
                          ? "text-emerald-600 font-semibold"
                          : "text-amber-600 font-semibold"
                      }
                    >
                      {(lastReply.confidence * 100).toFixed(0)}%
                    </span>
                  }
                />
                <Row label="Exige humano" value={lastReply.requiresHuman ? "Sim" : "Não"} />
                <Row label="Próximo estado" value={<span className="font-mono">{lastReply.nextState}</span>} />
                {lastReply.knowledgeId && <Row label="KB" value={lastReply.knowledgeId} />}
                {lastReply.serviceId && (
                  <Row
                    label="Serviço"
                    value={services.find((s) => s.id === lastReply.serviceId)?.nome ?? "-"}
                  />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Envie uma mensagem para ver a análise.</p>
            )}
          </div>

          {/* Handoff */}
          {lastReply?.suggestedHandoff && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" /> Handoff sugerido
              </h3>
              <div className="space-y-1.5 text-xs mb-3">
                <Row label="Motivo" value={lastReply.suggestedHandoff.motivo} />
                <Row label="Urgência" value={lastReply.suggestedHandoff.urgencia} />
                <Row label="Fit / Intent / Heat" value={`${lastReply.suggestedHandoff.fit} / ${lastReply.suggestedHandoff.intent} / ${lastReply.suggestedHandoff.heat}`} />
              </div>
              {handoffCreated ? (
                <div className="text-xs flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Handoff <b>{handoffCreated}</b> criado. Veja em <b>Handoffs</b>.
                </div>
              ) : (
                <button
                  onClick={gerarHandoff}
                  className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                >
                  Gerar handoff automático
                </button>
              )}
            </div>
          )}

          {/* Guardrails ativos */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Guardrails ativos
            </h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <Guard label="Sempre identificar como IA" on={sdrPolicies.sempreIdentificar} />
              <Guard label="Não inventar informações" on={sdrPolicies.naoInventar} />
              <Guard label="Não informar preço fechado" on={sdrPolicies.naoInformarPreco} />
              <Guard label="Não conceder desconto" on={sdrPolicies.naoConcederDesconto} />
              <Guard label="Encerrar em opt-out" on={sdrPolicies.encerrarEmOptOut} />
              <Guard label="Encaminhar em baixa confiança" on={sdrPolicies.encaminharBaixaConfianca} />
            </ul>
            <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              Confiança mínima: <b>{(sdrPolicies.confiancaMinima * 100).toFixed(0)}%</b>. Abaixo disso o SDR encaminha para humano.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function Guard({ label, on }: { label: string; on: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
      {label}
    </li>
  );
}
