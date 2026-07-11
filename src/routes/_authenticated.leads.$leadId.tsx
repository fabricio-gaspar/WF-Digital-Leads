import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import {
  useLead,
  useCompany,
  useContact,
  useUsers,
  useActivities,
  useAddNote,
  useConversations,
  useMessages,
  useSendMessage,
  useTasks,
} from "@/repositories/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { LEAD_STAGES, STAGE_MAP, SOURCE_LABELS } from "@/domain/constants";
import type { LeadStageId } from "@/domain/types";
import { stores } from "@/repositories/demo";
import { useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Mail,
  MessageCircle,
  Plus,
  Save,
  X,
  Check,
  Flame,
  Send,
  Paperclip,
  ChevronDown,
  StickyNote,
  Clock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  head: () => ({ meta: [{ title: "Detalhe do Lead — WF Digital CRM" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = useParams({ from: "/_authenticated/leads/$leadId" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session } = useAuth();
  const { data: lead } = useLead(leadId);
  const { data: company } = useCompany(lead?.companyId);
  const { data: contact } = useContact(lead?.contactId);
  const { data: users = [] } = useUsers();
  const { data: activities = [] } = useActivities();
  const { data: tasks = [] } = useTasks();
  const { data: conversations = [] } = useConversations();
  const conv = conversations.find((c) => c.primaryLeadId === leadId);
  const { data: msgs = [] } = useMessages(conv?.id);
  const send = useSendMessage();
  const addNote = useAddNote();

  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const leadActs = useMemo(
    () => activities.filter((a) => a.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, leadId],
  );
  const openTasks = useMemo(
    () => tasks.filter((t) => t.leadId === leadId && t.status === "aberta"),
    [tasks, leadId],
  );

  if (!lead || !company) {
    return (
      <AppShell title="Lead">
        <div className="text-sm text-muted-foreground">Lead não encontrado.</div>
      </AppShell>
    );
  }

  const initials = (company.nomeFantasia ?? company.razaoSocial)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const currentStage = STAGE_MAP[lead.stage];
  const stageColor =
    lead.stage === "fechado"
      ? "bg-emerald-100 text-emerald-700"
      : lead.stage === "perdido"
        ? "bg-red-100 text-red-700"
        : lead.stage === "negociacao"
          ? "bg-emerald-600 text-white"
          : "bg-primary/10 text-primary";

  const tempColor =
    lead.temperature === "quente"
      ? "bg-orange-100 text-orange-700"
      : lead.temperature === "morno"
        ? "bg-amber-100 text-amber-700"
        : "bg-sky-100 text-sky-700";

  const owner = userMap[lead.ownerId];
  const diasNoFunil = Math.max(1, Math.round((Date.now() - new Date(lead.createdAt).getTime()) / 86_400_000));

  const changeStage = (id: LeadStageId) => {
    stores.leads.upsert({ ...lead, stage: id, updatedAt: new Date().toISOString() });
    stores.activities.upsert({
      id: `a-${Date.now()}`,
      leadId: lead.id,
      authorId: session!.user.id,
      type: "etapa_alterada",
      content: `Etapa alterada para ${STAGE_MAP[id].label}`,
      createdAt: new Date().toISOString(),
    });
    qc.invalidateQueries();
    toast.success(`Movido para ${STAGE_MAP[id].label}`);
  };

  return (
    <AppShell title="" subtitle="">
      <div className="max-w-[1400px] mx-auto">
        {/* HEADER */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-lg shrink-0">
              {initials || "??"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {company.nomeFantasia ?? company.razaoSocial}
                </h1>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${stageColor}`}>
                  • {currentStage.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${tempColor}`}>
                  <Flame className="h-3 w-3" /> {lead.temperature.charAt(0).toUpperCase() + lead.temperature.slice(1)}
                </span>
                <span className="text-[13px] text-muted-foreground">
                  {company.nomeFantasia ?? company.razaoSocial} · {company.segmento ?? "—"} · Responsável: {owner?.name ?? "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 max-w-xs h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${lead.score}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground">{lead.score}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
              <ActionBtn icon={Phone} label="Ligar" />
              <ActionBtn icon={Mail} label="E-mail" />
              <ActionBtn icon={MessageCircle} label="WhatsApp" />
              <ActionBtn icon={Plus} label="Nova tarefa" />
              <button className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-emerald-700">
                <Save className="h-4 w-4" /> Salvar
              </button>
              <button
                onClick={() => navigate({ to: "/leads" })}
                className="h-9 w-9 grid place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Stage stepper */}
          <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
            {LEAD_STAGES.map((s, i) => {
              const active = s.id === lead.stage;
              const done = LEAD_STAGES.findIndex((x) => x.id === lead.stage) > i;
              return (
                <div key={s.id} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => changeStage(s.id)}
                    className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : done
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : "border-border text-muted-foreground bg-background hover:text-foreground"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : s.id === "perdido" ? "bg-red-400" : "bg-muted-foreground/50"}`} />}
                    {s.label}
                  </button>
                  {i < LEAD_STAGES.length - 1 && <span className="text-muted-foreground/40 text-xs">—</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.4fr)_minmax(320px,1fr)] gap-4">
          {/* LEFT: EMPRESA + CONTATO */}
          <div className="space-y-4">
            <Card title="EMPRESA">
              <Field label="Razão social" value={company.razaoSocial} />
              <Field label="Nome fantasia" value={company.nomeFantasia} />
              <Field label="CNPJ" value={company.cnpj} />
              <Field label="Inscrição estadual" value={company.inscricaoEstadual} />
              <Field label="Segmento" value={company.segmento} />
              <Field label="CNAE" value={company.cnae} />
              <Field label="Porte" value={company.porte} />
              <Field label="Site" value={company.site} />
              <Field label="Endereço" value={company.endereco} />
              <Field label="Bairro" value={company.bairro} />
              <Field label="Cidade/UF" value={company.cidade && company.uf ? `${company.cidade}/${company.uf}` : undefined} />
              <Field label="CEP" value={company.cep} />
              <Field label="Origem" value={SOURCE_LABELS[lead.source] ?? lead.source} />
              <Field label="Data de entrada" value={new Date(lead.createdAt).toLocaleDateString("pt-BR")} />
              <Field label="Dias no funil" value={`${diasNoFunil} dias`} />
            </Card>

            {contact && (
              <Card title="CONTATO">
                <Field label="Nome" value={contact.nome} />
                <Field label="Cargo" value={contact.cargo} />
                <Field label="Telefone" value={contact.telefone} />
                <Field label="E-mail" value={contact.email} />
              </Card>
            )}
          </div>

          {/* MIDDLE: NOTA + TAREFAS + TIMELINE */}
          <div className="space-y-4">
            <Card title="ADICIONAR NOTA">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  addNote.mutate({ leadId, authorId: session!.user.id, content: note });
                  setNote("");
                  toast.success("Nota registrada");
                }}
                className="flex gap-2"
              >
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escreva uma nota e pressione Enter..."
                  className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="h-10 px-4 rounded-lg bg-muted text-foreground border border-border text-sm font-medium inline-flex items-center gap-1.5 hover:bg-muted/70">
                  <StickyNote className="h-4 w-4" /> Registrar
                </button>
              </form>
            </Card>

            <Card
              title={`TAREFAS (${openTasks.length} aberta${openTasks.length === 1 ? "" : "s"})`}
              action={
                <button className="text-[12px] px-2 h-7 rounded-md border border-border inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <Plus className="h-3 w-3" /> Nova
                </button>
              }
            >
              {openTasks.length === 0 ? (
                <div className="text-[13px] text-muted-foreground py-1">Nenhuma tarefa para este lead.</div>
              ) : (
                <ul className="space-y-1.5">
                  {openTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-[13px]">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 truncate">{t.title}</span>
                      <span className="text-[11px] text-muted-foreground">{new Date(t.dueAt).toLocaleDateString("pt-BR")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={`TIMELINE (${leadActs.length})`}>
              {leadActs.length === 0 ? (
                <div className="text-[13px] text-muted-foreground py-2">Sem atividades ainda.</div>
              ) : (
                <ul className="space-y-3">
                  {leadActs.map((a) => (
                    <li key={a.id} className="flex gap-3">
                      <div className="h-7 w-7 rounded-full bg-muted grid place-items-center shrink-0">
                        {a.type.startsWith("mensagem") ? (
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        ) : a.type === "nota" ? (
                          <StickyNote className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-foreground">{a.content}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(a.createdAt).toLocaleString("pt-BR")} · {userMap[a.authorId]?.name ?? "—"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* RIGHT: WHATSAPP */}
          <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden min-h-[600px]">
            <div className="px-4 py-3 border-b border-border bg-emerald-50/50 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center font-semibold text-sm shrink-0">
                {contact?.nome?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{contact?.nome ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {contact?.whatsapp ?? contact?.telefone ?? "—"} · último contato {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString("pt-BR") : "—"}
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">WhatsApp</span>
            </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-2"
              style={{
                backgroundColor: "#e5ded8",
                backgroundImage:
                  "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              <div className="text-center">
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-white/70 text-muted-foreground">
                  {new Date().toLocaleDateString("pt-BR")}
                </span>
              </div>
              {msgs.length === 0 ? (
                <div className="text-center text-[12px] text-muted-foreground py-6">
                  Nenhuma mensagem ainda.
                </div>
              ) : (
                msgs.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] shadow-sm ${
                      m.direction === "out"
                        ? "ml-auto bg-[#d9fdd3] text-foreground"
                        : "bg-white text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    <div className="text-[10px] text-muted-foreground text-right mt-0.5 inline-flex items-center gap-0.5 float-right">
                      {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {m.direction === "out" && <Check className="h-3 w-3" />}
                    </div>
                    <div className="clear-both" />
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-2 bg-card space-y-2">
              <button className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground">
                <Send className="h-3 w-3 rotate-45" /> Templates <ChevronDown className="h-3 w-3" />
              </button>
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!msg.trim() || !conv) {
                    if (!conv) toast.error("Nenhuma conversa aberta com este contato");
                    return;
                  }
                  send.mutate({ conversationId: conv.id, authorId: session!.user.id, content: msg });
                  setMsg("");
                }}
              >
                <button type="button" className="h-9 w-9 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Enter envia, Shift+Enter quebra linha"
                  className="flex-1 h-9 px-3 rounded-full border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button className="h-9 w-9 grid place-items-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="text-[10px] text-muted-foreground text-center">
                Último contato: {lead.lastContactAt ? new Date(lead.lastContactAt).toLocaleDateString("pt-BR") : "—"} · Conversa simulada — integração oficial pendente
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Link to="/leads" className="text-[13px] text-muted-foreground hover:text-foreground">
            ← Voltar aos leads
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-muted-foreground tracking-wider">{title}</h3>
        {action}
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-dashed border-border/50 last:border-0 text-[13px]">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right truncate">{value || "—"}</span>
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: typeof Phone; label: string }) {
  return (
    <button className="h-9 px-3 rounded-lg border border-border text-[13px] text-foreground inline-flex items-center gap-1.5 hover:bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" /> {label}
    </button>
  );
}
