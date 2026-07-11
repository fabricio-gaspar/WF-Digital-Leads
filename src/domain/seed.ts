// Seed único e tipado — dados fictícios para demonstração.
// NUNCA importar diretamente em componentes. Use hooks/repositories.
import type {
  Activity,
  ChannelAccount,
  Company,
  Contact,
  Conversation,
  Lead,
  Message,
  MessageTemplate,
  Notification,
  ProspectingResult,
  Queue,
  Service,
  Task,
  Team,
  User,
} from "./types";

const iso = (offsetHours = 0) =>
  new Date(Date.now() + offsetHours * 3600 * 1000).toISOString();
const days = (n: number) => iso(-n * 24);

export const users: User[] = [
  { id: "u-admin", name: "Fabrício Admin", email: "fabricio@wfdigital.com.br", role: "admin", active: true, avatarInitials: "FA", teamId: "t-com", availability: "disponivel" },
  { id: "u-gestor", name: "Patrícia CX", email: "patricia@wfdigital.com.br", role: "gestor", active: true, avatarInitials: "PC", teamId: "t-com", availability: "disponivel" },
  { id: "u-vend1", name: "Carlos SDR", email: "carlos@wfdigital.com.br", role: "vendedor", active: true, avatarInitials: "CS", teamId: "t-com", availability: "em_atendimento" },
  { id: "u-vend2", name: "Marina Vendas", email: "marina@wfdigital.com.br", role: "vendedor", active: true, avatarInitials: "MV", teamId: "t-com", availability: "disponivel" },
  { id: "u-vend3", name: "Roberto KA", email: "roberto@wfdigital.com.br", role: "vendedor", active: true, avatarInitials: "RK", teamId: "t-com", availability: "pausa" },
  { id: "u-atend", name: "Julia Atendimento", email: "julia@wfdigital.com.br", role: "atendente", active: true, avatarInitials: "JA", teamId: "t-com", availability: "disponivel" },
];

export const teams: Team[] = [
  { id: "t-com", name: "Comercial", managerId: "u-gestor", memberIds: users.filter((u) => u.teamId === "t-com").map((u) => u.id) },
];

export const queues: Queue[] = [
  { id: "q-com", name: "Comercial", memberIds: ["u-vend1", "u-vend2", "u-vend3"], distribution: "round_robin" },
  { id: "q-sup", name: "Suporte", memberIds: ["u-atend"], distribution: "manual" },
  { id: "q-pos", name: "Pós-venda", memberIds: ["u-atend", "u-gestor"], distribution: "capacidade" },
];

export const companies: Company[] = [
  { id: "c-aco", razaoSocial: "Metalúrgica Aço Vale Indústria Ltda", nomeFantasia: "Aço Vale", cnpj: "12.345.678/0001-90", segmento: "Metalurgia", cnae: "2431-8/00", porte: "Médio", site: "acovale.com.br", cidade: "Betim", uf: "MG", origem: "busca_ativa", createdAt: days(28) },
  { id: "c-alicerce", razaoSocial: "Alicerce Forte Construções Ltda", nomeFantasia: "Alicerce Forte", cnpj: "22.111.333/0001-10", segmento: "Construção", cidade: "Belo Horizonte", uf: "MG", origem: "linkedin", createdAt: days(18) },
  { id: "c-sabor", razaoSocial: "Sabor Mineiro Alimentos", segmento: "Alimentício", cidade: "Contagem", uf: "MG", origem: "google_maps", createdAt: days(12) },
  { id: "c-apice", razaoSocial: "Ápice Contábil Assessoria", segmento: "Serviços contábeis", cidade: "Nova Lima", uf: "MG", origem: "indicacao", createdAt: days(9) },
  { id: "c-bella", razaoSocial: "Bella Napoli Restaurantes", segmento: "Alimentação", cidade: "Belo Horizonte", uf: "MG", origem: "site", createdAt: days(20) },
  { id: "c-tech", razaoSocial: "TechFrota Gestão de Frotas Ltda", segmento: "Logística", cidade: "Curitiba", uf: "PR", origem: "busca_ativa", createdAt: days(6) },
  { id: "c-corpo", razaoSocial: "Corpo em Movimento Academia", segmento: "Fitness", cidade: "Uberlândia", uf: "MG", origem: "whatsapp", createdAt: days(4) },
  { id: "c-semente", razaoSocial: "Semente Ouro Agronegócio", segmento: "Agro", cidade: "Uberaba", uf: "MG", origem: "linkedin", createdAt: days(15) },
  { id: "c-sorriso", razaoSocial: "Sorriso Premium Odontologia", segmento: "Saúde", cidade: "Belo Horizonte", uf: "MG", origem: "indicacao", createdAt: days(22) },
  { id: "c-rota", razaoSocial: "Rota Sul Transportes Ltda", segmento: "Transporte", cidade: "Porto Alegre", uf: "RS", origem: "busca_ativa", createdAt: days(3) },
  { id: "c-verde", razaoSocial: "Verde Vida Paisagismo", segmento: "Paisagismo", cidade: "São Paulo", uf: "SP", origem: "site", createdAt: days(11) },
  { id: "c-nova", razaoSocial: "Nova Era Educação", segmento: "Educação", cidade: "Belo Horizonte", uf: "MG", origem: "google_maps", createdAt: days(7) },
];

export const contacts: Contact[] = [
  { id: "ct-aco", companyId: "c-aco", nome: "Marcos Tavares", cargo: "Diretor Comercial", telefone: "+55 31 99999-1122", whatsapp: "+55 31 99999-1122", email: "marcos@acovale.com.br", melhorHorario: "Manhã", optIn: true, optInAt: days(20), tags: ["decisor"] },
  { id: "ct-alicerce", companyId: "c-alicerce", nome: "Ana Ribeiro", cargo: "Sócia", telefone: "+55 31 98888-3344", whatsapp: "+55 31 98888-3344", email: "ana@alicerceforte.com.br", optIn: true },
  { id: "ct-sabor", companyId: "c-sabor", nome: "Pedro Lima", cargo: "Gerente", whatsapp: "+55 31 98777-1010", optIn: true },
  { id: "ct-apice", companyId: "c-apice", nome: "Renata Souza", cargo: "Diretora", email: "renata@apicecontabil.com.br", optIn: true },
  { id: "ct-bella", companyId: "c-bella", nome: "Giovanni Rossi", cargo: "Proprietário", whatsapp: "+55 31 97777-8899", optIn: true },
  { id: "ct-tech", companyId: "c-tech", nome: "Fernanda Alves", cargo: "COO", email: "fernanda@techfrota.com.br", whatsapp: "+55 41 99666-4433" },
  { id: "ct-corpo", companyId: "c-corpo", nome: "Bruno Martins", cargo: "Diretor", whatsapp: "+55 34 99555-2211", optIn: true },
  { id: "ct-semente", companyId: "c-semente", nome: "Vinícius Prado", cargo: "Gerente", email: "vinicius@sementeouro.com.br" },
  { id: "ct-sorriso", companyId: "c-sorriso", nome: "Dra. Camila Nunes", cargo: "Sócia", whatsapp: "+55 31 99444-7788", optIn: true },
  { id: "ct-rota", companyId: "c-rota", nome: "Sérgio Machado", cargo: "Diretor", whatsapp: "+55 51 99333-6655" },
  { id: "ct-verde", companyId: "c-verde", nome: "Luísa Campos", cargo: "Sócia", whatsapp: "+55 11 99222-4433" },
  { id: "ct-nova", companyId: "c-nova", nome: "Ricardo Melo", cargo: "Diretor", email: "ricardo@novaeraedu.com.br" },
];

export const leads: Lead[] = [
  { id: "l-aco", companyId: "c-aco", contactId: "ct-aco", ownerId: "u-vend3", teamId: "t-com", stage: "negociacao", temperature: "quente", score: 91, scoreFactors: ["Decisor identificado", "Proposta aceita verbalmente", "Follow-up ativo"], estimatedValue: 84000, source: "busca_ativa", tags: ["chave"], createdAt: days(28), updatedAt: days(1), lastContactAt: days(1) },
  { id: "l-alicerce", companyId: "c-alicerce", contactId: "ct-alicerce", ownerId: "u-vend2", teamId: "t-com", stage: "proposta", temperature: "morno", score: 72, estimatedValue: 38000, source: "linkedin", createdAt: days(18), updatedAt: days(2), lastContactAt: days(2) },
  { id: "l-sabor", companyId: "c-sabor", contactId: "ct-sabor", ownerId: "u-vend1", teamId: "t-com", stage: "qualificado", temperature: "morno", score: 66, estimatedValue: 21000, source: "google_maps", createdAt: days(12), updatedAt: days(3), lastContactAt: days(3) },
  { id: "l-apice", companyId: "c-apice", contactId: "ct-apice", ownerId: "u-vend2", teamId: "t-com", stage: "qualificado", temperature: "frio", score: 48, estimatedValue: 15000, source: "indicacao", createdAt: days(9), updatedAt: days(5) },
  { id: "l-bella", companyId: "c-bella", contactId: "ct-bella", ownerId: "u-vend1", teamId: "t-com", stage: "prospeccao", temperature: "frio", score: 32, estimatedValue: 12000, source: "site", createdAt: days(20), updatedAt: days(10) },
  { id: "l-tech", companyId: "c-tech", contactId: "ct-tech", ownerId: "u-vend3", teamId: "t-com", stage: "negociacao", temperature: "quente", score: 88, estimatedValue: 62000, source: "busca_ativa", createdAt: days(6), updatedAt: days(1), lastContactAt: days(1) },
  { id: "l-corpo", companyId: "c-corpo", contactId: "ct-corpo", ownerId: "u-vend2", teamId: "t-com", stage: "proposta", temperature: "morno", score: 61, estimatedValue: 9000, source: "whatsapp", createdAt: days(4), updatedAt: days(2), lastContactAt: days(2) },
  { id: "l-semente", companyId: "c-semente", contactId: "ct-semente", ownerId: "u-vend3", teamId: "t-com", stage: "fechado", temperature: "quente", score: 95, estimatedValue: 128000, closedValue: 118000, closedAt: days(2), source: "linkedin", createdAt: days(15), updatedAt: days(2) },
  { id: "l-sorriso", companyId: "c-sorriso", contactId: "ct-sorriso", ownerId: "u-vend1", teamId: "t-com", stage: "prospeccao", temperature: "frio", score: 40, estimatedValue: 11000, source: "indicacao", createdAt: days(22), updatedAt: days(14) },
  { id: "l-rota", companyId: "c-rota", contactId: "ct-rota", ownerId: "u-vend2", teamId: "t-com", stage: "qualificado", temperature: "morno", score: 58, estimatedValue: 26000, source: "busca_ativa", createdAt: days(3), updatedAt: days(1), lastContactAt: days(1) },
  { id: "l-verde", companyId: "c-verde", contactId: "ct-verde", ownerId: "u-vend1", teamId: "t-com", stage: "perdido", temperature: "frio", score: 22, estimatedValue: 8000, lossReason: "Sem orçamento no período", source: "site", createdAt: days(11), updatedAt: days(3) },
  { id: "l-nova", companyId: "c-nova", contactId: "ct-nova", ownerId: "u-vend3", teamId: "t-com", stage: "proposta", temperature: "morno", score: 70, estimatedValue: 44000, source: "google_maps", createdAt: days(7), updatedAt: days(2), lastContactAt: days(2) },
];

export const tasks: Task[] = [
  { id: "tk-1", title: "Ligar para Marcos (Aço Vale)", type: "ligacao", ownerId: "u-vend3", leadId: "l-aco", dueAt: iso(2), status: "aberta", priority: "alta" },
  { id: "tk-2", title: "Enviar proposta revisada", type: "email", ownerId: "u-vend2", leadId: "l-alicerce", dueAt: iso(20), status: "aberta", priority: "media" },
  { id: "tk-3", title: "Follow-up WhatsApp Bella Napoli", type: "whatsapp", ownerId: "u-vend1", leadId: "l-bella", dueAt: iso(-6), status: "aberta", priority: "media" },
  { id: "tk-4", title: "Reunião de fechamento TechFrota", type: "reuniao", ownerId: "u-vend3", leadId: "l-tech", dueAt: iso(48), status: "aberta", priority: "alta" },
  { id: "tk-5", title: "Confirmar dados Corpo em Movimento", type: "ligacao", ownerId: "u-vend2", leadId: "l-corpo", dueAt: iso(4), status: "aberta", priority: "baixa" },
  { id: "tk-6", title: "Enviar contrato Semente Ouro", type: "email", ownerId: "u-vend3", leadId: "l-semente", dueAt: iso(-48), status: "concluida", completedAt: days(1), priority: "alta" },
];

export const activities: Activity[] = [
  { id: "a-1", leadId: "l-aco", authorId: "u-vend3", type: "lead_criado", content: "Lead criado a partir de busca ativa.", createdAt: days(28) },
  { id: "a-2", leadId: "l-aco", authorId: "u-vend3", type: "etapa_alterada", content: "Qualificado → Proposta", createdAt: days(10) },
  { id: "a-3", leadId: "l-aco", authorId: "u-vend3", type: "nota", content: "Cliente pediu revisão de escopo. Enviaremos proposta ajustada.", createdAt: days(4) },
  { id: "a-4", leadId: "l-aco", authorId: "u-vend3", type: "etapa_alterada", content: "Proposta → Negociação", createdAt: days(2) },
  { id: "a-5", leadId: "l-semente", authorId: "u-vend3", type: "fechamento", content: "Venda fechada por R$ 118.000.", createdAt: days(2) },
  { id: "a-6", leadId: "l-tech", authorId: "u-vend3", type: "ligacao", content: "Ligação de 22 min. Cliente pediu proposta final.", createdAt: days(1) },
  { id: "a-7", leadId: "l-alicerce", authorId: "u-vend2", type: "mensagem_enviada", content: "Proposta enviada por e-mail.", createdAt: days(2) },
];

export const channelAccounts: ChannelAccount[] = [
  { id: "ch-1", provider: "zapi", alias: "WhatsApp Comercial", phone: "+55 31 3555-0100", status: "aguardando_backend" },
];

export const conversations: Conversation[] = [
  {
    id: "cv-aco",
    contactId: "ct-aco",
    companyId: "c-aco",
    primaryLeadId: "l-aco",
    linkedLeadIds: ["l-aco"],
    channel: "whatsapp",
    channelAccountId: "ch-1",
    queueId: "q-com",
    currentOwnerId: "u-vend3",
    status: "aberta",
    priority: "alta",
    unreadCount: 2,
    lastMessageAt: iso(-1),
    createdAt: days(5),
    assignments: [{ id: "asg-1", userId: "u-vend3", at: days(5) }],
  },
  {
    id: "cv-tech",
    contactId: "ct-tech",
    companyId: "c-tech",
    primaryLeadId: "l-tech",
    channel: "whatsapp",
    channelAccountId: "ch-1",
    queueId: "q-com",
    currentOwnerId: "u-vend3",
    status: "aguardando_cliente",
    priority: "alta",
    unreadCount: 0,
    lastMessageAt: iso(-3),
    createdAt: days(3),
    assignments: [{ id: "asg-2", userId: "u-vend3", at: days(3) }],
  },
  {
    id: "cv-bella",
    contactId: "ct-bella",
    companyId: "c-bella",
    primaryLeadId: "l-bella",
    channel: "whatsapp",
    channelAccountId: "ch-1",
    queueId: "q-com",
    status: "aberta",
    priority: "media",
    unreadCount: 1,
    lastMessageAt: iso(-8),
    createdAt: days(2),
    assignments: [],
  },
];

export const messages: Message[] = [
  { id: "m-1", conversationId: "cv-aco", direction: "in", contactId: "ct-aco", content: "Boa tarde! Recebi a proposta, podemos conversar amanhã?", createdAt: iso(-30) },
  { id: "m-2", conversationId: "cv-aco", direction: "out", authorId: "u-vend3", content: "Claro, Marcos. Que horário fica bom?", createdAt: iso(-25), status: "read" },
  { id: "m-3", conversationId: "cv-aco", direction: "in", contactId: "ct-aco", content: "10h30 aqui na fábrica.", createdAt: iso(-1) },
  { id: "m-4", conversationId: "cv-tech", direction: "out", authorId: "u-vend3", content: "Bom dia, Fernanda. Segue a versão revisada do contrato.", createdAt: iso(-3), status: "delivered" },
  { id: "m-5", conversationId: "cv-bella", direction: "in", contactId: "ct-bella", content: "Vocês entregam para restaurante em BH?", createdAt: iso(-8) },
];

export const services: Service[] = [
  { id: "s-1", nome: "Plano Prospecção Ativa", categoria: "Prospecção B2B", descricao: "Prospecção mensal com curadoria de leads qualificados.", preco: 4500, unidade: "mês", active: true },
  { id: "s-2", nome: "Setup de CRM WF", categoria: "Consultoria", descricao: "Implantação, treinamento e configuração inicial.", preco: 8500, unidade: "projeto", active: true },
  { id: "s-3", nome: "Automação WhatsApp", categoria: "Integrações", descricao: "Automação de mensagens e templates aprovados.", preco: 1900, unidade: "mês", active: true },
];

export const prospectingResults: ProspectingResult[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `pr-${i + 1}`,
  searchId: "ps-demo",
  empresa: [
    "Indústria Ferro Novo", "Marmoraria Vale Verde", "Padaria Trigo Real", "Contábil Alfa",
    "Restaurante Sabor & Arte", "TransLog Cargas", "Studio Fit Prime", "AgroCampos Ltda",
    "Odonto Vida", "Turismo Sul Rotas", "Verde Jardim", "Colégio Aprender",
    "Fábrica de Portas Aço BR", "Mineração Serra", "Doceria Amora", "Consultoria Fiscal Pro",
    "Cantina Napolitana", "TransRápido", "Academia Alpha", "AgroNorte",
    "Sorriso Total", "Rotas do Sul", "Paisagens Belas", "Instituto Saber",
  ][i],
  cnpj: `${10 + i}.${100 + i}.${200 + i}/0001-${String(10 + i).padStart(2, "0")}`,
  segmento: ["Metalurgia","Construção","Alimentação","Serviços","Logística","Fitness","Agro","Saúde","Turismo","Paisagismo","Educação"][i % 11],
  cidade: ["Belo Horizonte","Contagem","Betim","Uberlândia","Curitiba","Porto Alegre","São Paulo"][i % 7],
  uf: ["MG","MG","MG","MG","PR","RS","SP"][i % 7],
  telefone: `+55 31 9${8000 + i}-${1000 + i}`,
  whatsapp: `+55 31 9${8000 + i}-${1000 + i}`,
  email: `contato@empresa${i + 1}.com.br`,
  site: `empresa${i + 1}.com.br`,
  source: "demo",
  collectedAt: days(1 + (i % 5)),
  confidence: 0.6 + (i % 4) * 0.1,
  status: (["novo", "novo", "novo", "revisao", "duplicado"] as const)[i % 5],
}));

export const notifications: Notification[] = [
  { id: "n-1", userId: "u-vend3", type: "sla", message: "SLA da conversa Aço Vale vence em 30 min.", link: "/atendimentos/cv-aco", read: false, createdAt: iso(-0.2) },
  { id: "n-2", userId: "u-vend3", type: "tarefa", message: "Tarefa 'Ligar para Marcos' vence hoje.", link: "/leads/l-aco", read: false, createdAt: iso(-1) },
];

export const templates: MessageTemplate[] = [
  { id: "tp-1", name: "Saudação inicial", category: "saudacao", content: "Olá {{nome}}, aqui é {{atendente}} da WF Digital.", variables: ["nome", "atendente"], status: "aprovado", usageCount: 42 },
  { id: "tp-2", name: "Follow-up proposta", category: "followup", content: "Olá {{nome}}, retomando nossa conversa sobre a proposta. Podemos avançar?", variables: ["nome"], status: "aprovado", usageCount: 18 },
];
