import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { Package, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — WF Digital CRM" }] }),
  component: PedidosPage,
});

// Dados demo (fiéis ao mock 14-pedidos.png)
const ORDERS = [
  { id: "2026-043", empresa: "Semente Ouro", cliente: "Renata Vieira", total: 32500, status: "Aprovado", prazo: "5 dias úteis", origem: "Ana (IA)" },
  { id: "2026-042", empresa: "Aço Vale", cliente: "Marcos Tavares", total: 118400, status: "Em produção", prazo: "12 dias úteis", origem: "Marina" },
  { id: "2026-041", empresa: "TechFrota", cliente: "Luiz Bernardes", total: 54000, status: "Faturado", prazo: "concluído", origem: "Marina" },
  { id: "2026-040", empresa: "Farmácias Vida Plena", cliente: "Sandra Costa", total: 22000, status: "Aguardando pagamento", prazo: "aguardando", origem: "Ana (IA)" },
];

const STATUS_STYLES: Record<string, string> = {
  "Aprovado": "bg-[#E8F8F2] text-[#0A8060]",
  "Em produção": "bg-[#EAF4FE] text-[#0B7FAE]",
  "Faturado": "bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)]",
  "Aguardando pagamento": "bg-[#FEF7E7] text-[#B4770A]",
};

function PedidosPage() {
  const total = ORDERS.reduce((s, o) => s + o.total, 0);
  return (
    <AppShell title="Pedidos" subtitle="Vitrine pós-fechamento: acompanhamento de entrega e faturamento">
      <div className="grid gap-3.5 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {[
          { label: "Pedidos abertos", value: ORDERS.length },
          { label: "Valor total", value: total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) },
          { label: "Aguardando pagamento", value: ORDERS.filter(o => o.status === "Aguardando pagamento").length },
          { label: "Em produção", value: ORDERS.filter(o => o.status === "Em produção").length },
        ].map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 flex gap-3 items-start">
            <div className="h-[34px] w-[34px] rounded-[9px] bg-[color:var(--primary-soft)] text-primary grid place-items-center shrink-0">
              <Package className="h-[16px] w-[16px]" />
            </div>
            <div>
              <div className="text-[11.5px] text-muted-foreground">{k.label}</div>
              <div className="text-[22px] font-bold tracking-tight mt-0.5">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-[18px] py-3.5 border-b border-border/60 flex items-center gap-3">
          <h3 className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground">Pedidos Recentes</h3>
          <span className="text-[12px] text-muted-foreground/70">Gerados após handoff e aprovação do orçamento</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10.5px] uppercase tracking-[.07em] text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Pedido</th>
              <th className="text-left px-4 py-2.5 font-semibold">Cliente</th>
              <th className="text-left px-4 py-2.5 font-semibold">Origem</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold">Prazo</th>
              <th className="text-right px-4 py-2.5 font-semibold">Total</th>
              <th className="text-right px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((o) => (
              <tr key={o.id} className="border-t border-border/60 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">#{o.id}</div>
                  <div className="text-[11.5px] text-muted-foreground">{o.empresa}</div>
                </td>
                <td className="px-4 py-3 text-foreground">{o.cliente}</td>
                <td className="px-4 py-3 text-muted-foreground">{o.origem}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[o.status] ?? "bg-muted text-muted-foreground"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-[12.5px]">{o.prazo}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {o.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[12px] bg-[color:var(--primary-soft)] text-[color:var(--primary-strong)] hover:bg-primary hover:text-primary-foreground transition-colors">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11.5px] text-muted-foreground italic">
        Sandbox: dados fictícios. Em produção, os pedidos serão criados automaticamente ao fechar uma proposta na etapa "Fechado" da Central.
      </p>
    </AppShell>
  );
}
