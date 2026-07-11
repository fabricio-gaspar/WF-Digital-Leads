// Observabilidade — Prompt 5.0 / Fase 5
// Painel único de auditoria demo: audit log, mensagens enviadas,
// lotes de importação e execuções de busca. Somente leitura.
import { createFileRoute } from "@tanstack/react-router";
import {
  useAuditLog,
  useSentMessages,
  useImportBatches,
  useSearchRuns,
} from "@/domain/DemoDataProvider";
import {
  useAutonomy,
  setAutonomyLevel,
  setGlobalKillSwitch,
  AUTONOMY_DESCRIPTIONS,
  type AutonomyLevel,
} from "@/domain/canonical";
import { Activity, MessageSquare, Upload, Search, Power, ShieldAlert, Eye, Users as UsersIcon, Gauge, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/observabilidade")({
  head: () => ({
    meta: [
      { title: "Observabilidade — WF Digital Leads" },
      { name: "description", content: "Auditoria e telemetria da demo." },
    ],
  }),
  component: ObservabilidadePage,
});

function ObservabilidadePage() {
  const audit = useAuditLog();
  const messages = useSentMessages();
  const imports = useImportBatches();
  const searches = useSearchRuns();

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Observabilidade</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auditoria completa da demo — todos os eventos ficam no navegador (localStorage).
          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            SANDBOX
          </span>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <KpiCard icon={Activity} label="Eventos de auditoria" value={audit.length} />
        <KpiCard icon={MessageSquare} label="Mensagens enviadas" value={messages.length} />
        <KpiCard icon={Upload} label="Lotes importados" value={imports.length} />
        <KpiCard icon={Search} label="Execuções de busca" value={searches.length} />
      </div>

      <Section title="Audit log (últimos 50)">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-3 py-2">Quando</th>
              <th className="text-left px-3 py-2">Ação</th>
              <th className="text-left px-3 py-2">Entidade</th>
              <th className="text-left px-3 py-2">Usuário</th>
              <th className="text-left px-3 py-2">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {audit.slice(0, 50).map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                  {new Date(e.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">{e.action}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {e.entityType}
                  <span className="text-xs ml-1 opacity-60">#{e.entityId.slice(0, 10)}</span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{e.userId}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground font-mono truncate max-w-xs">
                  {JSON.stringify(e.metadata)}
                </td>
              </tr>
            ))}
            {audit.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhum evento registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="Mensagens enviadas (sandbox)">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-3 py-2">Quando</th>
              <th className="text-left px-3 py-2">Empresa</th>
              <th className="text-left px-3 py-2">Contato</th>
              <th className="text-left px-3 py-2">Canal</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Mensagem</th>
            </tr>
          </thead>
          <tbody>
            {messages.slice(0, 50).map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                  {new Date(m.sentAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 text-foreground">{m.empresa}</td>
                <td className="px-3 py-2 text-muted-foreground">{m.contato}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{m.channel}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      m.status === "sent"
                        ? "text-emerald-600 text-xs font-medium"
                        : "text-red-600 text-xs font-medium"
                    }
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-xs">
                  {m.body}
                </td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhuma mensagem enviada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      <Section title="Lotes de importação">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-3 py-2">Quando</th>
              <th className="text-left px-3 py-2">Arquivo</th>
              <th className="text-left px-3 py-2">Formato</th>
              <th className="text-left px-3 py-2">Total</th>
              <th className="text-left px-3 py-2">Válidos</th>
              <th className="text-left px-3 py-2">Duplicados</th>
              <th className="text-left px-3 py-2">Bloqueados</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs text-muted-foreground font-mono">
                  {new Date(b.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 text-foreground">{b.fileName}</td>
                <td className="px-3 py-2 uppercase text-xs">{b.format}</td>
                <td className="px-3 py-2">{b.totalRows}</td>
                <td className="px-3 py-2 text-emerald-600 font-medium">{b.validos}</td>
                <td className="px-3 py-2 text-amber-600">{b.duplicados}</td>
                <td className="px-3 py-2 text-red-600">{b.bloqueados}</td>
              </tr>
            ))}
            {imports.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nenhuma importação registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-2xl font-bold text-foreground mt-2">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <h2 className="px-4 py-2.5 text-sm font-semibold text-foreground border-b border-border">
        {title}
      </h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
