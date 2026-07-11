import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/central")({
  head: () => ({ meta: [{ title: "Central — WF Digital CRM" }] }),
  component: CentralPage,
});

type EscRow = { id: string; empresa: string; contato: string; motivo: string; motivoDestaque: string };
type Row = {
  id: string;
  empresa: string;
  contato: string;
  canal: string;
  etapa: string;
  quem: string;
  quemTipo: "ia" | "humano";
  ultimo: string;
  aguardando: string;
  aguardandoTag?: "escalado" | "normal" | "atraso" | "aguardando";
  valor: string;
};

const ESCALADOS: EscRow[] = [
  { id: "1", empresa: "Sabor Mineiro Distribuidora", contato: "José Ricardo", motivo: "Cliente pediu ", motivoDestaque: "18% de desconto; a alçada da IA é 10%. Conversa pausada aguardando sua decisão." },
  { id: "2", empresa: "Farmácias Vida Plena", contato: "Sandra Meireles", motivo: "Cliente ", motivoDestaque: "pediu para falar com uma pessoa. A IA se despediu e não responderá mais." },
  { id: "3", empresa: "Aço Vale", contato: "Marcos Tavares", motivo: "Pergunta ", motivoDestaque: 'fora da base de conhecimento: "integração com Bling?". A IA não inventou resposta.' },
];

const CONTATOS: Row[] = [
  { id: "1", empresa: "Aço Vale", contato: "Marcos Tavares", canal: "WhatsApp", etapa: "Negociação", quem: "Ana (IA)", quemTipo: "ia", ultimo: "hoje, 12:34", aguardando: "2h — escalado", aguardandoTag: "escalado", valor: "R$ 65k" },
  { id: "2", empresa: "Sabor Mineiro", contato: "José Ricardo", canal: "WhatsApp", etapa: "Proposta", quem: "Ana (IA)", quemTipo: "ia", ultimo: "hoje, 11:02", aguardando: "3h — escalado", aguardandoTag: "escalado", valor: "R$ 38k" },
  { id: "3", empresa: "Ápice Contábil", contato: "Eduardo Barros", canal: "WhatsApp", etapa: "Fechado", quem: "MV Marina", quemTipo: "humano", ultimo: "ontem, 17:20", aguardando: "—", valor: "R$ 24k" },
  { id: "4", empresa: "TechFrota", contato: "Rafael Menezes", canal: "WhatsApp", etapa: "Qualificado", quem: "Ana (IA)", quemTipo: "ia", ultimo: "hoje, 09:15", aguardando: "6h", aguardandoTag: "normal", valor: "R$ 20k" },
  { id: "5", empresa: "Corpo em Movimento", contato: "Luana Castro", canal: "WhatsApp", etapa: "Prospecção", quem: "Ana (IA)", quemTipo: "ia", ultimo: "hoje, 08:40", aguardando: "aguardando lead", aguardandoTag: "aguardando", valor: "R$ 15k" },
  { id: "6", empresa: "Rota Sul Cargas", contato: "Anderson Prado", canal: "WhatsApp", etapa: "Prospecção", quem: "CS Carlos", quemTipo: "humano", ultimo: "08/07/2026", aguardando: "3 dias sem resposta", aguardandoTag: "atraso", valor: "R$ 18k" },
  { id: "7", empresa: "Semente Ouro", contato: "Gilmar Furtado", canal: "WhatsApp", etapa: "Negociação", quem: "RK Roberto", quemTipo: "humano", ultimo: "hoje, 10:05", aguardando: "5h", aguardandoTag: "normal", valor: "R$ 52k" },
];

function CentralPage() {
  return (
    <AppShell title="Central" subtitle="Todos os contatos em andamento e quem está atendendo cada um">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        <Kpi icon="⚠" label="Precisa de você" value="3" sub="a IA escalou" highlight />
        <Kpi icon="◆" iconClass="text-primary" label="IA conduzindo" value="6" />
        <Kpi icon="›" label="Humano conduzindo" value="5" />
        <Kpi icon="⏱" label="Sem resposta há 48h" value="2" />
        <Kpi icon="✉" label="1ª resposta (média)" value="1min" />
      </div>

      {/* Escalados */}
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50/40 mb-5">
        <div className="px-5 py-3 border-b border-amber-200/70">
          <div className="text-[11px] uppercase tracking-[0.12em] font-bold text-amber-900">
            ⚠ Precisa de você agora
            <span className="ml-2 font-normal normal-case tracking-normal text-[11px] text-amber-800/80">a IA fez o que podia e passou a bola</span>
          </div>
        </div>
        <div className="divide-y divide-amber-200/60">
          {ESCALADOS.map((e) => (
            <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary grid place-items-center text-[12px] font-bold shrink-0">◆</div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-foreground">
                    {e.empresa} <span className="text-muted-foreground font-normal">— {e.contato}</span>
                  </div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {e.motivo}<span className="text-foreground font-semibold">{e.motivoDestaque}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to="/leads/$leadId" params={{ leadId: e.id }} className="h-8 px-3 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted">
                  Ver conversa
                </Link>
                <button className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90">
                  Assumir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Todos os contatos */}
      <section className="rounded-xl border border-border bg-card">
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-2">
          <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">Todos os contatos</div>
          <div className="ml-auto flex items-center gap-2">
            <select className="h-9 px-3 rounded-md border border-input bg-background text-[12px]"><option>Responsável: todos</option></select>
            <select className="h-9 px-3 rounded-md border border-input bg-background text-[12px]"><option>Etapa: todas</option></select>
            <select className="h-9 px-3 rounded-md border border-input bg-background text-[12px]"><option>Canal: todos</option></select>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr_80px] gap-3 px-5 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
            <div>Contato</div>
            <div>Etapa</div>
            <div>Quem atende</div>
            <div>Último contato</div>
            <div>Aguardando há</div>
            <div>Valor</div>
            <div />
          </div>
          {CONTATOS.map((r) => (
            <div key={r.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr_80px] gap-3 px-5 py-3.5 items-center border-b border-border last:border-0">
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-foreground">{r.empresa}</div>
                <div className="text-[11px] text-muted-foreground">{r.contato} · {r.canal}</div>
              </div>
              <div>
                <span className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-foreground font-medium">{r.etapa}</span>
              </div>
              <div>
                <span className={cn(
                  "text-[12px] px-2 py-0.5 rounded-full font-medium",
                  r.quemTipo === "ia" ? "bg-primary/10 text-primary" : "bg-muted text-foreground",
                )}>
                  {r.quemTipo === "ia" ? "◆" : "›"} {r.quem}
                </span>
              </div>
              <div className="text-[13px] text-foreground">{r.ultimo}</div>
              <div>
                <span className={cn(
                  "text-[12px] px-2 py-0.5 rounded-full font-medium inline-block",
                  r.aguardandoTag === "escalado" && "bg-red-100 text-red-700",
                  r.aguardandoTag === "atraso" && "bg-red-100 text-red-700",
                  r.aguardandoTag === "aguardando" && "bg-amber-100 text-amber-700",
                  r.aguardandoTag === "normal" && "text-muted-foreground",
                  !r.aguardandoTag && "text-muted-foreground",
                )}>
                  {r.aguardando}
                </span>
              </div>
              <div className="text-[13px] font-semibold text-foreground">{r.valor}</div>
              <div className="text-right">
                <Link to="/leads/$leadId" params={{ leadId: r.id }} className="h-8 px-3 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted inline-flex items-center">
                  Abrir
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function Kpi({ icon, label, value, sub, highlight, iconClass }: { icon: string; label: string; value: string; sub?: string; highlight?: boolean; iconClass?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card px-4 py-3", highlight ? "border-amber-300 bg-amber-50/40" : "border-border")}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-[14px]", iconClass || "text-muted-foreground")}>{icon}</span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <div className="text-[22px] font-bold text-foreground leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
