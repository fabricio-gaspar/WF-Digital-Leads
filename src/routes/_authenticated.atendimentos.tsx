import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useConversations, useContacts, useCompanies, useUsers, useMessages, useSendMessage, useAssignConversation } from "@/repositories/hooks";
import { useAuth } from "@/auth/AuthProvider";
import { useMemo, useState } from "react";
import { Search, Send, UserPlus, Circle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/atendimentos")({
  head: () => ({ meta: [{ title: "Atendimentos — WF Digital CRM" }] }),
  component: SupportPage,
});

const statusColor: Record<string, string> = {
  aberta: "text-emerald-600",
  aguardando_cliente: "text-amber-600",
  aguardando_time: "text-blue-600",
  resolvida: "text-muted-foreground",
  bloqueada: "text-destructive",
};

function SupportPage() {
  const { session } = useAuth();
  const { data: conversations = [] } = useConversations();
  const { data: contacts = [] } = useContacts();
  const { data: companies = [] } = useCompanies();
  const { data: users = [] } = useUsers();
  const [selected, setSelected] = useState<string | null>(conversations[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"mine" | "queue" | "all">("mine");
  const [msg, setMsg] = useState("");

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const list = useMemo(() => {
    const uid = session!.user.id;
    return conversations
      .filter((c) => {
        if (tab === "mine") return c.currentOwnerId === uid;
        if (tab === "queue") return !c.currentOwnerId;
        return true;
      })
      .filter((c) => {
        if (!search) return true;
        const ct = contactMap[c.contactId];
        return ct?.nome.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
  }, [conversations, tab, search, session, contactMap]);

  const active = conversations.find((c) => c.id === selected) ?? list[0];
  const { data: msgs = [] } = useMessages(active?.id);
  const send = useSendMessage();
  const assign = useAssignConversation();

  const totals = {
    mine: conversations.filter((c) => c.currentOwnerId === session!.user.id).length,
    queue: conversations.filter((c) => !c.currentOwnerId).length,
    all: conversations.length,
  };

  return (
    <AppShell title="Central de Atendimentos" subtitle="Conversas de WhatsApp e canais integrados">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-180px)]">
        {/* Lista */}
        <aside className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar contato" className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-background w-full">
              {([["mine", `Meus (${totals.mine})`], ["queue", `Fila (${totals.queue})`], ["all", `Todos (${totals.all})`]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={`flex-1 h-7 rounded-md text-[12px] ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {list.length === 0 && (
              <div className="p-6 text-center text-[12px] text-muted-foreground">Nenhuma conversa nessa aba.</div>
            )}
            {list.map((c) => {
              const ct = contactMap[c.contactId];
              const co = c.companyId ? companyMap[c.companyId] : undefined;
              const isActive = active?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-border hover:bg-muted/40 ${isActive ? "bg-primary-soft/40" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center text-[11px] font-semibold shrink-0">
                      {ct?.nome.split(" ").slice(0, 2).map((p) => p[0]).join("") ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium truncate">{ct?.nome ?? "—"}</span>
                        {c.unreadCount > 0 && (
                          <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 min-w-[18px] text-center">{c.unreadCount}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{co?.nomeFantasia ?? co?.razaoSocial ?? c.channel}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Detalhe */}
        <section className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 grid place-items-center text-muted-foreground text-[13px]">Selecione uma conversa</div>
          ) : (
            <>
              <header className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-semibold">{contactMap[active.contactId]?.nome}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Circle className={`h-2 w-2 fill-current ${statusColor[active.status]}`} />
                    {active.status.replace("_", " ")} · {active.channel} · {active.currentOwnerId ? userMap[active.currentOwnerId]?.name.split(" ")[0] : "Sem responsável"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    assign.mutate({ conversationId: active.id, userId: session!.user.id, actorId: session!.user.id, reason: "Assumir atendimento" }, {
                      onSuccess: () => toast.success("Conversa atribuída a você"),
                    });
                  }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary-soft text-primary-strong text-[12px] font-medium hover:bg-primary hover:text-primary-foreground"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Assumir
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
                {msgs.map((m) => (
                  <div key={m.id} className={`max-w-[70%] rounded-lg px-3 py-2 text-[13px] ${m.direction === "out" ? "ml-auto bg-primary text-primary-foreground" : m.direction === "system" ? "mx-auto bg-muted text-muted-foreground text-[11px]" : "bg-card border border-border"}`}>
                    <div>{m.content}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                ))}
              </div>

              <form
                className="p-3 border-t border-border flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!msg.trim()) return;
                  send.mutate({ conversationId: active.id, authorId: session!.user.id, content: msg });
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
        </section>
      </div>
    </AppShell>
  );
}
