import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Leads — WF Digital CRM" }] }),
  component: LeadsPage,
});

type Temp = "quente" | "morno" | "frio" | "vencido" | "pago";
type Card = {
  id: string;
  empresa: string;
  contato: string;
  segmento: string;
  uf: string;
  score: number;
  valor: string;
  temp: Temp;
  atende: string;
  atendeTipo: "ia" | "humano";
  info?: string;
  infoTag?: "escalado" | "vence" | "pedido" | "parado" | "vencido" | "pronto";
};

type Coluna = { key: string; label: string; total: string; cards: Card[]; accent?: string };

const COLUNAS: Coluna[] = [
  {
    key: "prospeccao", label: "Prospecção", total: "R$ 27.500",
    cards: [
      { id: "1", empresa: "Sorriso Prime", contato: "Dra. Camila Freitas", segmento: "Saúde e Odontologia", uf: "SP", score: 64, valor: "R$ 9,5k", temp: "morno", atende: "Ana", atendeTipo: "ia", info: "últ. hoje" },
      { id: "2", empresa: "Rota Sul Cargas", contato: "Anderson Prado", segmento: "Logística", uf: "SP", score: 52, valor: "R$ 18k", temp: "frio", atende: "CS Carlos", atendeTipo: "humano", info: "3d parado", infoTag: "parado" },
    ],
  },
  {
    key: "qualificado", label: "Qualificado", total: "R$ 82.000",
    cards: [
      { id: "3", empresa: "Alicerce Forte", contato: "Renata Vilela", segmento: "Construção Civil", uf: "BH", score: 78, valor: "R$ 42k", temp: "quente", atende: "MV Marina", atendeTipo: "humano", info: "7 dias" },
      { id: "4", empresa: "TechFrota", contato: "Rafael Menezes", segmento: "Rastreamento", uf: "SP", score: 75, valor: "R$ 20k", temp: "morno", atende: "Ana", atendeTipo: "ia", info: "sugestão pronta", infoTag: "pronto" },
      { id: "5", empresa: "Corpo em Movimento", contato: "Luana Castro", segmento: "Fitness", uf: "GO", score: 68, valor: "R$ 15k", temp: "morno", atende: "Ana", atendeTipo: "ia", info: "2 dias" },
    ],
  },
  {
    key: "proposta", label: "Proposta", total: "R$ 53.000", accent: "border-t-[3px] border-t-amber-400",
    cards: [
      { id: "6", empresa: "Sabor Mineiro", contato: "José Ricardo", segmento: "Atacado", uf: "MG", score: 84, valor: "R$ 38k", temp: "quente", atende: "Ana", atendeTipo: "ia", info: "escalado", infoTag: "escalado" },
      { id: "7", empresa: "Ápice Contábil", contato: "Eduardo Barros", segmento: "Contábil", uf: "PR", score: 80, valor: "R$ 15k", temp: "quente", atende: "MV Marina", atendeTipo: "humano", info: "vence hoje", infoTag: "vence" },
    ],
  },
  {
    key: "negociacao", label: "Negociação", total: "R$ 117.000",
    cards: [
      { id: "8", empresa: "Aço Vale", contato: "Marcos Tavares", segmento: "Metalúrgica", uf: "SC", score: 91, valor: "R$ 65k", temp: "quente", atende: "Ana", atendeTipo: "ia", info: "escalado", infoTag: "escalado" },
      { id: "9", empresa: "Semente Ouro", contato: "Gilmar Furtado", segmento: "Agronegócio", uf: "RO", score: 87, valor: "R$ 52k", temp: "quente", atende: "RK Roberto", atendeTipo: "humano", info: "5h" },
    ],
  },
  {
    key: "fechado", label: "Fechado", total: "R$ 72.000",
    cards: [
      { id: "10", empresa: "Ápice Contábil", contato: "Eduardo Barros", segmento: "Contábil", uf: "PR", score: 95, valor: "R$ 24k", temp: "quente", atende: "MV Marina", atendeTipo: "humano", info: "pedido", infoTag: "pedido" },
      { id: "11", empresa: "Farmácias Vida Plena", contato: "Sandra Meireles", segmento: "Varejo", uf: "RJ", score: 92, valor: "R$ 31k", temp: "quente", atende: "Ana", atendeTipo: "ia", info: "pedido", infoTag: "pedido" },
    ],
  },
  {
    key: "pedido", label: "Pedido", total: "R$ 125.680",
    cards: [
      { id: "12", empresa: "Semente Ouro", contato: "Sistema de gestão", segmento: "Em execução · 40%", uf: "", score: 0, valor: "R$ 48k", temp: "pago", atende: "RK Roberto", atendeTipo: "humano", info: "#2026-043" },
      { id: "13", empresa: "Vida Plena", contato: "Automação · 12 meses", segmento: "Boleto vencido há 3d", uf: "", score: 0, valor: "R$ 31k", temp: "vencido", atende: "Ana", atendeTipo: "ia", info: "#2026-042", infoTag: "vencido" },
    ],
  },
];

function LeadsPage() {
  const [view, setView] = useState<"kanban" | "detalhe">("kanban");

  return (
    <AppShell title="Leads" subtitle="Pipeline de leads e contato por WhatsApp">
      <div className="mb-5 inline-flex bg-card border border-border rounded-lg p-1">
        <button
          onClick={() => setView("kanban")}
          className={cn(
            "px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors",
            view === "kanban" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Kanban
        </button>
        <Link
          to="/leads/$leadId"
          params={{ leadId: "aco-vale" }}
          className="px-4 py-1.5 rounded-md text-[13px] font-semibold text-muted-foreground hover:text-foreground"
        >
          Detalhe do lead
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <Kpi icon="👥" label="Total de leads" value="12" />
        <Kpi icon="🔥" label="Leads quentes" value="4" />
        <Kpi icon="◆" label="Com a IA" value="6" iconClass="text-primary" />
        <Kpi icon="›" label="Com humanos" value="5" />
        <Kpi icon="⏱" label="Parados +48h" value="2" highlight />
        <Kpi icon="↗" label="Previsão" value="R$ 153,6k" />
      </div>

      <div className="rounded-xl border border-border bg-card p-3 mb-5 flex flex-wrap items-center gap-2">
        <input placeholder="Buscar por empresa, contato, CNPJ ou telefone..." className="flex-1 min-w-[240px] h-10 px-3 rounded-md border border-input bg-background text-[13px]" />
        <select className="h-10 px-3 rounded-md border border-input bg-background text-[13px]"><option>Atendido por: todos</option></select>
        <select className="h-10 px-3 rounded-md border border-input bg-background text-[13px]"><option>Vendedor: todos</option></select>
        <select className="h-10 px-3 rounded-md border border-input bg-background text-[13px]"><option>Origem: todas</option></select>
        <select className="h-10 px-3 rounded-md border border-input bg-background text-[13px]"><option>Temperatura: todas</option></select>
        <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90">+ Novo lead</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {COLUNAS.map((c) => (
          <div key={c.key} className={cn("rounded-xl border border-border bg-card min-h-[300px]", c.accent)}>
            <div className="px-3.5 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-foreground">{c.label}</span>
                <span className="text-[11px] text-muted-foreground">{c.cards.length}</span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{c.total}</div>
            </div>
            <div className="p-2.5 space-y-2.5">
              {c.cards.map((card) => <LeadCard key={card.id} c={card} />)}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed max-w-3xl">
        Acréscimos ao Kanban original: coluna <strong className="text-foreground">Pedido</strong> (o funil agora fecha o ciclo), badge de <strong className="text-foreground">quem atende</strong> em cada card (◆ IA ou › humano), alerta de <strong className="text-foreground">SLA</strong> nos leads parados, cards escalados destacados em laranja e <strong className="text-foreground">motivo de perda</strong> obrigatório na coluna Perdido.
      </p>
    </AppShell>
  );
}

function LeadCard({ c }: { c: Card }) {
  const tempCfg: Record<Temp, { label: string; cls: string }> = {
    quente: { label: "Quente", cls: "bg-orange-100 text-orange-700" },
    morno: { label: "Morno", cls: "bg-amber-100 text-amber-700" },
    frio: { label: "Frio", cls: "bg-sky-100 text-sky-700" },
    pago: { label: "Pago", cls: "bg-primary/10 text-primary" },
    vencido: { label: "Vencido", cls: "bg-red-100 text-red-700" },
  };
  const infoCfg = c.infoTag && {
    escalado: "text-red-600",
    vence: "text-amber-700",
    pedido: "text-primary",
    parado: "text-orange-700",
    vencido: "text-red-600",
    pronto: "text-primary",
  }[c.infoTag];

  return (
    <Link
      to="/leads/$leadId"
      params={{ leadId: c.id }}
      className="block rounded-lg border border-border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground truncate">{c.empresa}</div>
          <div className="text-[11px] text-muted-foreground truncate">{c.contato}</div>
        </div>
        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", tempCfg[c.temp].cls)}>{tempCfg[c.temp].label}</span>
      </div>
      <div className="text-[11px] text-muted-foreground mb-2">{c.segmento}{c.uf && ` · ${c.uf}`}</div>
      {c.score > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full", c.score >= 80 ? "bg-primary" : c.score >= 60 ? "bg-amber-400" : "bg-sky-400")} style={{ width: `${c.score}%` }} />
          </div>
          <span className="text-[11px] font-semibold text-foreground">{c.score}</span>
          <span className="text-[11px] font-semibold text-foreground">{c.valor}</span>
        </div>
      )}
      {c.score === 0 && <div className="text-[13px] font-semibold text-foreground mb-2">{c.valor}</div>}
      <div className="flex items-center justify-between text-[11px]">
        <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium", c.atendeTipo === "ia" ? "bg-primary/10 text-primary" : "bg-muted text-foreground")}>
          {c.atendeTipo === "ia" ? "◆" : "›"} {c.atende}
        </span>
        {c.info && <span className={cn("text-muted-foreground", infoCfg)}>{c.info}</span>}
      </div>
    </Link>
  );
}

function Kpi({ icon, label, value, highlight, iconClass }: { icon: string; label: string; value: string; highlight?: boolean; iconClass?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card px-4 py-3", highlight ? "border-orange-300 bg-orange-50/40" : "border-border")}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-[14px]", iconClass || "text-muted-foreground")}>{icon}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-[20px] font-bold text-foreground leading-tight">{value}</div>
    </div>
  );
}
