import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useLead, useCompany, useContact, useUsers, useActivities, useAddNote, useConversations, useMessages, useSendMessage } from "@/repositories/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { STAGE_MAP } from "@/domain/constants";
import { ArrowLeft, Building2, Mail, Phone, MessageCircle, Send, StickyNote, User2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  head: () => ({ meta: [{ title: "Detalhe do Lead — WF Digital CRM" }] }),
  component: LeadDetail,
});

function LeadDetail() {
  const { leadId } = useParams({ from: "/_authenticated/leads/$leadId" });
  const { session } = useAuth();
  const { data: lead } = useLead(leadId);
  const { data: company } = useCompany(lead?.companyId);
  const { data: contact } = useContact(lead?.contactId);
  const { data: users = [] } = useUsers();
  const { data: activities = [] } = useActivities();
  const { data: conversations = [] } = useConversations();
  const conv = conversations.find((c) => c.primaryLeadId === leadId);
  const { data: msgs = [] } = useMessages(conv?.id);
  const send = useSendMessage();
  const addNote = useAddNote();
  const [tab, setTab] = useState<"timeline" | "chat" | "notas">("timeline");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState("");

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const leadActs = useMemo(
    () => activities.filter((a) => a.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, leadId],
  );

  if (!lead || !company) {
    return (
      <AppShell title="Lead">
        <div className="text-sm text-muted-foreground">Lead não encontrado.</div>
      </AppShell>
    );
  }

  return (
    <AppShell title={company.nomeFantasia ?? company.razaoSocial} subtitle={STAGE_MAP[lead.stage].label}>
      <Link to="/leads" className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar aos leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <aside className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 text-[13px] font-semibold"><Building2 className="h-4 w-4 text-primary" /> Empresa</div>
            <div className="mt-2 text-[13px]">{company.razaoSocial}</div>
            <div className="text-[11px] text-muted-foreground">{company.cnpj} · {company.segmento}</div>
            <div className="text-[11px] text-muted-foreground">{company.cidade}/{company.uf}</div>
          </div>
          {contact && (
            <div className="border-t border-border pt-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold"><User2 className="h-4 w-4 text-primary" /> Contato</div>
              <div className="mt-2 text-[13px]">{contact.nome} <span className="text-muted-foreground text-[11px]">· {contact.cargo}</span></div>
              {contact.email && <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"><Mail className="h-3 w-3" /> {contact.email}</div>}
              {contact.telefone && <div className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.telefone}</div>}
            </div>
          )}
          <div className="border-t border-border pt-3 space-y-1.5 text-[12px]">
            <Row l="Etapa" v={STAGE_MAP[lead.stage].label} />
            <Row l="Temperatura" v={<span className="capitalize">{lead.temperature}</span>} />
            <Row l="Score" v={lead.score} />
            <Row l="Valor estimado" v={lead.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
            <Row l="Responsável" v={userMap[lead.ownerId]?.name ?? "—"} />
            <Row l="Origem" v={lead.source} />
          </div>
        </aside>

        <section className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="flex gap-1 p-2 border-b border-border">
            {(["timeline", "chat", "notas"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 h-8 rounded-md text-[13px] capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "timeline" ? "Timeline" : t === "chat" ? "Chat WhatsApp" : "Notas"}
              </button>
            ))}
          </div>

          {tab === "timeline" && (
            <div className="p-4">
              {leadActs.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg py-10 text-center text-muted-foreground text-[13px]">
                  Sem atividades ainda.
                </div>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {leadActs.map((a) => (
                    <li key={a.id} className="ml-4">
                      <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-primary" />
                      <div className="text-[12px] text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString("pt-BR")} · {userMap[a.authorId]?.name.split(" ")[0]} · <span className="capitalize">{a.type.replace("_", " ")}</span>
                      </div>
                      <div className="text-[13px] text-foreground">{a.content}</div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {tab === "chat" && (
            <div className="p-4">
              {!conv ? (
                <div className="border-2 border-dashed border-border rounded-lg py-10 text-center text-muted-foreground text-[13px]">
                  Nenhuma conversa iniciada. Abra o WhatsApp na central de atendimento.
                </div>
              ) : (
                <>
                  <div className="h-[380px] overflow-y-auto space-y-2 mb-3 bg-muted/30 rounded-lg p-3">
                    {msgs.map((m) => (
                      <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-[13px] ${m.direction === "out" ? "ml-auto bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                        <div>{m.content}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!msg.trim()) return;
                      send.mutate({ conversationId: conv.id, authorId: session!.user.id, content: msg });
                      setMsg("");
                    }}
                  >
                    <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escrever mensagem…" className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
                    <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1.5 hover:bg-primary-strong">
                      <Send className="h-4 w-4" /> Enviar
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {tab === "notas" && (
            <div className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  addNote.mutate({ leadId, authorId: session!.user.id, content: note });
                  setNote("");
                  toast.success("Nota adicionada");
                }}
                className="mb-4"
              >
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escreva uma nota interna…" rows={3} className="w-full rounded-lg border border-input bg-background text-sm p-2.5 outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex justify-end mt-2">
                  <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-primary-strong">
                    <StickyNote className="h-4 w-4" /> Adicionar nota
                  </button>
                </div>
              </form>
              <div className="space-y-2">
                {leadActs.filter((a) => a.type === "nota").map((n) => (
                  <div key={n.id} className="bg-muted/40 rounded-lg p-3">
                    <div className="text-[11px] text-muted-foreground mb-1">{userMap[n.authorId]?.name} · {new Date(n.createdAt).toLocaleString("pt-BR")}</div>
                    <div className="text-[13px]">{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-medium text-foreground">{v}</span>
    </div>
  );
}
