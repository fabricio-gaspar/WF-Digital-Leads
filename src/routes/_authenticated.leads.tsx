import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useMemo, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, DragOverlay, useDroppable, useDraggable } from "@dnd-kit/core";
import { useLeads, useMoveLeadStage, useCompanies, useContacts, useUsers } from "@/repositories/hooks";
import { LEAD_STAGES, STAGE_MAP } from "@/domain/constants";
import type { Lead, LeadStageId } from "@/domain/types";
import { Plus, LayoutGrid, List as ListIcon, Search } from "lucide-react";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — WF Digital CRM" }] }),
  component: LeadsPage,
});

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function daysInFunnel(l: Lead) {
  return Math.floor((Date.now() - new Date(l.createdAt).getTime()) / (24 * 3600 * 1000));
}

function tempClass(t: string) {
  if (t === "quente") return "bg-destructive/10 text-destructive";
  if (t === "morno") return "bg-[color:var(--temp-morno)]/15 text-[color:var(--temp-morno)]";
  return "bg-[color:var(--temp-frio)]/15 text-[color:var(--temp-frio)]";
}

function LeadsPage() {
  const { session } = useAuth();
  const { data: leads = [] } = useLeads();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const { data: users = [] } = useUsers();
  const move = useMoveLeadStage();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));
  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const filtered = useMemo(
    () =>
      leads.filter((l) => {
        if (!search) return true;
        const c = companyMap[l.companyId];
        const ct = l.contactId ? contactMap[l.contactId] : undefined;
        const q = search.toLowerCase();
        return (
          c?.razaoSocial.toLowerCase().includes(q) ||
          c?.nomeFantasia?.toLowerCase().includes(q) ||
          ct?.nome.toLowerCase().includes(q) ||
          c?.cnpj?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          false
        );
      }),
    [leads, search, companyMap, contactMap],
  );

  const byStage = useMemo(() => {
    const m: Record<LeadStageId, Lead[]> = {} as never;
    LEAD_STAGES.forEach((s) => (m[s.id] = []));
    filtered.forEach((l) => m[l.stage].push(l));
    return m;
  }, [filtered]);

  const kpi = useMemo(() => {
    const open = leads.filter((l) => l.stage !== "fechado" && l.stage !== "perdido");
    return {
      total: leads.length,
      hot: leads.filter((l) => l.temperature === "quente" && l.stage !== "fechado").length,
      noContact: leads.filter((l) => !l.lastContactAt && l.stage !== "fechado").length,
      forecast: open.reduce((s, l) => s + l.estimatedValue * STAGE_MAP[l.stage].probability, 0),
      closed: leads.filter((l) => l.stage === "fechado").reduce((s, l) => s + (l.closedValue ?? l.estimatedValue), 0),
      response: 0.62,
    };
  }, [leads]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const leadId = e.active.id as string;
    const newStage = e.over?.id as LeadStageId | undefined;
    if (!newStage) return;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    if (newStage === "fechado") {
      const raw = window.prompt(`Valor final da venda (R$) — estimado ${lead.estimatedValue}:`, String(lead.estimatedValue));
      if (raw === null) return;
      const val = Number(raw.replace(/[^\d.]/g, ""));
      if (!Number.isFinite(val) || val <= 0) return toast.error("Valor inválido");
      move.mutate({ leadId, stage: newStage, actorId: session!.user.id, closedValue: val }, {
        onSuccess: () => toast.success("Lead marcado como Fechado"),
      });
      return;
    }
    if (newStage === "perdido") {
      const reason = window.prompt("Motivo da perda:");
      if (!reason) return toast.error("Motivo obrigatório");
      move.mutate({ leadId, stage: newStage, actorId: session!.user.id, lossReason: reason }, {
        onSuccess: () => toast.success("Lead marcado como Perdido"),
      });
      return;
    }
    move.mutate({ leadId, stage: newStage, actorId: session!.user.id }, {
      onSuccess: () => toast.success(`Movido para ${STAGE_MAP[newStage].label}`),
    });
  }

  return (
    <AppShell title="Leads" subtitle="Pipeline de leads e contato por WhatsApp">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
        {[
          { l: "Total", v: kpi.total },
          { l: "Quentes", v: kpi.hot },
          { l: "Taxa resposta", v: `${Math.round(kpi.response * 100)}%` },
          { l: "Previsão", v: currency(kpi.forecast) },
          { l: "Sem contato", v: kpi.noContact },
          { l: "Fechados", v: currency(kpi.closed) },
        ].map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-lg px-3 py-2.5">
            <div className="text-[11px] text-muted-foreground">{k.l}</div>
            <div className="text-[15px] font-semibold">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-background">
          <button
            onClick={() => setView("kanban")}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] ${view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            onClick={() => setView("lista")}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[13px] ${view === "lista" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            <ListIcon className="h-3.5 w-3.5" /> Lista
          </button>
        </div>
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, contato, CNPJ ou telefone"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-strong inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Novo Lead
        </button>
      </div>

      {view === "kanban" ? (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {LEAD_STAGES.map((stage) => {
              const items = byStage[stage.id];
              const total = items.reduce((s, l) => s + l.estimatedValue, 0);
              return (
                <KanbanColumn key={stage.id} stageId={stage.id} label={stage.label} count={items.length} total={total} colorVar={stage.colorVar}>
                  {items.map((l) => (
                    <LeadCard key={l.id} lead={l} company={companyMap[l.companyId]} contact={l.contactId ? contactMap[l.contactId] : undefined} owner={userMap[l.ownerId]} />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>
          <DragOverlay>
            {activeId && (() => {
              const l = leads.find((x) => x.id === activeId);
              return l ? <LeadCard lead={l} company={companyMap[l.companyId]} contact={l.contactId ? contactMap[l.contactId] : undefined} owner={userMap[l.ownerId]} dragging /> : null;
            })()}
          </DragOverlay>
        </DndContext>
      ) : (
        <ListView leads={filtered} companyMap={companyMap} contactMap={contactMap} userMap={userMap} />
      )}
    </AppShell>
  );
}

function KanbanColumn({ stageId, label, count, total, colorVar, children }: { stageId: LeadStageId; label: string; count: number; total: number; colorVar: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  return (
    <div className="w-[280px] shrink-0">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="h-1" style={{ background: `var(${colorVar})` }} />
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="text-[13px] font-semibold text-foreground">{label}</div>
          <div className="text-[11px] text-muted-foreground">
            {count} · {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`mt-2 min-h-[400px] rounded-lg p-1.5 space-y-2 transition-colors ${isOver ? "bg-primary-soft/40" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}

function LeadCard({ lead, company, contact, owner, dragging }: { lead: Lead; company: any; contact: any; owner: any; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-primary/40 transition-colors ${isDragging || dragging ? "opacity-70" : ""}`}>
      <Link to="/leads/$leadId" params={{ leadId: lead.id }} className="block">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-foreground truncate">{company?.nomeFantasia ?? company?.razaoSocial}</div>
            <div className="text-[11px] text-muted-foreground truncate">{contact?.nome ?? "Sem contato"}</div>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${tempClass(lead.temperature)} capitalize`}>{lead.temperature}</span>
        </div>
        <div className="text-[11px] text-muted-foreground mb-2 truncate">
          {company?.segmento} · {company?.cidade}/{company?.uf}
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
            <span>Score</span><span className="font-medium text-foreground">{lead.score}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${lead.score}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold text-foreground">{lead.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</div>
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary grid place-items-center text-[9px] font-semibold">
              {owner?.avatarInitials}
            </div>
            <span className="text-[10px] text-muted-foreground">{daysInFunnel(lead)}d</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

function ListView({ leads, companyMap, contactMap, userMap }: any) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2.5">Empresa</th>
            <th className="text-left px-3 py-2.5">Contato</th>
            <th className="text-left px-3 py-2.5">Responsável</th>
            <th className="text-left px-3 py-2.5">Etapa</th>
            <th className="text-left px-3 py-2.5">Temp.</th>
            <th className="text-right px-3 py-2.5">Score</th>
            <th className="text-right px-3 py-2.5">Valor</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l: Lead) => {
            const c = companyMap[l.companyId];
            const ct = l.contactId ? contactMap[l.contactId] : undefined;
            const own = userMap[l.ownerId];
            return (
              <tr key={l.id} className="border-t border-border hover:bg-muted/40">
                <td className="px-3 py-2.5"><Link to="/leads/$leadId" params={{ leadId: l.id }} className="font-medium hover:text-primary">{c?.nomeFantasia ?? c?.razaoSocial}</Link></td>
                <td className="px-3 py-2.5 text-muted-foreground">{ct?.nome ?? "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{own?.name.split(" ")[0]}</td>
                <td className="px-3 py-2.5"><span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">{STAGE_MAP[l.stage].label}</span></td>
                <td className="px-3 py-2.5"><span className={`text-[10px] px-1.5 py-0.5 rounded ${tempClass(l.temperature)} capitalize`}>{l.temperature}</span></td>
                <td className="px-3 py-2.5 text-right font-medium">{l.score}</td>
                <td className="px-3 py-2.5 text-right font-medium">{l.estimatedValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
