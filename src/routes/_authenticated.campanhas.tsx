import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useCampaigns, campaignStore, type CampaignStatus } from "@/domain/campaigns";
import { useUsers } from "@/repositories/hooks";
import { Mail, MessageCircle, Phone, Linkedin, Play, Pause, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/campanhas")({
  head: () => ({ meta: [{ title: "Campanhas & Cadências — WF Digital CRM" }] }),
  component: CampaignsPage,
});

const channelIcon = { email: Mail, whatsapp: MessageCircle, telefone: Phone, linkedin: Linkedin } as const;

const statusStyle: Record<CampaignStatus, string> = {
  ativa: "bg-primary/10 text-primary",
  pausada: "bg-[color:var(--temp-morno)]/15 text-[color:var(--temp-morno)]",
  rascunho: "bg-muted text-muted-foreground",
  encerrada: "bg-destructive/10 text-destructive",
};

function CampaignsPage() {
  const { data: campaigns = [] } = useCampaigns();
  const { data: users = [] } = useUsers();
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const [activeId, setActiveId] = useState<string | null>(campaigns[0]?.id ?? null);
  const active = campaigns.find((c) => c.id === activeId) ?? campaigns[0];

  const totals = campaigns.reduce(
    (acc, c) => {
      acc.audience += c.audienceSize; acc.sent += c.sent; acc.responses += c.responses; acc.meetings += c.meetings; acc.wins += c.wins;
      return acc;
    },
    { audience: 0, sent: 0, responses: 0, meetings: 0, wins: 0 },
  );

  return (
    <AppShell
      title="Campanhas & Cadências"
      subtitle="Fluxos multicanal para prospecção ativa"
      actions={
        <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-strong inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Nova campanha
        </button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {[
          { l: "Público total", v: totals.audience },
          { l: "Enviados", v: totals.sent },
          { l: "Respostas", v: totals.responses },
          { l: "Reuniões", v: totals.meetings },
          { l: "Fechados", v: totals.wins },
        ].map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-lg px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground">{k.l}</div>
            <div className="text-[15px] font-semibold tabular-nums">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-4">
        <div className="space-y-2">
          {campaigns.map((c) => {
            const isActive = c.id === active?.id;
            const responseRate = c.sent ? Math.round((c.responses / c.sent) * 100) : 0;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left bg-card border rounded-xl p-3 transition-colors ${isActive ? "border-primary/60 ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-[13px] font-semibold truncate">{c.name}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusStyle[c.status]}`}>{c.status}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{c.objective}</div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{c.audienceSize} contatos</span>
                  <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {responseRate}% resposta</span>
                </div>
              </button>
            );
          })}
        </div>

        {active && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-[17px] font-semibold">{active.name}</div>
                <div className="text-[12px] text-muted-foreground">{active.objective}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Responsável: {userMap[active.ownerId]?.name ?? "—"}</div>
              </div>
              <button
                onClick={() => campaignStore.toggleStatus(active.id)}
                disabled={active.status === "rascunho" || active.status === "encerrada"}
                className="h-9 px-3 rounded-lg border border-border text-[13px] inline-flex items-center gap-1.5 hover:bg-muted disabled:opacity-50"
              >
                {active.status === "ativa" ? <><Pause className="h-3.5 w-3.5" /> Pausar</> : <><Play className="h-3.5 w-3.5" /> Ativar</>}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { l: "Enviados", v: active.sent },
                { l: "Respostas", v: active.responses },
                { l: "Reuniões", v: active.meetings },
                { l: "Fechados", v: active.wins },
              ].map((k) => (
                <div key={k.l} className="rounded-lg bg-background border border-border px-3 py-2">
                  <div className="text-[10px] text-muted-foreground uppercase">{k.l}</div>
                  <div className="text-[15px] font-semibold tabular-nums">{k.v}</div>
                </div>
              ))}
            </div>

            <div className="text-[12px] font-semibold uppercase text-muted-foreground mb-2">Cadência ({active.steps.length} passos)</div>
            <ol className="space-y-2">
              {active.steps.map((s) => {
                const Icon = channelIcon[s.channel];
                return (
                  <li key={s.id} className="border border-border rounded-lg p-3 flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[11px] font-medium text-muted-foreground">Passo {s.order} · D+{s.delayDays}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted capitalize">{s.channel}</span>
                      </div>
                      <div className="text-[13px] font-medium">{s.title}</div>
                      <div className="text-[12px] text-muted-foreground mt-1 italic">"{s.templateSnippet}"</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </AppShell>
  );
}
