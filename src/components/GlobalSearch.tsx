// Busca global funcional — WF Digital CRM
// Atalhos: ⌘K / Ctrl+K abrem o modal; setas navegam; Enter confirma.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, Building2, User, Megaphone, BookOpen } from "lucide-react";
import { useCompanies, useContacts, useLeads } from "@/repositories/hooks";
import { useCampaigns } from "@/domain/campaigns";
import { usePlaybooks } from "@/domain/playbooks";

interface Hit {
  key: string;
  label: string;
  hint: string;
  icon: typeof Building2;
  to: string;
  params?: Record<string, string>;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: leads = [] } = useLeads();
  const { data: companies = [] } = useCompanies();
  const { data: contacts = [] } = useContacts();
  const { data: campaigns = [] } = useCampaigns();
  const { data: playbooks = [] } = usePlaybooks();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0); }, [open]);
  useEffect(() => { setCursor(0); }, [q]);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const companyMap = Object.fromEntries(companies.map((c) => [c.id, c]));
    const out: Hit[] = [];
    companies.forEach((c) => {
      if (c.razaoSocial.toLowerCase().includes(term) || c.nomeFantasia?.toLowerCase().includes(term) || c.cnpj?.replace(/\D/g, "").includes(term.replace(/\D/g, ""))) {
        out.push({ key: `co-${c.id}`, label: c.nomeFantasia ?? c.razaoSocial, hint: `Empresa · ${c.segmento ?? c.cidade ?? ""}`, icon: Building2, to: "/leads" });
      }
    });
    leads.forEach((l) => {
      const c = companyMap[l.companyId];
      const label = c?.nomeFantasia ?? c?.razaoSocial ?? "Lead";
      if (label.toLowerCase().includes(term)) {
        out.push({ key: `l-${l.id}`, label, hint: `Lead · ${l.stage} · score ${l.score}`, icon: Building2, to: "/leads/$leadId", params: { leadId: l.id } });
      }
    });
    contacts.forEach((ct) => {
      if (ct.nome.toLowerCase().includes(term) || ct.email?.toLowerCase().includes(term)) {
        out.push({ key: `ct-${ct.id}`, label: ct.nome, hint: `Contato · ${ct.cargo ?? ""}`, icon: User, to: "/leads" });
      }
    });
    campaigns.forEach((c) => {
      if (c.name.toLowerCase().includes(term)) {
        out.push({ key: `camp-${c.id}`, label: c.name, hint: `Campanha · ${c.status}`, icon: Megaphone, to: "/campanhas" });
      }
    });
    playbooks.forEach((p) => {
      if (p.name.toLowerCase().includes(term) || p.objective.toLowerCase().includes(term)) {
        out.push({ key: `pb-${p.id}`, label: p.name, hint: `Playbook · ${p.stage}`, icon: BookOpen, to: "/playbooks" });
      }
    });
    return out.slice(0, 25);
  }, [q, leads, companies, contacts, campaigns, playbooks]);

  const go = (h: Hit) => {
    setOpen(false); setQ("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: h.to as any, params: h.params as any });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-3 text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors min-w-[280px]"
        aria-label="Abrir busca global"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar em tudo…</span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-background">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-start pt-[10vh] px-4 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            role="dialog" aria-modal="true" aria-label="Busca global"
            className="w-full max-w-[600px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, hits.length - 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
                  else if (e.key === "Enter" && hits[cursor]) { e.preventDefault(); go(hits[cursor]); }
                }}
                placeholder="Buscar leads, empresas, contatos, campanhas, playbooks…"
                className="flex-1 h-12 bg-transparent outline-none text-sm"
              />
              <button onClick={() => setOpen(false)} aria-label="Fechar busca" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {q && hits.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">Nenhum resultado para "{q}".</div>
              )}
              {!q && (
                <div className="p-6 text-center text-sm text-muted-foreground">Comece a digitar para buscar em todo o CRM.</div>
              )}
              {hits.map((h, i) => {
                const Icon = h.icon;
                return (
                  <button
                    key={h.key}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(h)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/60 last:border-b-0 ${i === cursor ? "bg-muted" : ""}`}
                  >
                    <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate">{h.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{h.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground flex items-center gap-3">
              <span><kbd className="px-1 rounded bg-muted">↑↓</kbd> navegar</span>
              <span><kbd className="px-1 rounded bg-muted">Enter</kbd> abrir</span>
              <span><kbd className="px-1 rounded bg-muted">Esc</kbd> fechar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
