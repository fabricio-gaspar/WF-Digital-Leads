import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leads/$leadId")({
  head: () => ({ meta: [{ title: "Detalhe do lead — WF Digital CRM" }] }),
  component: LeadDetailPage,
});

const ETAPAS = ["Prospecção", "Qualificado", "Proposta", "Negociação", "Fechado", "Pedido", "Perdido"];
const ETAPA_ATUAL = 3;

function LeadDetailPage() {
  return (
    <AppShell title="Leads" subtitle="Pipeline de leads e contato por WhatsApp">
      <div className="mb-5 inline-flex bg-card border border-border rounded-lg p-1">
        <Link to="/leads" className="px-4 py-1.5 rounded-md text-[13px] font-semibold text-muted-foreground hover:text-foreground">
          Kanban
        </Link>
        <button className="px-4 py-1.5 rounded-md text-[13px] font-semibold bg-primary text-primary-foreground shadow-sm">
          Detalhe do lead
        </button>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center font-bold text-[13px] shrink-0">AV</div>
            <div>
              <h2 className="text-[18px] font-bold text-foreground">Metalúrgica Aço Vale Indústria Ltda</h2>
              <div className="text-[12px] text-muted-foreground mt-0.5">
                Aço Vale · Indústria Metalúrgica · Score 91 ·
                <span className="inline-flex items-center gap-1 ml-2 text-orange-700 font-semibold">🔥 Quente</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-md border border-border bg-card text-[13px] font-medium hover:bg-muted">📞 Ligar</button>
            <button className="h-9 px-3 rounded-md border border-border bg-card text-[13px] font-medium hover:bg-muted">✉ E-mail</button>
            <button className="h-9 px-3 rounded-md border border-border bg-card text-[13px] font-medium hover:bg-muted">+ Nova tarefa</button>
            <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-semibold hover:bg-primary/90">Salvar</button>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-1.5 mt-5">
          {ETAPAS.map((e, i) => {
            const done = i < ETAPA_ATUAL;
            const current = i === ETAPA_ATUAL;
            return (
              <div key={e} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold",
                    done && "bg-primary/10 text-primary",
                    current && "bg-primary text-primary-foreground",
                    !done && !current && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? "✓" : current ? "●" : ""} {e}
                </span>
                {i < ETAPAS.length - 1 && <span className="text-border">—</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_360px] gap-4">
        {/* Left: Empresa + Contato */}
        <div className="space-y-4">
          <Card title="Empresa">
            <KV k="CNPJ" v="89.012.345/0001-67" />
            <KV k="Segmento" v="Metalúrgica" />
            <KV k="CNAE" v="2599-3/99" />
            <KV k="Porte" v="Média" />
            <KV k="Cidade/UF" v="Joinville/SC" />
            <KV k="Origem" v="Busca ativa" />
            <KV k="Dias no funil" v="42 dias" />
          </Card>
          <Card title="Contato">
            <KV k="Nome" v="Marcos Tavares" />
            <KV k="Cargo" v="Diretor Comercial" />
            <KV k="WhatsApp" v="(47) 99911-7834" />
          </Card>
        </div>

        {/* Middle: Orçamento + Nota + Timeline */}
        <div className="space-y-4">
          <Card title="Orçamento vinculado" action={<button className="h-8 px-3 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted">Inserir no chat</button>}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-foreground">Proposta #0142</div>
                <div className="text-[12px] text-muted-foreground">Automação de atendimento · 12 meses</div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold text-foreground">R$ 22.680</div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">10% desc.</span>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground mt-2">Gerada pela Ana a partir do catálogo. Dentro da alçada de 10%.</div>
          </Card>

          <Card title="Adicionar nota">
            <input placeholder="Escreva uma nota e pressione Enter..." className="w-full h-10 px-3 rounded-md border border-input bg-background text-[13px]" />
          </Card>

          <Card title="Timeline">
            <div className="space-y-3">
              <Event icon="⚠" iconCls="bg-amber-100 text-amber-700" title="Ana escalou a conversa" desc='pergunta fora da base de conhecimento ("integração com Bling?")' meta="hoje, 12:40 · IA" />
              <Event icon="◆" iconCls="bg-primary/10 text-primary" title="Ana enviou a proposta #0142" desc="com 10% de desconto por contrato de 12 meses" meta="hoje, 12:34 · IA" />
              <Event icon="◆" iconCls="bg-primary/10 text-primary" title="Ana qualificou o lead" desc="orçamento confirmado, decisor identificado" meta="ontem, 15:02 · IA" />
              <Event icon="◉" iconCls="bg-muted text-foreground" title="Lead criado pela Prospecção" desc="score 91, alta chance" meta="29/05/2026 · Roberto KA" />
            </div>
          </Card>
        </div>

        {/* Right: WhatsApp chat */}
        <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-[12px]">M</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground">Marcos Tavares</div>
                <div className="text-[11px] text-muted-foreground">(47) 99911-7834 · <span className="text-primary">online</span></div>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase">WhatsApp</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
              <div className="text-[12px]">
                <div className="font-semibold text-primary">◆ Ana está conduzindo</div>
                <div className="text-[11px] text-muted-foreground">escalou às 12:40 e aguarda você</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold">Assumir</button>
                <button className="h-7 px-2.5 rounded-md border border-border bg-card text-[11px] font-medium">Devolver p/ IA</button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-y-auto text-[12.5px] max-h-[500px]">
            <div className="text-center text-[10px] text-muted-foreground">hoje</div>
            <Bubble who="ia" name="◆ Ana (IA)" text="Marcos, proposta revisada enviada! Podemos fechar amanhã às 10h?" time="12:34" />
            <Bubble who="lead" text="Legal. Só uma coisa: vocês têm integração com o Bling?" time="12:39" />
            <Bubble who="ia" name="◆ Ana (IA) — escalou" text="Ótima pergunta, Marcos. Vou confirmar isso internamente e já te retorno com a resposta certa." time="12:40" />
            <Bubble who="humano" name="› Fabrício (humano)" text="Marcos, aqui é o Fabrício. Sim, temos integração nativa com o Bling — te mando a documentação agora." time="12:52" />
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 mt-2">
              <div className="text-[10px] uppercase tracking-wide text-primary font-semibold">◆ Sugestão da Ana</div>
              <div className="text-[12px] text-foreground mt-1">"Marcos, seguindo: a integração com o Bling é nativa e já vem no plano. Fechamos amanhã às 10h?"</div>
              <div className="text-[11px] text-muted-foreground mt-1">— aprovar e enviar</div>
            </div>
          </div>

          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <input placeholder="Escreva uma mensagem..." className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-[13px]" />
              <button className="h-9 px-3 rounded-md border border-border bg-card text-[12px] font-medium hover:bg-muted">Templates</button>
              <button className="h-9 w-9 rounded-md bg-primary text-primary-foreground grid place-items-center hover:bg-primary/90">›</button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed max-w-3xl">
        Acréscimos ao layout original: barra de <strong className="text-foreground">controle da IA</strong> (assumir / devolver), <strong className="text-foreground">autoria visível</strong> em cada mensagem (roxo = IA, verde = humano) para auditoria, <strong className="text-foreground">sugestão da IA</strong> no modo copiloto e <strong className="text-foreground">orçamento inserível no chat</strong> sem sair da tela.
      </p>
    </AppShell>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">{title}</div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px] border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-semibold text-foreground">{v}</span>
    </div>
  );
}
function Event({ icon, iconCls, title, desc, meta }: { icon: string; iconCls: string; title: string; desc: string; meta: string }) {
  return (
    <div className="flex gap-3">
      <div className={cn("h-7 w-7 rounded-full grid place-items-center text-[12px] shrink-0", iconCls)}>{icon}</div>
      <div className="min-w-0 pb-2 border-b border-border/40 flex-1">
        <div className="text-[13px] text-foreground"><span className="font-semibold">{title}</span> — {desc}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{meta}</div>
      </div>
    </div>
  );
}
function Bubble({ who, name, text, time }: { who: "ia" | "humano" | "lead"; name?: string; text: string; time: string }) {
  if (who === "lead") {
    return (
      <div className="max-w-[85%]">
        <div className="rounded-lg bg-muted px-3 py-2 text-foreground">{text}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{time}</div>
      </div>
    );
  }
  const cls = who === "ia" ? "bg-primary/5 border border-primary/20" : "bg-emerald-50 border border-emerald-200";
  const nameCls = who === "ia" ? "text-primary" : "text-emerald-700";
  return (
    <div className="max-w-[85%] ml-auto">
      <div className={cn("rounded-lg px-3 py-2", cls)}>
        {name && <div className={cn("text-[10px] font-semibold mb-0.5", nameCls)}>{name}</div>}
        <div className="text-foreground">{text}</div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 text-right">{time} ✓✓</div>
    </div>
  );
}
