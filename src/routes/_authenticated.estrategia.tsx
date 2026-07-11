import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { z } from "zod";
import {
  useDiagnostics, useICPs, usePersonas, useTerritories, useSellingProfiles, useStrategySync,
} from "@/domain/strategy";
import { useUsers } from "@/repositories/hooks";
import {
  Compass, Target, Users, Map as MapIcon, BadgeCheck, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  tab: z.enum(["diagnostico", "icp", "personas", "territorios", "perfis"]).optional().default("diagnostico"),
});

export const Route = createFileRoute("/_authenticated/estrategia")({
  head: () => ({
    meta: [
      { title: "Estratégia — WF Digital CRM" },
      { name: "description", content: "Diagnóstico, ICP, personas, territórios e perfis de venda." },
    ],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  component: EstrategiaPage,
});

const TABS = [
  { id: "diagnostico", label: "Diagnóstico", icon: Compass },
  { id: "icp", label: "ICP", icon: Target },
  { id: "personas", label: "Personas", icon: Users },
  { id: "territorios", label: "Territórios", icon: MapIcon },
  { id: "perfis", label: "Perfis de Venda", icon: BadgeCheck },
] as const;

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function EstrategiaPage() {
  useStrategySync();
  const { tab } = useSearch({ from: Route.id });

  return (
    <AppShell
      title="Estratégia"
      subtitle="Diagnóstico, ICP, personas, territórios e perfis de venda"
    >
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg mb-6 w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              to="/estrategia"
              search={{ tab: t.id }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "diagnostico" && <DiagnosticoTab />}
      {tab === "icp" && <ICPTab />}
      {tab === "personas" && <PersonasTab />}
      {tab === "territorios" && <TerritoriosTab />}
      {tab === "perfis" && <PerfisTab />}
    </AppShell>
  );
}

function DiagnosticoTab() {
  const { data: list = [] } = useDiagnostics();
  const d = list[0];
  if (!d) return <Empty label="Nenhum diagnóstico cadastrado." />;

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-[12px] text-muted-foreground">Empresa</div>
            <h3 className="text-lg font-semibold">{d.companyName}</h3>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Atualizado em {new Date(d.updatedAt).toLocaleDateString("pt-BR")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-muted-foreground">Índice de maturidade</div>
            <div className="text-3xl font-bold text-primary">{d.maturityScore}<span className="text-base text-muted-foreground">/100</span></div>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${d.maturityScore}%` }} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-card border border-border rounded-xl p-5">
          <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Pontos fortes
          </h4>
          <ul className="space-y-2">
            {d.strengths.map((s, i) => (
              <li key={i} className="text-[13px] text-foreground flex gap-2">
                <span className="text-emerald-600">•</span>{s}
              </li>
            ))}
          </ul>
        </section>
        <section className="bg-card border border-border rounded-xl p-5">
          <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Lacunas identificadas
          </h4>
          <ul className="space-y-2">
            {d.gaps.map((s, i) => (
              <li key={i} className="text-[13px] text-foreground flex gap-2">
                <span className="text-amber-600">•</span>{s}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-card border border-border rounded-xl p-5">
        <h4 className="text-[14px] font-semibold mb-3">Respostas do diagnóstico</h4>
        <div className="space-y-3">
          {d.answers.map((a) => (
            <div key={a.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{a.category}</div>
                  <div className="text-[13px] font-medium text-foreground">{a.question}</div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={cn("h-2 w-2 rounded-full", i < a.score ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
              </div>
              <div className="text-[12px] text-muted-foreground">{a.answer}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ICPTab() {
  const { data: icps = [] } = useICPs();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {icps.map((icp) => (
        <section key={icp.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{icp.name}</h3>
                {icp.active ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ativo</span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">rascunho</span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground mt-1">{icp.description}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] text-muted-foreground">Fit</div>
              <div className="text-2xl font-bold text-primary">{icp.fitScore}</div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-[12px] mt-4">
            <Field label="Segmentos" value={icp.segments.join(", ")} />
            <Field label="Porte" value={icp.porte.join(", ")} />
            <Field label="Faturamento" value={icp.faturamento} />
            <Field label="Regiões" value={icp.regioes.join(", ")} />
          </dl>

          <BulletList title="Decisores" items={icp.cargosDecisores} />
          <BulletList title="Dores principais" items={icp.doresPrincipais} />
          <BulletList title="Critérios de exclusão" items={icp.criteriosExclusao} tone="danger" />
        </section>
      ))}
    </div>
  );
}

function PersonasTab() {
  const { data: personas = [] } = usePersonas();
  const { data: icps = [] } = useICPs();
  const icpMap = Object.fromEntries(icps.map((i) => [i.id, i]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {personas.map((p) => (
        <section key={p.id} className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
              {p.nome.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold">{p.nome}</h3>
              <div className="text-[12px] text-muted-foreground">{p.cargo}</div>
              <div className="text-[10px] uppercase tracking-wide text-primary mt-0.5">
                {icpMap[p.icpId]?.name ?? "—"}
              </div>
            </div>
          </div>

          <p className="text-[12px] text-muted-foreground mb-3">{p.perfil}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
            <BulletList title="Objetivos" items={p.objetivos} />
            <BulletList title="Dores" items={p.dores} tone="danger" />
            <BulletList title="Gatilhos" items={p.gatilhos} />
            <BulletList title="Objeções" items={p.objecoes} tone="danger" />
          </div>

          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1">
            {p.canaisPreferidos.map((c) => (
              <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-primary-soft/60 text-primary-strong">
                {c}
              </span>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TerritoriosTab() {
  const { data: territories = [] } = useTerritories();
  const { data: users = [] } = useUsers();
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const total = territories.reduce((s, t) => s + t.potencialEstimado, 0);
  const meta = territories.reduce((s, t) => s + t.metaTrimestral, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Territórios" value={String(territories.length)} />
        <KPI label="Contas ativas" value={String(territories.reduce((s, t) => s + t.contasAtivas, 0))} />
        <KPI label="Potencial mapeado" value={currency(total)} />
        <KPI label="Meta trimestre" value={currency(meta)} />
      </div>

      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5">Território</th>
              <th className="px-4 py-2.5">UFs</th>
              <th className="px-4 py-2.5">Segmentos foco</th>
              <th className="px-4 py-2.5">Responsável</th>
              <th className="px-4 py-2.5 text-right">Contas</th>
              <th className="px-4 py-2.5 text-right">Potencial</th>
              <th className="px-4 py-2.5 text-right">Meta trim.</th>
            </tr>
          </thead>
          <tbody>
            {territories.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{t.nome}</div>
                  <div className="text-[11px] text-muted-foreground">{t.regiao}</div>
                </td>
                <td className="px-4 py-3">{t.ufs.join(", ")}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.segmentosFoco.join(", ")}</td>
                <td className="px-4 py-3">
                  {t.responsavelId ? userMap[t.responsavelId]?.name ?? "—" : <span className="text-muted-foreground">Sem responsável</span>}
                </td>
                <td className="px-4 py-3 text-right">{t.contasAtivas}</td>
                <td className="px-4 py-3 text-right">{currency(t.potencialEstimado)}</td>
                <td className="px-4 py-3 text-right font-medium">{currency(t.metaTrimestral)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function PerfisTab() {
  const { data: profiles = [] } = useSellingProfiles();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {profiles.map((p) => (
        <section key={p.id} className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold">{p.nome}</h3>
            {p.active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">ativo</span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground mb-4">{p.descricao}</p>

          <dl className="space-y-2 text-[12px] mb-4">
            <Field label="Ciclo médio" value={p.cicloMedio} />
            <Field label="Ticket médio" value={currency(p.ticketMedio)} />
            <Field label="Canais" value={p.canais.join(", ")} />
          </dl>

          <div className="mt-auto bg-muted/40 rounded-lg p-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Cadência padrão</div>
            <div className="text-[12px] text-foreground">{p.cadenciaPadrao}</div>
          </div>
        </section>
      ))}
    </div>
  );
}

// ============ Helpers ============
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-[12px] text-foreground">{value}</dd>
    </div>
  );
}

function BulletList({ title, items, tone }: { title: string; items: string[]; tone?: "danger" }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <ul className="space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="text-[12px] flex gap-1.5">
            <span className={tone === "danger" ? "text-destructive" : "text-primary"}>•</span>
            <span className="text-foreground">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground mt-1">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="border-2 border-dashed border-border rounded-xl py-16 text-center text-muted-foreground text-[13px]">
      {label}
    </div>
  );
}
