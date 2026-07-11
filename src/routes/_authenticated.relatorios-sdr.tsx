import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/app/AppShell";
import { useHandoffs } from "@/domain/sdrVirtual";
import { computeSdrMetrics } from "@/domain/sdrEngine";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { ArrowRightLeft, CheckCircle2, Clock, TrendingUp, Flame, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/relatorios-sdr")({
  head: () => ({ meta: [{ title: "Relatórios do SDR — WF Digital" }] }),
  component: RelatoriosSdrPage,
});

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#0ea5e9"];

function RelatoriosSdrPage() {
  const handoffs = useHandoffs();
  const m = useMemo(() => computeSdrMetrics(handoffs), [handoffs]);

  const statusData = [
    { name: "Aguardando", value: m.aguardando },
    { name: "Aceitos", value: m.aceitos },
    { name: "Concluídos", value: m.concluidos },
    { name: "Devolvidos", value: m.devolvidos },
    { name: "Recusados", value: m.recusados },
  ].filter((d) => d.value > 0);

  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows: (string | number)[][] = [
      ["WF Digital Leads — Relatório do SDR", "", "gerado_em", new Date().toISOString()],
      [],
      ["Métrica", "Valor"],
      ["Total de handoffs", m.totalHandoffs],
      ["Aguardando vendedor", m.aguardando],
      ["Aceitos", m.aceitos],
      ["Concluídos", m.concluidos],
      ["Devolvidos", m.devolvidos],
      ["Recusados", m.recusados],
      ["Taxa de aceite (%)", m.taxaAceite],
      ["Heat médio", m.heatMedio],
      [],
      ["Handoffs por serviço"],
      ["Serviço", "Quantidade"],
      ...m.porServico.map((r) => [r.servico, r.qtd]),
      [],
      ["Motivos mais frequentes"],
      ["Motivo", "Quantidade"],
      ...m.motivosTop.map((r) => [r.motivo, r.qtd]),
      [],
      ["Distribuição por urgência"],
      ["Urgência", "Quantidade"],
      ...m.porUrgencia.map((r) => [r.urgencia, r.qtd]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-sdr-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  };

  return (
    <AppShell title="Relatórios do SDR" subtitle="Métricas de conversas, qualificação e handoffs">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex justify-end">
          <button
            onClick={exportCsv}
            data-testid="export-csv"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted font-medium"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={ArrowRightLeft} label="Total de handoffs" value={m.totalHandoffs} />
          <Kpi icon={Clock} label="Aguardando vendedor" value={m.aguardando} tone="amber" />
          <Kpi icon={CheckCircle2} label="Taxa de aceite" value={`${m.taxaAceite}%`} tone="emerald" />
          <Kpi icon={Flame} label="Heat médio" value={m.heatMedio} tone="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Status dos handoffs">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Handoffs por serviço">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.porServico}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="servico" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Motivos mais frequentes">
            {m.motivosTop.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
            ) : (
              <ul className="space-y-2">
                {m.motivosTop.map((r) => {
                  const pct = (r.qtd / Math.max(...m.motivosTop.map((x) => x.qtd))) * 100;
                  return (
                    <li key={r.motivo}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground">{r.motivo}</span>
                        <span className="text-muted-foreground">{r.qtd}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Distribuição por urgência">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.porUrgencia} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis dataKey="urgencia" type="category" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="qtd" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Métricas calculadas em tempo real a partir do store demonstrativo de handoffs. Quando o Lovable Cloud for ativado, o mesmo cálculo passa a ler do banco.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ icon: Icon, label, value, tone = "primary" }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone?: "primary" | "amber" | "emerald" | "rose";
}) {
  const toneCls =
    tone === "amber" ? "text-amber-600 bg-amber-100"
    : tone === "emerald" ? "text-emerald-600 bg-emerald-100"
    : tone === "rose" ? "text-rose-600 bg-rose-100"
    : "text-primary bg-primary/10";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`h-8 w-8 rounded-lg grid place-items-center mb-2 ${toneCls}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}
