
# Fase 0 — Auditoria e Plano (WF Digital CRM)

Nada será codificado até você responder **APROVADO**. Abaixo está o levantamento completo e o plano em fases.

---

## 1. Inventário do projeto atual

**Stack instalado (package.json):** TanStack Start v1 + React 19 + TypeScript, TanStack Router, TanStack Query, Tailwind v4 (via `@tailwindcss/vite` + `src/styles.css`), Radix UI completo (shadcn base), Lucide, Recharts, React Hook Form, Sonner, date-fns, cmdk, embla, react-resizable-panels, react-day-picker, input-otp, class-variance-authority.

**Faltando (a instalar):** `zod`, `@hookform/resolvers/zod` (resolver já está), `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`, `libphonenumber-js` (normalização de telefone BR/internacional), `xlsx` (importação XLSX).

**Estrutura atual:**
```
src/
  routes/  __root.tsx, index.tsx, README.md   ← só o esqueleto TanStack
  components/ui/                              ← shadcn primitives
  hooks/  lib/                                ← utilitários base
  router.tsx, server.ts, start.ts, styles.css, routeTree.gen.ts
```

**Rotas existentes:** apenas `/` (placeholder). **Nenhuma** feature do CRM foi construída.
**Banco:** não conectado (correto — Lovable Cloud NÃO será ativado nesta etapa).
**Integrações:** nenhuma. Sem secrets configurados.

---

## 2. Mapeamento telas ↔ rotas ↔ componentes

| Ref | Rota | Componentes-chave |
|---|---|---|
| Tela 1 Login | `/login`, `/recuperar-senha` | `LoginPage`, `AuthProvider` (demo), `PasswordField` |
| Shell | (layout `_app`) | `AppShell`, `Sidebar`, `TopBar`, `GlobalSearch`, `NotificationBell`, `UserCard` |
| Tela 2 Dashboard | `/dashboard` | `KpiRow`, `KpiCard`, `UpcomingTasksCard`, `TeamActivityFeed`, `PeriodFilter` |
| Tela 3 Leads | `/leads` | `LeadsFilters`, `LeadsKanban` (dnd-kit), `LeadCard`, `LeadsTable`, `NewLeadDialog`, `StageChangeDialog` |
| Tela 4 Detalhe | `/leads/$leadId` | `LeadHeader`, `StageStepper`, `CompanyCard`, `ContactCard`, `NotesCard`, `TasksCard`, `TimelineCard`, `ConversationPanel` |
| Tela 5 Prospecção | `/prospeccao` | `ProspectingSearchForm`, `ProviderPicker` (Vibe/Apify/CSV), `ResultsTable`, `ConvertDialog`, `DedupeConflictDialog`, `ApifyRunPanel` |
| Tela 6 Relatórios | `/relatorios` | `ReportFilters`, `FunnelByStageChart`, `LeadsBySellerChart`, `LeadsBySourceChart`, `FunnelSummaryTable`, `ExportMenu` |
| Tela 7 Config | `/configuracoes` + subrotas | Tabs: `TeamCard`, `UsersManagement`, `PipelineEditor`, `TeamsQueues`, `Integrations` (Z-API/Vibe/Apify), `Templates`, `Notifications`, `AuditLog` |
| Tela 8 Atendimentos | `/atendimentos`, `/atendimentos/$conversationId` | `ConversationList`, `ConversationThread`, `MessageComposer`, `ConversationContextPanel`, `AssignDialog`, `SlaBadge` |
| Tela 9 Meu dia | `/portal` | `AvailabilityToggle`, `MyQueueCard`, `MyTasksCard`, `MyChannelCard` |
| Tela 10 Portal atend. | `/portal/atendimentos`, `/portal/atendimentos/$conversationId`, `/portal/leads`, `/portal/tarefas`, `/portal/perfil` | Reuso restrito dos componentes de Atendimento com guard de papel |
| Extras | `/empresas`, `/empresas/$companyId`, `/servicos` | `CompaniesList`, `CompanyDetail`, `ServicesCatalog` |

Total: **~24 rotas** (páginas + subrotas de config e portal).

---

## 3. Módulos obrigatórios, lacunas e riscos

**Módulos:** Auth+Guards, Shell/Nav, Dashboard, Empresas, Serviços, Prospecção (Vibe + Apify + CSV/XLSX), Leads (Kanban + Lista + Detalhe + Timeline), Atendimentos (Central + adapter Z-API), Portal Funcionário, Relatórios, Configurações (7 subtabs), Auditoria, Notificações, Tarefas.

**Lacunas técnicas:** dnd-kit, zod, xlsx, libphonenumber-js não instalados; nenhum design token além do default Tailwind; sem AuthProvider; sem camada de repositories; sem seed.

**Riscos:**
- Z-API / Vibe / Apify exigem **backend seguro**. Sem ele: entregaremos os *adapters*, telas de configuração e **modo sandbox** claramente rotulado. Nada de token no cliente.
- Vibe Prospecting não publica API pública amplamente documentada → conector fica "Aguardando credenciais" com fluxo de importação/exportação estruturado.
- Apify: usar `https://api.apify.com/v2` (Actors, Tasks, Runs, Datasets). Console é só painel.
- Volume: Kanban + Central + Timeline em memória são OK no seed; documentar paginação para o futuro backend.
- LGPD: seed usa dados fictícios explicitamente rotulados.

**Suposições:**
- Login demo com usuários fictícios do seed (Fabrício Admin, Carlos SDR, Marina, Patrícia, Roberto).
- Sessão de 8h persistida em memória + `sessionStorage` (não localStorage) sem dados sensíveis.
- Sem backend seguro nesta entrega → toda integração externa fica em **modo sandbox** com badge visível.

---

## 4. Arquitetura recomendada

**Camadas:**
```
src/
  app/           AppShell, guards, providers
  auth/          AuthProvider (demo), useAuth, RequireRole
  domain/        types (Lead, Company, Conversation, Task, User, ...)
  repositories/  interfaces + DemoImpl (in-memory, seed-backed)
  services/      LeadService, ConversationService, ProspectingService, MessagingService
  providers/     integrations/{zapi,vibe,apify}/  (adapters + sandbox mode)
  seed/          demoData.ts (tipado, único)
  features/<módulo>/  páginas + componentes específicos
  components/ui/      shadcn (existente)
  routes/             TanStack file-based, apenas wiring
```

**Contratos-chave (TypeScript):**
- `AuthProvider`: `signIn`, `signOut`, `session`, `hasRole`, `hasPermission`.
- `LeadRepository`, `CompanyRepository`, `TaskRepository`, `ConversationRepository`, `SettingsRepository`, `AuditRepository`, `NotificationRepository`.
- `ProspectingProvider`: `searchCompanies(query)`, `enrichCompany(id)`, `status()`.
- `MessagingProvider`: `sendMessage`, `onIncomingWebhook`, `syncStatus`, `connect`, `disconnect`, `status()`.
- Todo dado consumido via hooks `useLeads()`, `useConversations()`, etc., nunca importando o seed direto.

**Diagrama textual (entidades principais):**
```
Organization 1─┬─* User ─* Membership─* Team ─* Queue
               ├─* Company ─* Contact
               ├─* Lead ─(stage) ─* Activity/Note/Task
               │        └─ assigned_to User
               ├─* Conversation ─* Message
               │        └─ assignments[] (histórico)
               ├─* Service / Proposal
               ├─* ProspectingSearch ─* Result
               └─* AuditLog / Notification / IntegrationConfig (só metadados)
```

**Estratégia futura de banco/RLS (documentada, não conectada):** Postgres + RLS por `organization_id`, `has_role()` SECURITY DEFINER, `user_roles` separado, policies negando por padrão, credenciais só em `integration_configs` server-side, storage `orgId/conversationId/uuid`. **Não será executado nesta fase.**

---

## 5. Matriz de permissões (resumo)

| Ação | Admin | Gestor | Vendedor/SDR | Atendente | Leitor |
|---|:-:|:-:|:-:|:-:|:-:|
| Dados da org | Total | Equipe | Próprios | Próprios | Leitura autorizada |
| Usuários/Integrações/Pipeline | ✅ | ❌ | ❌ | ❌ | ❌ |
| CRUD leads | ✅ | Equipe | Próprios | Limitado | ❌ |
| Atribuir/transferir | ✅ | Equipe | Solicitar | Solicitar | ❌ |
| Central Atendimentos | Total | Equipe | Atribuídas | Atribuídas | ❌ |
| Enviar mensagem canal | ✅ | Equipe | Atribuídas | Atribuídas | ❌ |
| Relatórios | Total | Equipe | Individuais | Individuais | Limitado |
| Exportar | ✅ | Delegado | ❌ | ❌ | ❌ |
| Auditoria | ✅ | Limitada | ❌ | ❌ | ❌ |

Aplicada em: `AuthProvider.hasPermission` → guards de rota → menu → botões → services. Documentado que RLS futura é obrigatória.

---

## 6. Fluxos de negócio principais

- **Prospecção → Lead:** buscar (Vibe/Apify/CSV) → resultados com fonte/data/confiabilidade → seleção → dedup por CNPJ/domínio/telefone/similaridade nome → diálogo de conflito (abrir/mesclar/forçar-admin) → conversão em massa com responsável/etapa/tags/origem/score → cria Lead + Activity + Company + Contact.
- **Kanban:** drag → validação → mudança de etapa → se Fechado exige valor+data, se Perdido exige motivo → optimistic update com rollback + audit.
- **Atendimento:** webhook Z-API (sandbox) → normaliza phone/chatLid idempotente → cria/liga Conversation e Contact → distribui por fila/capacidade/skill/horário → lock ao assumir → thread + composer com template obrigatório fora da janela → transferência gera assignment histórico + audit → resolver exige motivo se houver lead/tarefa aberta.
- **Portal:** funcionário só vê suas conversas/leads/tarefas; disponibilidade (Disponível/Atendimento/Pausa/Ausente/Offline) com motivo em pausa; ações limitadas por papel; toda ação reflete na Central principal.
- **Relatórios:** filtros → agregações por etapa/vendedor/origem → previsão ponderada = Σ(valor × probabilidade da etapa) para leads abertos → exportação conforme papel.

---

## 7. Plano de implementação (fases após APROVADO)

**Fase 1 — Fundação (dia 1)**
- Instalar deps faltantes (zod, dnd-kit, xlsx, libphonenumber-js).
- Design tokens em `src/styles.css` (paleta verde-petróleo, cinzas azulados, radius, sombras).
- `AppShell` + `Sidebar` + `TopBar` + tema.
- `AuthProvider` demo + guards (`_authenticated`, `_admin`, `_portal`).
- Rotas vazias criadas para eliminar 404s.
- **Aceite:** shell responsivo idêntico à referência; login demo funcional; guards bloqueiam rotas.

**Fase 2 — Domínio, seed e repositories**
- Types em `domain/`; interfaces em `repositories/`; `DemoDataProvider` com seed dos ~12 leads e 24 resultados de prospecção; hooks TanStack Query.
- Auditoria simulada e notificações.
- **Aceite:** hooks funcionam, dados consistentes entre telas, badge "Ambiente de demonstração" visível.

**Fase 3 — CRM base**
- Login, Dashboard (KPIs + Próximas tarefas + Atividade), Empresas + detalhe, Serviços, Leads (Kanban dnd-kit + Lista + filtros), Detalhe do Lead com Timeline e painel de conversa, Relatórios (Recharts), Configurações (todas as 7 subtabs com CRUD demo).
- **Aceite:** todos os fluxos operam sobre o repositório demo; nenhum mock espalhado.

**Fase 4 — Prospecção e integrações (sandbox)**
- `ProspectingProvider` com 3 implementações: Vibe (aguardando credenciais + import), Apify (form Actor/Task ID, input JSON, run mock, dataset mock, mapeamento de colunas), CSV/XLSX real.
- Deduplicação transacional em memória.
- Card de integração em Configurações → Integrações com status/links oficiais (`vibeprospecting.ai`, `docs.apify.com/api/v2`, `console.apify.com`).
- **Aceite:** conversão em massa sem duplicar; import CSV real funciona; adapters isolados.

**Fase 5 — Atendimento + Z-API adapter**
- `MessagingProvider` com `ZApiMessagingProvider` em modo sandbox (simula envio, entrega, leitura, webhook idempotente).
- Central de Atendimentos completa (3 painéis, filas, SLA, atribuição transacional com lock, transferência auditável, templates, janela 24h).
- Compartilhamento do `ConversationRepository` entre Central, detalhe do Lead e Portal.
- **Aceite:** nenhum token no cliente; badge "Sandbox — aguardando backend seguro"; conflito de atribuição bloqueado.

**Fase 6 — Portal do Funcionário**
- `/portal` (Meu dia), `/portal/atendimentos`, `/portal/leads`, `/portal/tarefas`, `/portal/perfil`.
- Sidebar reduzida; sem acesso a config global/integrações/exportação.
- Disponibilidade com motivo de pausa.
- **Aceite:** funcionário só enxerga sua carteira; ações refletem na Central.

**Fase 7 — Qualidade e entrega**
- Testes manuais (checklist por papel/rota), responsividade (1440/tablet/mobile), a11y (foco visível, ARIA, contraste), prefers-reduced-motion, revisão visual comparando às 7 imagens.
- README + documento `docs/DATA-MODEL.md`, `docs/RLS-FUTURE.md`, `docs/INTEGRATIONS.md`.
- **Aceite:** todos os 15 critérios do prompt atendidos.

---

## 8. Decisões que preciso confirmar com você

1. **Ordem de entrega:** posso entregar as Fases 1+2 juntas no primeiro turno após APROVADO (elas são pré-requisito de tudo) e depois uma fase por turno? Ou prefere fase-a-fase desde o início?
2. **Persistência entre reloads:** pode usar `sessionStorage` para manter a demo (só dados fictícios, com botão "Restaurar demonstração")? Sem localStorage para nada sensível.
3. **Backend seguro para Z-API/Apify/Vibe:** confirmo que **não** vou usar Lovable Cloud nesta entrega — os adapters ficam em sandbox e as chamadas reais ficam bloqueadas até você aprovar uma fase futura de backend. OK?
4. **Vibe Prospecting:** sem documentação pública de API que eu possa integrar sem credencial, entrego o conector como "Aguardando credenciais" + importação estruturada. Confirma?

Aguardo **APROVADO** (e as respostas às 4 decisões acima) para iniciar a Fase 1.
