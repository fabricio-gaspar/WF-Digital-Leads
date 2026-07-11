import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { useSearchProfiles, useServicesList } from "@/domain/sdrVirtual";
import { Target, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perfis-busca")({
  head: () => ({ meta: [{ title: "Perfis de Busca — WF Digital Leads" }] }),
  component: PerfisBuscaPage,
});

function PerfisBuscaPage() {
  const profiles = useSearchProfiles();
  const services = useServicesList();
  const getService = (id: string) => services.find((s) => s.id === id)?.nome ?? "—";

  return (
    <AppShell title="Perfis de Busca" subtitle="Configuração compacta de ICP, persona, território e serviço">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          O Perfil de Busca substitui, nesta versão compacta, telas separadas de ICP, Persona, Território e Selling Profile. Cada perfil concentra: empresa-alvo, geografia, decisor e critérios eliminatórios — pronto para reutilizar em cada busca.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{p.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  p.status === "Ativo" ? "bg-emerald-100 text-emerald-700"
                  : p.status === "Em teste" ? "bg-amber-100 text-amber-700"
                  : "bg-muted text-muted-foreground"
                }`}>{p.status}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border text-xs">
                <Info icon={Target} label="Serviço alvo" value={getService(p.servicoId)} />
                <Info icon={MapPin} label="Geografia" value={p.cidades.length ? `${p.cidades.slice(0, 2).join(", ")}${p.raioKm ? ` +${p.raioKm}km` : ""}` : p.ufs.join(", ") || "Brasil"} />
                <Info icon={Users} label="Porte" value={`${p.porteMin ?? "—"} a ${p.porteMax ?? "—"} func.`} />
                <Info icon={Users} label="Cargos" value={p.cargos.slice(0, 2).join(", ")} />
              </div>

              <div className="pt-2 border-t border-border space-y-1.5">
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Segmento / CNAEs</div>
                <div className="text-xs text-foreground">{p.segmento}{p.cnaes.length ? ` — CNAE ${p.cnaes.join(", ")}` : ""}</div>
              </div>

              {p.mustHave.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="text-[11px] text-emerald-600 uppercase tracking-wide mb-1">Must-have</div>
                  <ul className="text-xs text-foreground space-y-0.5">
                    {p.mustHave.map((m) => <li key={m}>✓ {m}</li>)}
                  </ul>
                </div>
              )}
              {p.exclusoes.length > 0 && (
                <div>
                  <div className="text-[11px] text-red-600 uppercase tracking-wide mb-1">Exclusões</div>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {p.exclusoes.map((e) => <li key={e}>✕ {e}</li>)}
                  </ul>
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Atualizado em {p.atualizadoEm}</span>
                <span className="italic">{p.objetivo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <div className="text-muted-foreground">{label}</div>
        <div className="text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
