import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  head: () => ({ meta: [{ title: "Prospecção — WF Digital CRM" }] }),
  component: ProspeccaoPage,
});

type Chance = "alta" | "media" | "baixa" | "duplicado";

type Empresa = {
  id: string;
  nome: string;
  razao: string;
  cnpj: string;
  segmento: string;
  cnae: string;
  porte: string;
  cidade: string;
  uf: string;
  km: number;
  whatsapp: string;
  chance: Chance;
  score: number;
  sinais: { texto: string; pts: number }[];
  duplicadoInfo?: string;
};

const EMPRESAS: Empresa[] = [
  {
    id: "1",
    nome: "Metalfino Usinagem",
    razao: "Metalfino Ind. e Com. Ltda",
    cnpj: "61.234.567/0001-10",
    segmento: "Indústria Metalúrgica",
    cnae: "2599-3/99",
    porte: "EPP",
    cidade: "Sorocaba",
    uf: "SP",
    km: 28,
    whatsapp: "(15) 99100-2200",
    chance: "alta",
    score: 88,
    sinais: [
      { texto: 'Segmento bate com "Indústria Metalúrgica" (segmento-alvo)', pts: 30 },
      { texto: "WhatsApp comercial válido e ativo", pts: 20 },
      { texto: "Site no ar, com página de produtos", pts: 15 },
      { texto: "Porte EPP — dentro da faixa-alvo", pts: 15 },
      { texto: "4,6 estrelas no Google (38 avaliações)", pts: 10 },
      { texto: "A 28 km da sua base — dentro da região", pts: 10 },
    ],
  },
  {
    id: "2",
    nome: "Construtora Vale Verde",
    razao: "Vale Verde Engenharia Ltda",
    cnpj: "62.345.678/0001-21",
    segmento: "Construção Civil",
    cnae: "4120-4/00",
    porte: "Média",
    cidade: "Itu",
    uf: "SP",
    km: 22,
    whatsapp: "(11) 99117-2219",
    chance: "alta",
    score: 79,
    sinais: [],
  },
  {
    id: "3",
    nome: "Transportes Rota Sul",
    razao: "Rota Sul Log. Ltda",
    cnpj: "63.456.789/0001-32",
    segmento: "Logística e Transporte",
    cnae: "4930-2/02",
    porte: "EPP",
    cidade: "Campinas",
    uf: "SP",
    km: 48,
    whatsapp: "(19) 99134-2238",
    chance: "media",
    score: 61,
    sinais: [],
  },
  {
    id: "4",
    nome: "Pedra Nobre Marmoraria",
    razao: "",
    cnpj: "64.567.890/0001-43",
    segmento: "Construção Civil",
    cnae: "2391-5/03",
    porte: "EPP",
    cidade: "Guarulhos",
    uf: "SP",
    km: 62,
    whatsapp: "(11) 99121-2244",
    chance: "duplicado",
    score: 0,
    sinais: [],
    duplicadoInfo: "abordada em 12/05 por Carlos",
  },
  {
    id: "5",
    nome: "Auto Escola Direção Segura",
    razao: "",
    cnpj: "65.678.901/0001-54",
    segmento: "Educação",
    cnae: "8599-6/01",
    porte: "ME",
    cidade: "Santo André",
    uf: "SP",
    km: 78,
    whatsapp: "—",
    chance: "baixa",
    score: 32,
    sinais: [],
  },
];

function ProspeccaoPage() {
  const [expanded, setExpanded] = useState<string | null>("1");
  const [selected, setSelected] = useState<Record<string, boolean>>({ "1": true, "2": true, "3": true });
  const selCount = Object.values(selected).filter(Boolean).length;

  return (
    <AppShell title="Prospecção" subtitle="Busque empresas, veja a chance de negócio e converta em leads">
      <Section title="Busca de empresas" hint="defina a região e o perfil — o score compara cada empresa com o seu cliente ideal">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select label="País" options={["Brasil"]} />
          <Select label="Estado" options={["São Paulo", "Paraná", "Santa Catarina"]} />
          <Field label="Cidade" defaultValue="São Roque" />
          <Select label="Raio de busca" options={["25 km", "50 km", "100 km"]} defaultValue="50 km" />
          <Select label="Segmento" options={["Todos os segmentos", "Indústria Metalúrgica", "Construção Civil"]} defaultValue="Todos os segmentos" />
          <Select label="Porte" options={["Todos", "MEI", "ME", "EPP", "Média", "Grande"]} defaultValue="Todos" />
          <Select label="Origem da busca" options={["Busca ativa", "Google Maps", "Indicação"]} defaultValue="Busca ativa" />
          <div className="md:col-span-3">
            <Field label="Palavra-chave" placeholder="Nome da empresa, fantasia ou segmento..." />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90 inline-flex items-center gap-2">
            <span>◊</span> Buscar empresas
          </button>
          <button className="h-10 px-4 rounded-md border border-border bg-card text-[13px] font-medium hover:bg-muted">
            Salvar esta busca
          </button>
        </div>
      </Section>

      <section className="mt-5 rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-border">
          <div className="text-[13px] font-semibold text-foreground">
            {EMPRESAS.length} RESULTADOS
            <span className="text-muted-foreground font-normal ml-2">{selCount} selecionados</span>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <MiniSelect label="Score: todos" />
            <MiniSelect label="Status: todos" />
            <button className="h-9 px-3 rounded-md border border-primary/40 bg-primary/5 text-primary text-[12px] font-semibold hover:bg-primary/10">
              ◆ Enviar para vendedor virtual
            </button>
            <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90">
              › Enviar para vendedor humano
            </button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-[36px_2fr_1.4fr_1fr_1.2fr_1.3fr_1fr] gap-3 px-5 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
            <div />
            <div>Empresa</div>
            <div>Segmento / CNAE</div>
            <div>Cidade/UF</div>
            <div>WhatsApp</div>
            <div>Chance de negócio</div>
            <div>Enviar para</div>
          </div>
          {EMPRESAS.map((e) => {
            const open = expanded === e.id;
            return (
              <div key={e.id} className="border-b border-border last:border-0">
                <div className="grid grid-cols-[36px_2fr_1.4fr_1fr_1.2fr_1.3fr_1fr] gap-3 px-5 py-3.5 items-center">
                  <input
                    type="checkbox"
                    checked={!!selected[e.id]}
                    onChange={() => setSelected((s) => ({ ...s, [e.id]: !s[e.id] }))}
                    className="h-4 w-4 accent-primary"
                  />
                  <div className={cn("min-w-0", e.chance === "duplicado" && "opacity-60")}>
                    <div className="font-semibold text-foreground text-[13px]">{e.nome}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {e.razao ? `${e.razao} · ` : ""}
                      {e.cnpj}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] text-foreground">{e.segmento}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {e.cnae} · {e.porte}
                    </div>
                  </div>
                  <div className="text-[13px]">
                    <div className="text-foreground">{e.cidade}/{e.uf}</div>
                    <div className="text-[11px] text-muted-foreground">{e.km} km</div>
                  </div>
                  <div className="text-[13px] text-foreground">{e.whatsapp}</div>
                  <div>
                    <ChanceTag chance={e.chance} score={e.score} />
                    {e.chance !== "duplicado" ? (
                      <button
                        onClick={() => setExpanded(open ? null : e.id)}
                        className="block mt-1 text-[11px] text-primary hover:underline"
                      >
                        ver por quê ▾
                      </button>
                    ) : (
                      <div className="text-[11px] text-muted-foreground mt-1">{e.duplicadoInfo}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {e.chance === "duplicado" ? (
                      <span className="h-8 px-3 rounded-md border border-border bg-muted text-[12px] text-muted-foreground inline-flex items-center">
                        Duplicado
                      </span>
                    ) : (
                      <>
                        <button className="h-8 px-2.5 rounded-md border border-primary/40 bg-primary/5 text-primary text-[12px] font-medium hover:bg-primary/10">
                          ◆ IA
                        </button>
                        <button className="h-8 px-2.5 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted">
                          › Humano
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {open && e.sinais.length > 0 && (
                  <div className="bg-muted/40 px-5 py-3 border-t border-border">
                    <div className="space-y-1.5">
                      {e.sinais.map((s) => (
                        <div key={s.texto} className="flex items-center justify-between text-[12.5px]">
                          <span className="text-foreground">{s.texto}</span>
                          <span className="text-primary font-semibold">+{s.pts}</span>
                        </div>
                      ))}
                      <div className="pt-2 mt-1 border-t border-border flex items-center justify-between text-[13px] font-semibold">
                        <span className="text-primary">Total</span>
                        <span className="text-primary">{e.score} / 100</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed max-w-3xl">
        Três acréscimos em relação ao layout original: o score agora é <strong className="text-foreground">explicável</strong> (o vendedor vê o cálculo antes de enviar), leads já abordados aparecem <strong className="text-foreground">marcados como duplicados</strong> em vez de serem prospectados de novo, e o envio já decide <strong className="text-foreground">quem atende</strong> — IA ou humano.
      </p>
    </AppShell>
  );
}

/* Primitives */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="px-5 py-3 border-b border-border">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">+ {title}</div>
        {hint && <div className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
function Field({ label, defaultValue, placeholder }: { label: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] text-muted-foreground mb-1.5">{label}</div>
      <input
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] text-foreground"
      />
    </label>
  );
}
function Select({ label, options, defaultValue }: { label: string; options: string[]; defaultValue?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] text-muted-foreground mb-1.5">{label}</div>
      <select
        defaultValue={defaultValue}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px] text-foreground"
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}
function MiniSelect({ label }: { label: string }) {
  return (
    <select className="h-9 px-2.5 rounded-md border border-input bg-background text-[12px] text-foreground">
      <option>{label}</option>
    </select>
  );
}
function ChanceTag({ chance, score }: { chance: Chance; score: number }) {
  if (chance === "duplicado")
    return <span className="text-[12px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">@ Já na base</span>;
  const cfg = {
    alta: { icon: "🔥", label: "Alta chance", cls: "bg-orange-100 text-orange-700" },
    media: { icon: "◆", label: "Média chance", cls: "bg-primary/10 text-primary" },
    baixa: { icon: "❄", label: "Baixa chance", cls: "bg-sky-100 text-sky-700" },
  }[chance];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full font-semibold", cfg.cls)}>
      <span>{cfg.icon}</span>
      {cfg.label} · {score}
    </span>
  );
}
