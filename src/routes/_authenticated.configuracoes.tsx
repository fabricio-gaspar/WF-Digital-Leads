import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useAuth } from "@/auth/AuthProvider";
import { useUsers, useTeams, useTemplates, useChannels } from "@/repositories/hooks";
import { useState } from "react";
import { Users, Layers, MessageSquare, Plug, Shield } from "lucide-react";
import { providerStatus } from "@/providers";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — WF Digital CRM" }] }),
  component: SettingsPage,
});

const tabs = [
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "times", label: "Times & Filas", icon: Layers },
  { id: "templates", label: "Templates", icon: MessageSquare },
  { id: "integracoes", label: "Integrações", icon: Plug },
  { id: "seguranca", label: "Segurança", icon: Shield },
] as const;

function SettingsPage() {
  const { session, hasPermission } = useAuth();
  const [tab, setTab] = useState<typeof tabs[number]["id"]>("usuarios");
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useTeams();
  const { data: templates = [] } = useTemplates();
  const { data: channels = [] } = useChannels();

  const readonly = !hasPermission("manage:users");

  return (
    <AppShell title="Configurações" subtitle="Administração da plataforma">
      {readonly && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 px-3 py-2 text-[12px]">
          Você está no modo somente leitura. Apenas administradores podem editar.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        <nav className="bg-card border border-border rounded-xl p-2 h-fit">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-3 h-9 rounded-md text-[13px] inline-flex items-center gap-2 ${tab === t.id ? "bg-primary-soft text-primary-strong font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        <section className="bg-card border border-border rounded-xl p-4 min-h-[300px]">
          {tab === "usuarios" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">Usuários ({users.length})</h3>
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase text-muted-foreground">
                  <tr><th className="text-left py-2">Nome</th><th className="text-left py-2">E-mail</th><th className="text-left py-2">Papel</th><th className="text-left py-2">Status</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="py-2">{u.name}</td>
                      <td className="py-2 text-muted-foreground">{u.email}</td>
                      <td className="py-2 capitalize">{u.role}</td>
                      <td className="py-2">{u.active ? <span className="text-emerald-600">Ativo</span> : <span className="text-muted-foreground">Inativo</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "times" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">Times</h3>
              <ul className="space-y-2">
                {teams.map((t) => (
                  <li key={t.id} className="p-3 rounded-lg border border-border">
                    <div className="text-[13px] font-medium">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">{t.memberIds.length} membros</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "templates" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">Templates de mensagem</h3>
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li key={t.id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div className="text-[13px] font-medium">{t.name}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted capitalize">{t.status}</span>
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-1">{t.content}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "integracoes" && <IntegrationsTab channels={channels} />}
          {tab === "seguranca" && (
            <div>
              <h3 className="text-[14px] font-semibold mb-3">Segurança</h3>
              <ul className="text-[13px] text-muted-foreground space-y-2 list-disc pl-5">
                <li>Sessão atual: <span className="text-foreground">{session?.user.name}</span> ({session?.user.role})</li>
                <li>MFA obrigatório para admin/gestor (a ativar com backend).</li>
                <li>Trilha de auditoria completa após conexão do Lovable Cloud.</li>
                <li>LGPD: opt-in em contatos e logs de consentimento.</li>
              </ul>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function IntegrationsTab({ channels }: { channels: { id: string; alias: string; phone?: string; status: string }[] }) {
  // Import dinâmico evita ciclo com AppShell / router
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { providerStatus } = require("@/providers") as typeof import("@/providers");
  const status = providerStatus();
  return (
    <div>
      <h3 className="text-[14px] font-semibold mb-1">Integrações & Providers</h3>
      <p className="text-[12px] text-muted-foreground mb-3">Todos os tokens ficam no backend seguro. O front nunca acessa credenciais.</p>

      <div className="text-[11px] uppercase text-muted-foreground font-medium mb-2">Providers plugáveis</div>
      <ul className="space-y-2 mb-4">
        {status.map((p) => (
          <li key={p.key} className="p-3 rounded-lg border border-border flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium">{p.label}</div>
              <div className="text-[11px] text-muted-foreground">Provider ativo: <span className="font-mono">{p.provider}</span></div>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${p.ready ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {p.ready ? "pronto" : "aguardando backend"}
            </span>
          </li>
        ))}
      </ul>

      <div className="text-[11px] uppercase text-muted-foreground font-medium mb-2">Canais WhatsApp (Z-API)</div>
      <ul className="space-y-2">
        {channels.map((c) => (
          <li key={c.id} className="p-3 rounded-lg border border-border flex items-center justify-between">
            <div>
              <div className="text-[13px] font-medium">Z-API · {c.alias}</div>
              <div className="text-[11px] text-muted-foreground">{c.phone ?? "sem número"}</div>
            </div>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.status === "conectado" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {c.status.replace("_", " ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
