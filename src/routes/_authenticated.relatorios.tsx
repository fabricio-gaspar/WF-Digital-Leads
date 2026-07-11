import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useLeads, useUsers } from "@/repositories/hooks";
import { LEAD_STAGES, STAGE_MAP } from "@/domain/constants";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — WF Digital CRM" }] }),
  component: ReportsPage,
});

const COLORS = ["#0F766E", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981", "#EF4444"];
const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function ReportsPage() {
  const { data: leads = [] } = useLeads();
  const { data: users = [] } = useUsers();

  const byStage = useMemo(
    () =>
      LEAD_STAGES.map((s) => ({
        name: s.label,
        leads: leads.filter((l) => l.stage === s.id).length,
        valor: leads.filter((l) => l.stage === s.id).reduce((sum, l) => sum + l.estimatedValue, 0),
      })),
    [leads],
  );

  const byOwner = useMemo(() => {
    return users
      .filter((u) => u.role === "vendedor" || u.role === "gestor")
      .map((u) => ({
        name: u.name.split(" ")[0],
        leads: leads.filter((l) => l.ownerId === u.id).length,
        fechados: leads.filter((l) => l.ownerId === u.id && l.stage === "fechado").length,
      }));
  }, [leads, users]);

  const bySource = useMemo(() => {
    const acc: Record<string, number> = {};
    leads.forEach((l) => (acc[l.source] = (acc[l.source] ?? 0) + 1));
    return Object.entries(acc).map(([name, value]) => ({ name, value }));
  }, [leads]);

  const conversion = useMemo(() => {
    const won = leads.filter((l) => l.stage === "fechado").length;
    const lost = leads.filter((l) => l.stage === "perdido").length;
    const total = won + lost;
    return total > 0 ? (won / total) * 100 : 0;
  }, [leads]);

  const forecast = leads
    .filter((l) => l.stage !== "fechado" && l.stage !== "perdido")
    .reduce((s, l) => s + l.estimatedValue * STAGE_MAP[l.stage].probability, 0);

  return (
    <AppShell title="Relatórios" subtitle="Indicadores de performance do time comercial">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { l: "Taxa de conversão", v: `${conversion.toFixed(1)}%` },
          { l: "Previsão ponderada", v: currency(forecast) },
          { l: "Leads ativos", v: leads.filter((l) => l.stage !== "fechado" && l.stage !== "perdido").length },
          { l: "Ticket médio", v: currency(leads.length ? leads.reduce((s, l) => s + l.estimatedValue, 0) / leads.length : 0) },
        ].map((k) => (
          <div key={k.l} className="bg-card border border-border rounded-xl p-4">
            <div className="text-[12px] text-muted-foreground">{k.l}</div>
            <div className="text-[20px] font-semibold">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-[14px] font-semibold mb-3">Funil de vendas</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStage}>
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-[14px] font-semibold mb-3">Performance por vendedor</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byOwner}>
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fechados" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-[14px] font-semibold mb-3">Origem dos leads</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bySource} dataKey="value" nameKey="name" outerRadius={90} label={{ fontSize: 11 }}>
                {bySource.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-[14px] font-semibold mb-3">Valor no funil por etapa</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byStage} layout="vertical">
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={90} />
              <Tooltip formatter={(v: number) => currency(v)} />
              <Bar dataKey="valor" fill="#0F766E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppShell>
  );
}
