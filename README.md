# WF Digital Leads — CRM 3.0 + Correções 4.0

CRM B2B de prospecção, pipeline comercial e **SDR Virtual** com aprovação humana. Frontend TanStack Start / React 19 / Tailwind v4. **Sem banco de dados** — todos os dados são in-memory (seed) para demonstração.

> ⚠️ **SANDBOX DEMO** — Nenhuma integração externa envia mensagens reais. Toda operação (WhatsApp/Z-API, Apify, Vibe, IA) está rotulada como Sandbox nas telas.

---

## Como acessar

1. Rode o dev server (auto-start pelo Lovable) e abra o preview.
2. Login: `fabricio@wfdigital.com.br` · senha `demo123` (ou qualquer usuário demo listado na tela de login).

---

## Escopo entregue

### Estratégia / Cadastro
- Empresa & Serviços, Perfis de Busca, Personas, ICP, Territórios (aba Estratégia).
- Base de conhecimento e políticas do SDR (11 guardrails: tom, opt-out, sem preços, escalonamento etc.).

### Prospecção
- Buscas Vibe/Apify em modo **sandbox** (resultados fictícios).
- **Importação de listas CSV/XLSX 100% no navegador** (`papaparse` + `xlsx` SheetJS Community): upload → mapeamento de colunas → dedupe → criar lista.
- Listas de leads com contadores de válidos/duplicados/bloqueados.

### Cadências & Campanhas
- Editor visual de cadências multicanal (apresentação, follow-up, handoff…).
- Playbooks por persona/estágio, Scoring (BANT/CHAMP), Campanhas.

### SDR Virtual (modo padrão: **Semiautomático**)
- **Simulador SDR** (rota `/simulador`): converse como lead e veja o SDR aplicar tom + base de conhecimento + guardrails.
- Cada resposta do simulador **gera um rascunho** e cai na **fila da Central** para aprovação humana.
- **Central de Conversas**: fila de rascunhos com aprovar / editar / descartar. Guardrails aparecem como chips coloridos (info / warn / block). Rascunho com guardrail `block` não pode ser aprovado sem edição.
- Motor determinístico em `src/domain/sdrEngine.ts` (sem IA real ativada).

### Handoffs
- Geração automática a partir do simulador quando o SDR sinaliza intenção alta.
- Board de handoffs com status (Aguardando / Aceito / Devolvido / Concluído).

### Relatórios
- Dashboard comercial (Recharts) e **Relatórios do SDR** (heat médio, taxa de aceite, distribuição de status, motivos de conversão).

### Portal & Configurações
- Portal do funcionário.
- Configurações → Integrações mostrando status **Sandbox** de Z-API / Vibe / Apify / IA.

---

## Arquitetura

```
src/
  routes/                 # File-based routing TanStack
  domain/                 # Tipos, seed, motor SDR, scoring, campanhas, playbooks
  repositories/           # Stores in-memory (Store<T>) + hooks
  providers/              # Interfaces plugáveis (Auth/Data/Messaging/Prospecting/AI)
  components/             # UI compartilhada (GlobalSearch, LeadListImporter)
  app/                    # Shell (Sidebar, TopBar, AppShell)
  auth/                   # AuthProvider demo (sessionStorage)
```

**Providers plugáveis (`src/providers/interfaces.ts`)**: `AuthProvider`, `DataProvider`, `MessagingProvider`, `ProspectingProvider`, `AIProvider`. Hoje todos apontam para implementações `demo`. Trocar por Supabase/Z-API/Apify/Vibe se resume a implementar cada interface e registrar em `providers/index.ts` — nenhuma tela precisa ser reescrita.

---

## Backlog para produção (fora do escopo demo)

1. **Ligar Lovable Cloud** (Supabase gerenciado) para persistência real, autenticação e RLS.
2. **Substituir providers demo** pelos reais:
   - Auth: Supabase Auth (email + Google/Apple).
   - Messaging: Z-API (webhook + envio) — endpoint dedicado em `src/routes/api/public/zapi.ts` com verificação de assinatura.
   - Prospecting: Apify (actors LinkedIn/Google Maps) + Vibe.
   - AI: Lovable AI Gateway para classificação de intenção e sugestão de resposta.
3. **RLS**: tabelas `leads`, `contacts`, `conversations`, `sdr_drafts`, `handoffs`, `lead_lists`, `imports`, `user_roles` — políticas por `has_role(auth.uid(), 'admin' | 'gestor' | 'vendedor' | 'atendente')`.
4. **Auditoria**: log imutável de aprovações de rascunho, edições e envios de mensagem.
5. **Modo Automático** do SDR: só após validação humana das taxas de acerto no modo Semiautomático + kill-switch por serviço.
6. **QA final**: testes E2E com Playwright em cima da Central, Simulador e Importador.

---

## Convenções

- **Nenhum envio real** sai da demo. Toda ação de mensageria é simulada.
- **Modo SDR padrão**: `Semiautomático` (constante `DEFAULT_SDR_MODE` em `src/domain/sdrVirtual.ts`). Nunca ativar `Automático (futuro)` sem backend real + kill-switch.
- **Labels obrigatórios**: qualquer tela que toque integração externa deve exibir o badge **SANDBOX DEMO**.
