import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/app/AppShell";
import { useCompanyProfile, useServicesList } from "@/domain/sdrVirtual";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/empresa-servicos")({
  head: () => ({ meta: [{ title: "Minha Empresa — WF Digital CRM" }] }),
  component: MinhaEmpresaPage,
});

type Tab = "dados" | "ideal" | "servicos" | "cerebro";

const TABS: { id: Tab; label: string }[] = [
  { id: "dados", label: "Dados cadastrais" },
  { id: "ideal", label: "Cliente ideal & score" },
  { id: "servicos", label: "Serviços que presto" },
  { id: "cerebro", label: "Cérebro do vendedor virtual" },
];

function MinhaEmpresaPage() {
  const [tab, setTab] = useState<Tab>("dados");

  return (
    <AppShell
      title="Minha Empresa"
      subtitle="Os dados daqui alimentam o score de leads e o vendedor virtual"
    >
      <p className="text-[13px] text-muted-foreground mb-5">
        Fundação do sistema: tudo que a IA sabe sobre o que você vende, para quem vende e como fala vem desta tela.
      </p>

      <div className="flex flex-wrap gap-1 mb-5">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2 rounded-md text-[13px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dados" && <DadosTab />}
      {tab === "ideal" && <IdealTab />}
      {tab === "servicos" && <ServicosTab />}
      {tab === "cerebro" && <CerebroTab />}
    </AppShell>
  );
}

/* ================================================================
 * TAB 1 — Dados cadastrais
 * ================================================================ */
function DadosTab() {
  const company = useCompanyProfile();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-5">
        <Section title="Identificação">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Razão social" defaultValue={company.razaoSocial} />
            <Field label="Nome fantasia" defaultValue={company.nomeFantasia} />
            <Field label="CNPJ" defaultValue="12.345.678/0001-90" />
            <Field label="Inscrição estadual" defaultValue="Isento" />
            <Select label="Porte" options={["MEI", "ME", "EPP", "Média", "Grande"]} defaultValue="EPP" />
            <div />
            <Field label="Segmento" defaultValue={company.segmento} />
            <Field label="CNAE principal" defaultValue="6201-5/01" />
            <Field label="Endereço" defaultValue="Av. Brasil, 1420 — Centro" />
            <Field label="CEP" defaultValue="18130-000" />
            <Field label="Cidade" defaultValue="São Roque" />
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <Field label="UF" defaultValue="SP" />
              <Field label="Site" defaultValue={company.site.replace(/^https?:\/\//, "")} />
            </div>
            <Field label="Telefone" defaultValue="(11) 3200-4400" />
            <Field label="WhatsApp comercial" defaultValue="(11) 99100-4400" />
            <Field label="E-mail comercial" defaultValue="comercial@wfdigital.com.br" />
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <button className="h-10 px-5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90">
            Salvar alterações
          </button>
          <button className="h-10 px-5 rounded-md border border-border bg-card text-[13px] font-medium hover:bg-muted">
            Cancelar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <Section title="Identidade visual" compact>
          <div className="border border-dashed border-border rounded-lg py-6 px-4 text-center">
            <div className="text-[13px] font-medium text-foreground">Enviar logo</div>
            <div className="text-[11px] text-muted-foreground mt-1">PNG ou SVG — aparece nas propostas</div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] text-muted-foreground mb-1.5">Cor da marca</div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-md border border-border" style={{ background: "#0E6B61" }} />
              <input
                defaultValue="#0E6B61"
                className="flex-1 h-9 px-2 rounded-md border border-input bg-background text-[13px]"
              />
            </div>
          </div>
        </Section>

        <Section title="Horário comercial" compact>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Abre às" defaultValue="08:00" />
            <Field label="Fecha às" defaultValue="18:00" />
          </div>
          <div className="mt-3">
            <div className="text-[11px] text-muted-foreground mb-1.5">Dias</div>
            <div className="flex flex-wrap gap-1.5">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
                <span
                  key={d}
                  className={cn(
                    "text-[12px] px-2.5 py-1 rounded-full border",
                    i < 5
                      ? "border-primary/40 text-primary bg-primary/5"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">IA responde fora do horário</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Mantém o lead aquecido de madrugada e no fim de semana
              </div>
            </div>
            <Toggle defaultOn />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ================================================================
 * TAB 2 — Cliente ideal & score
 * ================================================================ */
function IdealTab() {
  const segmentos = ["Indústria Metalúrgica", "Construção Civil", "Logística e Transporte", "Serviços Contábeis"];
  const sinais = [
    { t: "Segmento bate com os alvos", d: "Aderência ao ICP", p: 30 },
    { t: "Tem WhatsApp válido", d: "Sem canal, não há negociação autônoma", p: 20 },
    { t: "Site ativo", d: "Empresa em operação", p: 15 },
    { t: "Porte na faixa-alvo", d: "Capacidade de pagar o ticket", p: 15 },
    { t: "Boa reputação pública", d: "Google acima de 4,0", p: 10 },
    { t: "Está na região de atuação", d: "", p: 10 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-5">
        <Section
          title="Perfil de cliente ideal"
          hint="a régua que a Prospecção usa"
        >
          <div>
            <div className="text-[11px] text-muted-foreground mb-1.5">Segmentos-alvo</div>
            <div className="flex flex-wrap gap-1.5">
              {segmentos.map((s) => (
                <span
                  key={s}
                  className="text-[12px] px-2.5 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1.5"
                >
                  {s}
                  <button className="text-primary/60 hover:text-primary">×</button>
                </span>
              ))}
              <button className="text-[12px] px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary">
                + adicionar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select label="Porte-alvo" options={["MEI", "ME", "EPP a Média", "Média a Grande"]} defaultValue="EPP a Média" />
            <Field label="Ticket médio esperado" defaultValue="R$ 18.000" />
            <Field label="Região de atuação" defaultValue="São Paulo, Santa Catarina, Paraná" />
            <Field label="Ciclo de venda médio" defaultValue="21 dias" />
          </div>
        </Section>

        <Section title="Sinais que valorizam um lead" hint="o peso define alta / média / baixa chance">
          <div className="divide-y divide-border -mx-5">
            {sinais.map((s) => (
              <div key={s.t} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{s.t}</div>
                  {s.d && <div className="text-[11px] text-muted-foreground mt-0.5">{s.d}</div>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    defaultValue={s.p}
                    className="w-16 h-9 px-2 rounded-md border border-input bg-background text-[13px] text-right"
                  />
                  <span className="text-[11px] text-muted-foreground">pts</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <Section title="Faixas do score" compact>
          <div className="space-y-3">
            <RangeRow color="bg-orange-100 text-orange-700" icon="🔥" label="Alta chance" range="75 a 100 pontos" />
            <RangeRow color="bg-primary/10 text-primary" icon="◆" label="Média chance" range="45 a 74 pontos" />
            <RangeRow color="bg-sky-100 text-sky-700" icon="❄" label="Baixa chance" range="abaixo de 45" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Na Prospecção, o vendedor clica no selo e vê o cálculo aberto — por que aquele lead é alta chance.
          </p>
        </Section>

        <Section title="Descartar automaticamente" compact>
          <div className="space-y-3">
            <ToggleRow label="Empresas sem telefone nem WhatsApp" defaultOn />
            <ToggleRow label="Leads abordados nos últimos 90 dias" hint="Evita queimar o número" defaultOn />
            <ToggleRow label="Concorrentes diretos" defaultOn />
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ================================================================
 * TAB 3 — Serviços que presto
 * ================================================================ */
function ServicosTab() {
  const services = useServicesList();
  const rows = [
    { nome: "Sistema de gestão sob medida", cat: "Software", desc: "ERP customizado para a operação do cliente", preco: "R$ 24.000", unid: "projeto", prazo: "90 dias", desc_ia: "até 10%" },
    { nome: "Automação de atendimento", cat: "IA / WhatsApp", desc: "Assistente virtual no WhatsApp do cliente", preco: "R$ 1.890", unid: "/mês", prazo: "15 dias", desc_ia: "até 15%" },
    { nome: "Site institucional", cat: "Web", desc: "Site responsivo com SEO e captação", preco: "R$ 6.500", unid: "projeto", prazo: "30 dias", desc_ia: "até 12%" },
    { nome: "Suporte e sustentação", cat: "Recorrente", desc: "Manutenção mensal com SLA de 4 horas", preco: "R$ 950", unid: "/mês", prazo: "imediato", desc_ia: "até 8%" },
  ];
  // fallback: still show more if domain has additional services
  const extra = services.slice(rows.length).map((s) => ({
    nome: s.nome,
    cat: s.categoria,
    desc: s.descricaoCurta,
    preco: s.faixaTicket ?? "—",
    unid: "",
    prazo: s.prazoInformavel,
    desc_ia: "—",
  }));
  const all = [...rows, ...extra];

  return (
    <Section
      title="Serviços prestados"
      hint="a IA só oferece o que estiver aqui"
      action={
        <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90">
          + Novo serviço
        </button>
      }
    >
      <div className="-mx-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
              <th className="px-5 py-2.5 font-medium">Serviço</th>
              <th className="px-5 py-2.5 font-medium">Descrição</th>
              <th className="px-5 py-2.5 font-medium">Preço base</th>
              <th className="px-5 py-2.5 font-medium">Prazo</th>
              <th className="px-5 py-2.5 font-medium">Desconto máx. da IA</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {all.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-foreground">{r.nome}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{r.cat}</div>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground max-w-sm">{r.desc}</td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-foreground">{r.preco}</div>
                  {r.unid && <div className="text-[11px] text-muted-foreground">{r.unid}</div>}
                </td>
                <td className="px-5 py-3.5 text-foreground">{r.prazo}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {r.desc_ia}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right pr-5">
                  <button className="h-8 px-3 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ================================================================
 * TAB 4 — Cérebro do vendedor virtual
 * ================================================================ */
function CerebroTab() {
  const objecoes = [
    { q: "\u201CEstá caro\u201D", a: "Reposiciona pelo custo de um atendente contratado e oferece o plano mensal sem fidelidade." },
    { q: "\u201CVou pensar\u201D", a: "Agenda retorno em 3 dias e envia um caso de sucesso do mesmo segmento." },
    { q: "\u201CJá tenho fornecedor\u201D", a: "Pergunta o que falta no atual e propõe teste paralelo de 14 dias." },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-5">
        <Section title="Como o vendedor virtual se comporta">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nome do assistente" defaultValue="Ana" />
            <Select label="Tom de voz" options={["Consultivo e direto", "Amigável", "Formal", "Descontraído"]} defaultValue="Consultivo e direto" />
            <Select label="Trata o cliente por" options={["Você", "Senhor(a)", "Primeiro nome"]} defaultValue="Você" />
          </div>

          <div className="mt-4">
            <div className="text-[11px] text-muted-foreground mb-1.5">Mensagem de abertura</div>
            <textarea
              rows={3}
              defaultValue="Olá, {primeiro_nome}! Aqui é a Ana, da WF Digital. Vi que a {empresa} atua com {segmento} e trabalhamos com automação de atendimento para empresas como a sua. Faz sentido eu te mostrar como funciona em 5 minutos?"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-[13px] resize-none"
            />
            <div className="text-[11px] text-primary/80 mt-1">Variáveis: {"{primeiro_nome} {empresa} {segmento} {cidade}"}</div>
          </div>

          <div className="mt-4">
            <div className="text-[11px] text-muted-foreground mb-1.5">Argumentos de venda</div>
            <textarea
              rows={5}
              defaultValue={`— Atendimento 24h sem aumentar o time\n— Implantação em 15 dias, sem trocar o número de WhatsApp\n— Cliente médio recupera o investimento em 3 meses\n— Contrato mensal, sem fidelidade`}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-[13px] resize-none font-medium text-foreground"
            />
          </div>
        </Section>

        <Section
          title="Objeções e respostas"
          hint="a IA usa exatamente estas respostas"
          action={
            <button className="h-9 px-3 rounded-md border border-border bg-card text-[13px] font-medium hover:bg-muted">
              + Nova
            </button>
          }
        >
          <div className="-mx-5">
            <div className="grid grid-cols-[1fr_1.6fr_auto] gap-4 px-5 py-2 text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border">
              <div>Quando o cliente disser</div>
              <div>A IA responde</div>
              <div />
            </div>
            {objecoes.map((o) => (
              <div
                key={o.q}
                className="grid grid-cols-[1fr_1.6fr_auto] gap-4 px-5 py-3.5 items-start border-b border-border last:border-0"
              >
                <div className="font-medium text-foreground text-[13px]">{o.q}</div>
                <div className="text-[13px] text-muted-foreground">{o.a}</div>
                <button className="h-8 px-3 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted">
                  Editar
                </button>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <Section title="Testar a IA" compact>
          <p className="text-[12px] text-muted-foreground mb-3">
            Converse como um lead faria, antes de soltá-la em produção.
          </p>
          <div className="space-y-2 text-[12px]">
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <span className="font-semibold text-primary">Ana:</span> Olá, Marcos! Aqui é a Ana, da WF Digital…
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-foreground">
              <span className="font-semibold">Você:</span> tá caro isso aí
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <span className="font-semibold text-primary">Ana:</span> Entendo. Um atendente dedicado custa cerca de R$ 3.200/mês com encargos…
            </div>
          </div>
          <input
            placeholder="Escreva como se fosse o cliente…"
            className="w-full h-10 px-3 mt-3 rounded-md border border-input bg-background text-[13px]"
          />
          <button className="w-full h-10 mt-2 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90">
            Simular conversa
          </button>
        </Section>

        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="text-[13px] font-semibold text-amber-900">Nada aqui é opcional.</div>
          <div className="text-[12px] text-amber-800 mt-1">
            Campos em branco viram improviso da IA na frente do cliente.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
 * Reusable primitives
 * ================================================================ */
function Section({
  title,
  hint,
  action,
  compact,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className={cn("flex items-center justify-between gap-3 px-5 border-b border-border", compact ? "py-2.5" : "py-3")}>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">{title}</div>
          {hint && <div className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</div>}
        </div>
        {action}
      </div>
      <div className={cn(compact ? "p-4" : "p-5")}>{children}</div>
    </section>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="block">
      <div className="text-[11px] text-muted-foreground mb-1.5">{label}</div>
      <input
        defaultValue={defaultValue}
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
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      role="switch"
      aria-checked={on}
      className={cn("shrink-0 h-6 w-11 rounded-full relative transition-colors", on ? "bg-primary" : "bg-muted")}
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all", on ? "right-0.5" : "left-0.5")} />
    </button>
  );
}

function ToggleRow({ label, hint, defaultOn }: { label: string; hint?: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <Toggle defaultOn={defaultOn} />
    </div>
  );
}

function RangeRow({ color, icon, label, range }: { color: string; icon: string; label: string; range: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn("inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full font-medium", color)}>
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-[12px] text-muted-foreground">{range}</span>
    </div>
  );
}
