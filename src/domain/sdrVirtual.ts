// SDR Virtual + Busca de Leads — domínio compacto (Prompt 3.0)
// Todos os dados são demonstrativos. Nenhum banco conectado.
import { useSyncExternalStore } from "react";

export type UUID = string;

// ============ COMPANY PROFILE ============
export interface CompanyProfile {
  logo?: string;
  nomeFantasia: string;
  razaoSocial: string;
  site: string;
  segmento: string;
  tipo: "B2B" | "B2C" | "B2G" | "Híbrido";
  cidadeUf: string;
  regioesAtendidas: string[];
  modoAtendimento: "Remoto" | "Presencial" | "Híbrido";
  frase: string;
  apresentacaoCurta: string;
  apresentacaoCompleta: string;
  propostaValor: string;
  problemasQueResolve: string[];
  diferenciais: string[];
  cases: string[];
  linksAutorizados: string[];
  ctaPrincipal: "Conversar" | "Agendar" | "Diagnóstico" | "Falar com vendedor";
  tom: string;
  formalidade: "Informal" | "Neutro" | "Formal";
  palavrasPreferidas: string[];
  palavrasProibidas: string[];
  assuntosProibidos: string[];
  horarioComercial: string;
  responsavelHandoff: string;
  slaVendedor: string;
}

export const companyProfile: CompanyProfile = {
  nomeFantasia: "WF Digital",
  razaoSocial: "WF Digital Tecnologia LTDA",
  site: "https://wfdigital.com.br",
  segmento: "Tecnologia da Informação",
  tipo: "B2B",
  cidadeUf: "São Roque/SP",
  regioesAtendidas: ["São Roque", "Sorocaba", "Grande São Paulo", "Brasil (remoto)"],
  modoAtendimento: "Híbrido",
  frase: "Tecnologia sob medida para PMEs que querem crescer.",
  apresentacaoCurta:
    "A WF Digital cria sistemas personalizados, automações com IA e infraestrutura de TI para pequenas e médias empresas em todo o Brasil.",
  apresentacaoCompleta:
    "Somos uma empresa de tecnologia focada em PMEs. Desenvolvemos sistemas personalizados, sites institucionais, automações com IA, e cuidamos de e-mail corporativo, servidores e redes. Nosso foco é entregar soluções que resolvem problemas reais do dia a dia com segurança e boa relação custo-benefício.",
  propostaValor: "Reduzir custos operacionais e aumentar produtividade com tecnologia sob medida.",
  problemasQueResolve: [
    "Processos manuais que consomem tempo",
    "Sistemas prontos que não se encaixam no negócio",
    "Infraestrutura de TI instável",
    "Dificuldade em ter presença digital profissional",
  ],
  diferenciais: [
    "Atendimento próximo e consultivo",
    "Preço justo para PMEs",
    "Equipe local (São Roque/Sorocaba) com atuação nacional",
    "Foco em resultado, não em vender tecnologia",
  ],
  cases: ["Automação de ponto para rede de lavanderias", "ERP customizado para indústria metalúrgica"],
  linksAutorizados: ["https://wfdigital.com.br", "https://wfdigital.com.br/servicos"],
  ctaPrincipal: "Conversar",
  tom: "Consultivo, próximo, direto",
  formalidade: "Neutro",
  palavrasPreferidas: ["parceria", "solução", "juntos", "sob medida"],
  palavrasProibidas: ["barato", "revolucionário", "o melhor"],
  assuntosProibidos: ["política", "religião", "consultoria jurídica", "consultoria financeira"],
  horarioComercial: "Segunda a Sexta, 9h às 18h",
  responsavelHandoff: "Carlos SDR (Comercial)",
  slaVendedor: "2 horas úteis",
};

// ============ SERVICES ============
export type PricePolicy = "Pode informar" | "Somente faixa" | "Nunca informar" | "Encaminhar ao vendedor";

export interface Service {
  id: UUID;
  nome: string;
  categoria: string;
  status: "Ativo" | "Rascunho" | "Pausado";
  sdrAtivo?: boolean; // kill-switch por serviço — quando false, SDR não gera rascunhos para este serviço
  descricaoCurta: string;
  descricaoCompleta: string;
  publicoAdequado: string[];
  setoresAdequados: string[];
  entrega: "Remoto" | "Presencial" | "Híbrido";
  problemaPrincipal: string;
  sintomas: string[];
  beneficios: string[];
  diferenciais: string[];
  criteriosDesqualificacao: string[];
  faixaTicket?: string;
  politicaPreco: PricePolicy;
  prazoInformavel: string;
  personas: string[];
  palavrasChave: string[];
  mensagemInicial: string;
  cta: string;
  limites: string[];
}

export const services: Service[] = [
  {
    id: "sv-sistemas",
    nome: "Desenvolvimento de sistemas personalizados",
    categoria: "Software",
    status: "Ativo",
    descricaoCurta: "Sistemas web sob medida para o processo do cliente.",
    descricaoCompleta:
      "Desenvolvimento de sistemas web personalizados para automatizar processos internos, gestão, controle e integração de operações.",
    publicoAdequado: ["Diretores", "Sócios", "Gerentes de operações", "TI"],
    setoresAdequados: ["Indústria", "Comércio", "Serviços", "Logística"],
    entrega: "Remoto",
    problemaPrincipal: "Processos manuais em planilha que não escalam.",
    sintomas: ["Retrabalho", "Erros humanos", "Falta de indicadores", "Dependência de uma pessoa"],
    beneficios: ["Automação", "Redução de erros", "Indicadores em tempo real", "Escalabilidade"],
    diferenciais: ["Feito sob medida", "Sem mensalidade abusiva", "Código de propriedade do cliente"],
    criteriosDesqualificacao: ["Orçamento inferior a R$ 15 mil", "Prazo inferior a 30 dias"],
    faixaTicket: "R$ 15 mil a R$ 150 mil",
    politicaPreco: "Somente faixa",
    prazoInformavel: "30 a 120 dias conforme escopo",
    personas: ["Diretor de operações", "Sócio de PME industrial"],
    palavrasChave: ["planilha", "excel", "controle", "processo", "erp", "automatizar"],
    mensagemInicial:
      "Olá {{nome}}, identificamos que a {{empresa}} atua em {{segmento}}. Trabalhamos com sistemas personalizados para reduzir processos manuais. Posso fazer duas perguntas rápidas?",
    cta: "Agendar diagnóstico gratuito",
    limites: ["Não prometer prazo sem escopo", "Não informar preço fechado", "Não afirmar tecnologia sem discovery"],
  },
  {
    id: "sv-ia",
    nome: "Automação com IA",
    categoria: "IA",
    status: "Ativo",
    descricaoCurta: "Agentes e automações que reduzem trabalho repetitivo.",
    descricaoCompleta:
      "Automação de tarefas repetitivas com IA: triagem de e-mails, atendimento, extração de dados, geração de conteúdo, integração entre sistemas.",
    publicoAdequado: ["Operações", "CX", "Marketing", "TI"],
    setoresAdequados: ["Serviços", "E-commerce", "SaaS", "Saúde"],
    entrega: "Remoto",
    problemaPrincipal: "Time gastando horas em tarefas repetitivas.",
    sintomas: ["Backlog de atendimento", "Retrabalho manual", "Custos crescentes de equipe"],
    beneficios: ["Redução de 40-70% em tempo operacional", "Escala sem contratar", "Padrão de qualidade"],
    diferenciais: ["Integração com sistemas existentes", "IA controlada com guardrails", "Pagamento por resultado"],
    criteriosDesqualificacao: ["Empresa com menos de 10 funcionários", "Sem processo mapeado"],
    faixaTicket: "R$ 8 mil a R$ 80 mil",
    politicaPreco: "Somente faixa",
    prazoInformavel: "15 a 60 dias",
    personas: ["Head de Operações", "COO", "Head de CX"],
    palavrasChave: ["ia", "automatizar", "chatbot", "agente", "produtividade"],
    mensagemInicial:
      "Olá {{nome}}, vi que a {{empresa}} tem crescido. Ajudamos empresas do porte de vocês a reduzir tarefas repetitivas com IA. Posso te fazer duas perguntas?",
    cta: "Agendar demonstração",
    limites: ["Não afirmar % de ganho sem discovery", "Não prometer integração sem análise"],
  },
  {
    id: "sv-sites",
    nome: "Sites e hospedagem",
    categoria: "Web",
    status: "Ativo",
    descricaoCurta: "Sites institucionais rápidos, seguros e otimizados.",
    descricaoCompleta:
      "Criação e manutenção de sites institucionais e landing pages, com hospedagem gerenciada, SSL e backup.",
    publicoAdequado: ["Sócios de PME", "Marketing"],
    setoresAdequados: ["Comércio local", "Serviços", "Profissionais liberais"],
    entrega: "Remoto",
    problemaPrincipal: "Empresa sem presença digital ou com site ultrapassado.",
    sintomas: ["Site desatualizado", "Sem site", "Cliente não encontra online"],
    beneficios: ["Autoridade digital", "Captação de leads", "SEO"],
    diferenciais: ["Design moderno", "Hospedagem inclusa", "Suporte próximo"],
    criteriosDesqualificacao: ["Somente e-commerce grande porte"],
    faixaTicket: "R$ 3 mil a R$ 15 mil",
    politicaPreco: "Pode informar",
    prazoInformavel: "15 a 45 dias",
    personas: ["Sócio de PME local", "Gestor de marketing"],
    palavrasChave: ["site", "landing", "web", "hospedagem", "google"],
    mensagemInicial:
      "Olá {{nome}}, notamos que a {{empresa}} atende em {{cidade}} e podemos ajudar com presença digital. Posso te mostrar como?",
    cta: "Ver exemplos de sites",
    limites: ["Não prometer 1º lugar no Google"],
  },
  {
    id: "sv-email",
    nome: "E-mail empresarial",
    categoria: "Infraestrutura",
    status: "Ativo",
    descricaoCurta: "E-mail profissional com domínio próprio, seguro e confiável.",
    descricaoCompleta: "Configuração de e-mail corporativo (Google Workspace/Microsoft 365) com domínio próprio, backup e antispam.",
    publicoAdequado: ["Sócios", "Administrativo"],
    setoresAdequados: ["Todos"],
    entrega: "Remoto",
    problemaPrincipal: "Empresa usando gmail/hotmail gratuito.",
    sintomas: ["E-mail @gmail", "Falta de profissionalismo", "Sem backup"],
    beneficios: ["Credibilidade", "Segurança", "Backup automático"],
    diferenciais: ["Setup em 24h", "Suporte incluso"],
    criteriosDesqualificacao: [],
    politicaPreco: "Pode informar",
    prazoInformavel: "Setup em 1-3 dias",
    personas: ["Sócio", "Administrativo"],
    palavrasChave: ["e-mail", "email", "gmail", "outlook", "workspace"],
    mensagemInicial:
      "Olá {{nome}}, notamos que a {{empresa}} usa e-mail gratuito. Podemos migrar para um e-mail profissional com seu domínio. Posso explicar?",
    cta: "Solicitar cotação",
    limites: [],
  },
  {
    id: "sv-servidores",
    nome: "Servidores em nuvem/local",
    categoria: "Infraestrutura",
    status: "Ativo",
    descricaoCurta: "Servidores gerenciados na nuvem ou on-premise.",
    descricaoCompleta: "Provisionamento, gerenciamento e monitoramento de servidores em nuvem (AWS, Azure) ou locais.",
    publicoAdequado: ["TI", "Diretoria"],
    setoresAdequados: ["Indústria", "Logística", "Serviços"],
    entrega: "Híbrido",
    problemaPrincipal: "Infraestrutura instável ou sem monitoramento.",
    sintomas: ["Quedas frequentes", "Sem backup", "Sem monitoramento"],
    beneficios: ["Uptime 99%", "Backup automático", "Suporte 24/5"],
    diferenciais: ["Time local para presencial", "Cloud gerenciada"],
    criteriosDesqualificacao: ["Necessidade de datacenter próprio"],
    politicaPreco: "Encaminhar ao vendedor",
    prazoInformavel: "Setup em 3-15 dias",
    personas: ["Gerente de TI", "Diretor"],
    palavrasChave: ["servidor", "cloud", "aws", "azure", "backup", "infraestrutura"],
    mensagemInicial:
      "Olá {{nome}}, a {{empresa}} tem múltiplas unidades. Cuidamos de servidores e infra pra empresas assim. Posso fazer duas perguntas?",
    cta: "Falar com especialista",
    limites: ["Não prometer SLA sem análise"],
  },
  {
    id: "sv-ponto",
    nome: "Sistema de ponto e lavanderia mensal",
    categoria: "Software",
    status: "Ativo",
    descricaoCurta: "Sistema especializado para redes de lavanderia.",
    descricaoCompleta: "Sistema completo para controle de ponto, lavanderia mensal, entregas e financeiro.",
    publicoAdequado: ["Donos de lavanderia", "Gerentes"],
    setoresAdequados: ["Lavanderias", "Serviços de higienização"],
    entrega: "Remoto",
    problemaPrincipal: "Controle manual de contratos mensais e entregas.",
    sintomas: ["Planilhas", "Perda de peças", "Cobrança manual"],
    beneficios: ["Controle total", "Cobrança automatizada", "Rastreabilidade"],
    diferenciais: ["Já em produção em várias lavanderias", "Especializado"],
    criteriosDesqualificacao: ["Fora do segmento"],
    politicaPreco: "Somente faixa",
    prazoInformavel: "Setup em 15-30 dias",
    personas: ["Dono de lavanderia"],
    palavrasChave: ["lavanderia", "ponto", "mensal", "controle"],
    mensagemInicial: "Olá {{nome}}, temos sistema especializado para lavanderias. Faz sentido conhecer?",
    cta: "Ver demonstração",
    limites: [],
  },
  {
    id: "sv-rede",
    nome: "Rede cabeada e Wi-Fi",
    categoria: "Infraestrutura",
    status: "Ativo",
    descricaoCurta: "Projeto e instalação de redes corporativas.",
    descricaoCompleta: "Projeto, instalação e manutenção de redes cabeadas e Wi-Fi corporativas.",
    publicoAdequado: ["TI", "Diretoria"],
    setoresAdequados: ["Indústria", "Comércio", "Logística"],
    entrega: "Presencial",
    problemaPrincipal: "Rede instável ou wi-fi ruim.",
    sintomas: ["Queda de conexão", "Sinal fraco", "Sem segmentação"],
    beneficios: ["Rede estável", "Cobertura completa", "Segurança"],
    diferenciais: ["Equipe local Sorocaba/São Roque"],
    criteriosDesqualificacao: ["Fora do raio de 150km sem parceiro local"],
    politicaPreco: "Encaminhar ao vendedor",
    prazoInformavel: "Projeto 7-15 dias, instalação 3-10 dias",
    personas: ["Gerente de TI", "Diretor administrativo"],
    palavrasChave: ["rede", "wifi", "wi-fi", "cabeamento", "internet"],
    mensagemInicial: "Olá {{nome}}, atendemos empresas com múltiplas unidades em Sorocaba. Posso conversar sobre rede?",
    cta: "Agendar visita",
    limites: ["Não prometer velocidade sem análise"],
  },
  {
    id: "sv-consultoria",
    nome: "Consultoria e auditoria em TI",
    categoria: "Consultoria",
    status: "Ativo",
    descricaoCurta: "Diagnóstico e plano de tecnologia para PMEs.",
    descricaoCompleta: "Auditoria de infraestrutura, segurança e processos. Plano de investimento em TI.",
    publicoAdequado: ["Diretoria", "TI"],
    setoresAdequados: ["Todos"],
    entrega: "Híbrido",
    problemaPrincipal: "Empresa sem estratégia clara de TI.",
    sintomas: ["Gastos altos sem retorno", "Segurança precária", "Sem plano"],
    beneficios: ["Clareza", "Redução de custo", "Plano de 12 meses"],
    diferenciais: ["Independência de fornecedores"],
    criteriosDesqualificacao: [],
    politicaPreco: "Somente faixa",
    prazoInformavel: "Diagnóstico em 15 dias",
    personas: ["CEO", "CFO", "Diretor de TI"],
    palavrasChave: ["consultoria", "auditoria", "diagnóstico", "estratégia"],
    mensagemInicial: "Olá {{nome}}, oferecemos diagnóstico gratuito de TI. Faz sentido para a {{empresa}}?",
    cta: "Solicitar diagnóstico",
    limites: [],
  },
];

// ============ KNOWLEDGE BASE ============
export type KnowledgeCategory =
  | "Empresa" | "Serviço" | "Benefício" | "Processo" | "Prazo"
  | "Preço" | "Segurança" | "Integração" | "Suporte" | "Objeção" | "Case" | "Fora do escopo";

export interface KnowledgeEntry {
  id: UUID;
  categoria: KnowledgeCategory;
  pergunta: string;
  resposta: string;
  servicoId?: UUID;
  gatilhos: string[];
  autorizada: boolean;
  podeEnviarAuto: boolean;
  exigeVendedor: boolean;
  status: "Ativo" | "Rascunho" | "Arquivado";
  versao: number;
}

export const knowledgeBase: KnowledgeEntry[] = [
  { id: "k-1", categoria: "Empresa", pergunta: "Quem é a WF Digital?", resposta: "A WF Digital é uma empresa de tecnologia especializada em PMEs. Desenvolvemos sistemas sob medida, sites e cuidamos de infraestrutura de TI.", gatilhos: ["quem é", "o que fazem", "sobre vocês"], autorizada: true, podeEnviarAuto: true, exigeVendedor: false, status: "Ativo", versao: 1 },
  { id: "k-2", categoria: "Preço", pergunta: "Quanto custa um sistema?", resposta: "O investimento varia de R$ 15 mil a R$ 150 mil dependendo do escopo. Posso te conectar com um especialista para uma proposta precisa?", servicoId: "sv-sistemas", gatilhos: ["quanto custa", "preço", "valor", "orçamento"], autorizada: true, podeEnviarAuto: false, exigeVendedor: true, status: "Ativo", versao: 1 },
  { id: "k-3", categoria: "Objeção", pergunta: "Já tenho fornecedor", resposta: "Entendo. Muitos clientes nossos também tinham. Podemos apenas trocar uma ideia para ver se faz sentido no futuro?", gatilhos: ["já tenho", "já uso", "fornecedor atual"], autorizada: true, podeEnviarAuto: true, exigeVendedor: false, status: "Ativo", versao: 1 },
  { id: "k-4", categoria: "Objeção", pergunta: "Já tenho site", resposta: "Ótimo! Muitas vezes revisamos sites existentes ou ajudamos com performance/SEO. Faz sentido conversarmos?", servicoId: "sv-sites", gatilhos: ["já tenho site"], autorizada: true, podeEnviarAuto: true, exigeVendedor: false, status: "Ativo", versao: 1 },
  { id: "k-5", categoria: "Prazo", pergunta: "Quanto tempo demora?", resposta: "Depende do escopo. Sistemas: 30 a 120 dias. Sites: 15 a 45 dias. Podemos fazer um diagnóstico para dar um prazo preciso.", gatilhos: ["quanto tempo", "prazo", "quando fica pronto"], autorizada: true, podeEnviarAuto: true, exigeVendedor: false, status: "Ativo", versao: 1 },
  { id: "k-6", categoria: "Segurança", pergunta: "Vocês têm LGPD?", resposta: "Sim, seguimos LGPD, com contratos de tratamento de dados e boas práticas de segurança. Um especialista pode detalhar.", gatilhos: ["lgpd", "segurança", "dados"], autorizada: true, podeEnviarAuto: true, exigeVendedor: false, status: "Ativo", versao: 1 },
  { id: "k-7", categoria: "Fora do escopo", pergunta: "Vocês fazem contabilidade?", resposta: "Não trabalhamos com contabilidade. Nosso foco é tecnologia: sistemas, sites, IA e infraestrutura.", gatilhos: ["contabilidade", "jurídico", "advogado"], autorizada: true, podeEnviarAuto: true, exigeVendedor: false, status: "Ativo", versao: 1 },
];

// ============ SDR POLICIES ============
export interface SdrPolicies {
  sempreIdentificar: boolean;
  naoInventar: boolean;
  naoPrometerPrazo: boolean;
  naoInformarPreco: boolean;
  naoConcederDesconto: boolean;
  naoNegociarContrato: boolean;
  naoFalarMalConcorrente: boolean;
  naoInsistirAposRecusa: boolean;
  encerrarEmOptOut: boolean;
  encaminharBaixaConfianca: boolean;
  pausarQuandoHumano: boolean;
  maxMensagensPorConversa: number;
  maxPerguntasConsecutivas: number;
  confiancaMinima: number;
  modo: "Sugestão" | "Semiautomático" | "Automático";
  termosHandoff: string[];
  termosOptOut: string[];
}

export const sdrPolicies: SdrPolicies = {
  sempreIdentificar: true,
  naoInventar: true,
  naoPrometerPrazo: true,
  naoInformarPreco: true,
  naoConcederDesconto: true,
  naoNegociarContrato: true,
  naoFalarMalConcorrente: true,
  naoInsistirAposRecusa: true,
  encerrarEmOptOut: true,
  encaminharBaixaConfianca: true,
  pausarQuandoHumano: true,
  maxMensagensPorConversa: 12,
  maxPerguntasConsecutivas: 2,
  confiancaMinima: 0.7,
  modo: "Semiautomático",
  termosHandoff: ["preço", "orçamento", "proposta", "reunião", "demonstração", "falar com pessoa", "vendedor", "humano"],
  termosOptOut: ["não quero", "parar", "descadastrar", "remover", "sair", "cancelar"],
};

// ============ SEARCH PROFILES ============
export interface SearchProfile {
  id: UUID;
  nome: string;
  descricao: string;
  servicoId: UUID;
  objetivo: string;
  status: "Rascunho" | "Ativo" | "Em teste" | "Arquivado";
  segmento: string;
  cnaes: string[];
  cidades: string[];
  ufs: string[];
  raioKm?: number;
  porteMin?: number;
  porteMax?: number;
  cargos: string[];
  mustHave: string[];
  exclusoes: string[];
  atualizadoEm: string;
}

export const searchProfiles: SearchProfile[] = [
  { id: "sp-1", nome: "Sites locais São Roque + 100km", descricao: "PMEs sem site ou com site precário", servicoId: "sv-sites", objetivo: "Captar 30 leads/mês", status: "Ativo", segmento: "Comércio e Serviços", cnaes: ["47", "56"], cidades: ["São Roque", "Sorocaba", "Mairinque", "Ibiúna"], ufs: ["SP"], raioKm: 100, porteMin: 3, porteMax: 50, cargos: ["Sócio", "Proprietário", "Marketing"], mustHave: ["Empresa ativa", "Sem site profissional"], exclusoes: ["E-commerce grande porte", "Clientes atuais"], atualizadoEm: "2026-06-15" },
  { id: "sp-2", nome: "Automação IA — Brasil", descricao: "Empresas 20-500 func. com processos manuais", servicoId: "sv-ia", objetivo: "Gerar 20 handoffs/mês", status: "Ativo", segmento: "Serviços e SaaS", cnaes: ["62", "63", "82"], cidades: [], ufs: ["SP", "RJ", "MG", "PR", "RS"], porteMin: 20, porteMax: 500, cargos: ["COO", "Head de Operações", "Head de CX"], mustHave: ["Site profissional", "Crescimento recente"], exclusoes: ["Startups seed", "Menos de 10 func"], atualizadoEm: "2026-06-20" },
  { id: "sp-3", nome: "Sistemas para indústrias", descricao: "Indústrias com processos manuais", servicoId: "sv-sistemas", objetivo: "10 diagnósticos/mês", status: "Ativo", segmento: "Indústria", cnaes: ["10", "13", "24", "25"], cidades: ["Sorocaba", "Votorantim", "Itu"], ufs: ["SP"], raioKm: 80, porteMin: 30, porteMax: 300, cargos: ["Diretor", "Gerente Operações", "TI"], mustHave: ["Uso de planilhas Excel", "Sem ERP"], exclusoes: ["Multinacionais"], atualizadoEm: "2026-06-10" },
  { id: "sp-4", nome: "Rede/servidores Sorocaba", descricao: "Empresas com múltiplas unidades", servicoId: "sv-rede", objetivo: "5 visitas técnicas/mês", status: "Em teste", segmento: "Diversos", cnaes: [], cidades: ["Sorocaba", "Votorantim", "Salto de Pirapora"], ufs: ["SP"], raioKm: 60, porteMin: 20, cargos: ["Gerente TI", "Diretor"], mustHave: ["Múltiplas unidades ou expansão"], exclusoes: ["Sem TI interno"], atualizadoEm: "2026-06-25" },
];

// ============ LEAD LISTS ============
export interface LeadList {
  id: UUID;
  nome: string;
  descricao: string;
  servicoId: UUID;
  searchProfileId?: UUID;
  origem: string;
  responsavelId: string;
  quantidade: number;
  validos: number;
  duplicados: number;
  bloqueados: number;
  status: "Rascunho" | "Ativa" | "Em campanha" | "Arquivada";
  criadaEm: string;
  campanhaId?: string;
}

export const leadLists: LeadList[] = [
  { id: "ll-1", nome: "PMEs São Roque — Sites (Julho)", descricao: "Empresas locais sem site profissional", servicoId: "sv-sites", searchProfileId: "sp-1", origem: "Vibe Sandbox + Google Maps", responsavelId: "u-vend1", quantidade: 42, validos: 35, duplicados: 4, bloqueados: 3, status: "Em campanha", criadaEm: "2026-07-01", campanhaId: "cp-1" },
  { id: "ll-2", nome: "IA — Serviços 50-200 func", descricao: "Empresas de serviços médio porte", servicoId: "sv-ia", searchProfileId: "sp-2", origem: "Apify LinkedIn Sandbox", responsavelId: "u-gestor", quantidade: 28, validos: 24, duplicados: 2, bloqueados: 2, status: "Ativa", criadaEm: "2026-07-05" },
  { id: "ll-3", nome: "Indústrias Sorocaba", descricao: "Indústrias metalúrgicas e químicas", servicoId: "sv-sistemas", searchProfileId: "sp-3", origem: "Vibe Prospecting Sandbox", responsavelId: "u-vend2", quantidade: 18, validos: 15, duplicados: 1, bloqueados: 2, status: "Ativa", criadaEm: "2026-07-03" },
];

// ============ CADENCES ============
export type CadenceStepType = "apresentacao" | "espera" | "descoberta" | "follow-up" | "tarefa" | "condicao" | "nutrir" | "encerrar" | "handoff";

export interface CadenceStep {
  ordem: number;
  tipo: CadenceStepType;
  auto: boolean;
  atrasoHoras: number;
  template?: string;
  descricao: string;
}

export interface Cadence {
  id: UUID;
  nome: string;
  servicoId: UUID;
  descricao: string;
  status: "Ativa" | "Rascunho" | "Pausada";
  passos: CadenceStep[];
}

export const cadences: Cadence[] = [
  {
    id: "cd-1", nome: "Apresentação Sites (Demo)", servicoId: "sv-sites", descricao: "1 apresentação + 2 follow-ups curtos", status: "Ativa",
    passos: [
      { ordem: 1, tipo: "apresentacao", auto: false, atrasoHoras: 0, template: "Mensagem inicial do serviço", descricao: "Envio da mensagem inicial autorizada" },
      { ordem: 2, tipo: "espera", auto: true, atrasoHoras: 24, descricao: "Aguardar 24h" },
      { ordem: 3, tipo: "follow-up", auto: false, atrasoHoras: 0, template: "Olá {{nome}}, só passando para saber se posso ajudar em algo.", descricao: "Follow-up 1" },
      { ordem: 4, tipo: "espera", auto: true, atrasoHoras: 72, descricao: "Aguardar 3 dias" },
      { ordem: 5, tipo: "follow-up", auto: false, atrasoHoras: 0, template: "Sem problemas caso não seja o momento. Boa semana!", descricao: "Follow-up 2 (encerra)" },
      { ordem: 6, tipo: "encerrar", auto: true, atrasoHoras: 0, descricao: "Encerrar cadência" },
    ],
  },
  {
    id: "cd-2", nome: "Automação IA — Discovery", servicoId: "sv-ia", descricao: "Apresentação + pergunta de descoberta + handoff", status: "Ativa",
    passos: [
      { ordem: 1, tipo: "apresentacao", auto: false, atrasoHoras: 0, descricao: "Apresentação inicial" },
      { ordem: 2, tipo: "descoberta", auto: false, atrasoHoras: 24, descricao: "Pergunta de situação" },
      { ordem: 3, tipo: "handoff", auto: false, atrasoHoras: 0, descricao: "Encaminhar quando qualificado" },
    ],
  },
  {
    id: "cd-3", nome: "Sistemas — Diagnóstico", servicoId: "sv-sistemas", descricao: "Descoberta e diagnóstico", status: "Rascunho",
    passos: [
      { ordem: 1, tipo: "apresentacao", auto: false, atrasoHoras: 0, descricao: "Apresentação" },
      { ordem: 2, tipo: "descoberta", auto: false, atrasoHoras: 48, descricao: "Discovery" },
      { ordem: 3, tipo: "handoff", auto: false, atrasoHoras: 0, descricao: "Handoff" },
    ],
  },
];

// ============ HANDOFFS ============
export type HandoffStatus = "Rascunho" | "Revisão" | "Aguardando vendedor" | "Aceito" | "Devolvido" | "Recusado" | "Expirado" | "Redistribuído" | "Concluído";

export interface Handoff {
  id: UUID;
  leadId: string;
  empresa: string;
  contato: string;
  servicoId: UUID;
  origemCampanhaId?: string;
  motivo: string;
  necessidade: string;
  urgencia: "Alta" | "Média" | "Baixa";
  fit: number;
  intent: number;
  engagement: number;
  heat: number;
  vendedorSugerido: string;
  sla: string;
  prioridade: "Alta" | "Média" | "Baixa";
  status: HandoffStatus;
  criadoEm: string;
  aceitoEm?: string;
  motivoDevolucao?: string;
  resumoConversa: string;
}

export const handoffs: Handoff[] = [
  { id: "hd-1", leadId: "l-01", empresa: "Padaria Trigo Dourado", contato: "Ana Ribeiro", servicoId: "sv-sites", motivo: "Pediu orçamento", necessidade: "Site novo com pedido online", urgencia: "Alta", fit: 82, intent: 88, engagement: 75, heat: 82, vendedorSugerido: "Carlos SDR", sla: "2h úteis", prioridade: "Alta", status: "Aguardando vendedor", criadoEm: "2026-07-08 10:30", resumoConversa: "Cliente autorizou apresentação, confirmou que não tem site, pediu proposta com pedido online." },
  { id: "hd-2", leadId: "l-02", empresa: "Metalúrgica Aço Vale", contato: "Marcos Tavares", servicoId: "sv-sistemas", motivo: "Pediu reunião", necessidade: "Sistema de controle de produção", urgencia: "Média", fit: 90, intent: 78, engagement: 82, heat: 84, vendedorSugerido: "Marina Vendas", sla: "4h úteis", prioridade: "Alta", status: "Aceito", criadoEm: "2026-07-07 14:15", aceitoEm: "2026-07-07 15:45", resumoConversa: "Empresa com 80 funcionários, controla produção em planilha. Diretor quer conversar." },
  { id: "hd-3", leadId: "l-03", empresa: "Tech Frota", contato: "Fernanda Alves", servicoId: "sv-ia", motivo: "Confiança baixa — pergunta técnica", necessidade: "Automação de triagem de tickets", urgencia: "Média", fit: 76, intent: 70, engagement: 65, heat: 70, vendedorSugerido: "Roberto KA", sla: "4h úteis", prioridade: "Média", status: "Devolvido", criadoEm: "2026-07-06 09:00", motivoDevolucao: "Falta informações de volume de tickets", resumoConversa: "Pergunta técnica fora da base autorizada. Enviado para vendedor." },
  { id: "hd-4", leadId: "l-04", empresa: "Alicerce Forte Construções", contato: "Ana Ribeiro", servicoId: "sv-sites", motivo: "Pediu preço", necessidade: "Site institucional", urgencia: "Baixa", fit: 70, intent: 72, engagement: 60, heat: 68, vendedorSugerido: "Carlos SDR", sla: "2h úteis", prioridade: "Média", status: "Concluído", criadoEm: "2026-07-05 11:20", aceitoEm: "2026-07-05 12:00", resumoConversa: "Fechou contrato de site institucional após reunião." },
];

// ============ SIMPLE STORES ============
function createStore<T>(initial: T[]) {
  let data = [...initial];
  const listeners = new Set<() => void>();
  return {
    get: () => data,
    set: (fn: (d: T[]) => T[]) => { data = fn(data); listeners.forEach((l) => l()); },
    subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
  };
}

const companyStore = { current: companyProfile, listeners: new Set<() => void>() };
export function useCompanyProfile() {
  return useSyncExternalStore(
    (l) => { companyStore.listeners.add(l); return () => companyStore.listeners.delete(l); },
    () => companyStore.current,
    () => companyStore.current,
  );
}

const servicesStore = createStore(services.map((s) => ({ ...s, sdrAtivo: s.sdrAtivo ?? true })));
export const useServicesList = () =>
  useSyncExternalStore(servicesStore.subscribe, servicesStore.get, servicesStore.get);

export function toggleServiceSdr(id: UUID) {
  servicesStore.set((v) => v.map((s) => (s.id === id ? { ...s, sdrAtivo: !s.sdrAtivo } : s)));
}
export function isServiceSdrActive(id: UUID) {
  const s = servicesStore.get().find((x) => x.id === id);
  return s?.sdrAtivo !== false;
}

const knowledgeStore = createStore(knowledgeBase);
export const useKnowledgeBase = () =>
  useSyncExternalStore(knowledgeStore.subscribe, knowledgeStore.get, knowledgeStore.get);

const searchProfilesStore = createStore(searchProfiles);
export const useSearchProfiles = () =>
  useSyncExternalStore(searchProfilesStore.subscribe, searchProfilesStore.get, searchProfilesStore.get);

const leadListsStore = createStore(leadLists);
export const useLeadLists = () =>
  useSyncExternalStore(leadListsStore.subscribe, leadListsStore.get, leadListsStore.get);

export function addLeadList(list: Omit<LeadList, "id" | "criadaEm"> & { id?: string }) {
  const novo: LeadList = {
    ...list,
    id: list.id ?? `ll-${Date.now()}`,
    criadaEm: new Date().toISOString().slice(0, 10),
  };
  leadListsStore.set((d) => [novo, ...d]);
  return novo;
}

// ============ SDR DRAFT QUEUE (Semiautomático — padrão da demo) ============
// Rascunhos produzidos pelo SDR Virtual que aguardam aprovação humana antes do envio.
// Modo padrão: Semiautomático. Nenhuma mensagem sai sem confirmação de um atendente.
export type SdrMode = "Semiautomático" | "Manual" | "Automático (futuro)";
export const DEFAULT_SDR_MODE: SdrMode = "Semiautomático";

export interface SdrDraft {
  id: string;
  conversaId: string;
  empresa: string;
  contato: string;
  leadMessage: string;
  draftReply: string;
  source: string;
  confidence: number;
  requiresHuman: boolean;
  guardrails: { rule: string; detail: string; severity: "info" | "warn" | "block" }[];
  status: "pendente" | "aprovado" | "editado" | "descartado";
  criadoEm: string;
}

export const sdrDrafts: SdrDraft[] = [
  {
    id: "df-1",
    conversaId: "cv-1",
    empresa: "Padaria Trigo Dourado",
    contato: "Ana Ribeiro",
    leadMessage: "Ok, pode explicar mais?",
    draftReply: "Claro! Nós criamos sites profissionais com pedido online integrado. Posso enviar 2 exemplos de padarias que atendemos e um resumo de investimento. Tudo bem?",
    source: "service",
    confidence: 82,
    requiresHuman: false,
    guardrails: [
      { rule: "TomVozOk", detail: "Tom cordial dentro do padrão da empresa", severity: "info" },
      { rule: "SemPrecoEspecifico", detail: "Rascunho evita valor exato — respeitando política", severity: "info" },
    ],
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
  {
    id: "df-2",
    conversaId: "cv-5",
    empresa: "Ápice Contabil",
    contato: "Renata Souza",
    leadMessage: "Não estou interessada agora",
    draftReply: "Sem problemas, Renata! Deixo por aqui e, se fizer sentido lá na frente, é só chamar. Um ótimo dia!",
    source: "policy",
    confidence: 94,
    requiresHuman: false,
    guardrails: [
      { rule: "RespeitoOptOut", detail: "Cliente sinalizou não-interesse; encerrar cadência", severity: "info" },
    ],
    status: "pendente",
    criadoEm: new Date().toISOString(),
  },
];

const sdrDraftsStore = createStore(sdrDrafts);
export const useSdrDrafts = () =>
  useSyncExternalStore(sdrDraftsStore.subscribe, sdrDraftsStore.get, sdrDraftsStore.get);

export function addSdrDraft(d: Omit<SdrDraft, "id" | "criadoEm" | "status"> & { id?: string; status?: SdrDraft["status"] }) {
  const novo: SdrDraft = {
    ...d,
    id: d.id ?? `df-${Date.now()}`,
    status: d.status ?? "pendente",
    criadoEm: new Date().toISOString(),
  };
  sdrDraftsStore.set((v) => [novo, ...v]);
  return novo;
}

export function updateSdrDraft(id: string, patch: Partial<SdrDraft>) {
  sdrDraftsStore.set((v) => v.map((d) => (d.id === id ? { ...d, ...patch } : d)));
}

const cadencesStore = createStore(cadences);
export const useCadences = () =>
  useSyncExternalStore(cadencesStore.subscribe, cadencesStore.get, cadencesStore.get);

const handoffsStore = createStore(handoffs);
export const useHandoffs = () =>
  useSyncExternalStore(handoffsStore.subscribe, handoffsStore.get, handoffsStore.get);

export function updateHandoffStatus(id: string, status: HandoffStatus, motivo?: string) {
  handoffsStore.set((d) => d.map((h) => h.id === id ? { ...h, status, ...(motivo && { motivoDevolucao: motivo }), ...(status === "Aceito" && { aceitoEm: new Date().toISOString() }) } : h));
}

export function addHandoff(h: Omit<Handoff, "id" | "criadoEm"> & { id?: string }) {
  const novo: Handoff = {
    ...h,
    id: h.id ?? `hd-${Date.now()}`,
    criadoEm: new Date().toISOString().replace("T", " ").slice(0, 16),
  };
  handoffsStore.set((d) => [novo, ...d]);
  return novo;
}

// ============ INTEGRATION STATUS ============
export type IntegrationStatus = "Real" | "Sandbox" | "Não configurado" | "Desconectado" | "Erro";
export interface IntegrationInfo {
  id: string;
  nome: string;
  categoria: "WhatsApp" | "Prospecção" | "IA" | "Storage";
  status: IntegrationStatus;
  descricao: string;
  ultimoEvento?: string;
}
export const integrations: IntegrationInfo[] = [
  { id: "zapi", nome: "Z-API WhatsApp", categoria: "WhatsApp", status: "Sandbox", descricao: "Instância configurável de WhatsApp Business — modo sandbox demonstrativo", ultimoEvento: "Simulador ativo" },
  { id: "vibe", nome: "Vibe Prospecting", categoria: "Prospecção", status: "Sandbox", descricao: "Busca inteligente de empresas — sandbox", ultimoEvento: "Última busca há 2 dias" },
  { id: "apify", nome: "Apify API v2", categoria: "Prospecção", status: "Sandbox", descricao: "Actors e Tasks para scraping — sandbox", ultimoEvento: "Actor Google Maps disponível" },
  { id: "ai", nome: "IA (Lovable Gateway)", categoria: "IA", status: "Não configurado", descricao: "Classificador de intenção do SDR", ultimoEvento: "Aguardando ativação" },
];
