import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { assertIntegrationOperational, getIntegrationRuntimeState } from '@/lib/integration-control.functions'
import type { ExternalCompany, SourceId } from './prospecting.functions'
import { loadLeadFlowSettings, markFirstOutreach } from './lead-flow-db'

export type SearchExecutionMode = 'test' | 'live'

type SearchFilters = {
  mode: SearchExecutionMode
  source: SourceId
  cnae?: string | null
  uf?: string | null
  municipio?: string | null
  keyword?: string | null
  porte?: string | null
  radius_km?: number | null
  limit: number
}

const searchSchema = z.object({
  mode: z.enum(['test', 'live']).default('test'),
  source: z.enum(['cnpj_ws', 'google_places', 'apify', 'ai_only']).default('google_places'),
  cnae: z.string().trim().max(20).optional().nullable(),
  uf: z.string().trim().length(2).optional().nullable(),
  municipio: z.string().trim().max(120).optional().nullable(),
  keyword: z.string().trim().max(160).optional().nullable(),
  porte: z.string().trim().max(80).optional().nullable(),
  radius_km: z.number().min(1).max(50).optional().nullable(),
  limit: z.number().int().min(1).max(30).default(15),
})

const importSchema = z.object({
  cache_id: z.string().uuid(),
  keys: z.array(z.string().min(3)).min(1).max(100),
  approach: z.enum(['ia', 'humano']),
  assignee_id: z.string().uuid().optional().nullable(),
  sla_hours: z.number().int().min(1).max(168).optional(),
})

function orgIdFrom(context: any): string {
  const orgId = context?.organizationId
  if (!orgId) throw new Error('Sua conta não está vinculada a uma empresa ativa. Revise Equipe/Empresa antes de prospectar.')
  return String(orgId)
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function detectWhatsapp(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  const local = digits.length === 13 && digits.startsWith('55') ? digits.slice(2) : digits
  if (local.length === 11 && local[2] === '9') return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  return null
}

function scoreCompany(company: ExternalCompany, filters: SearchFilters): ExternalCompany {
  let score = 35
  const reasons: string[] = []
  if (company.whatsapp) { score += 18; reasons.push('WhatsApp disponível') }
  else if (company.telefone) { score += 10; reasons.push('telefone disponível') }
  if (company.email) { score += 14; reasons.push('e-mail disponível') }
  if (company.website) { score += 8; reasons.push('site identificado') }
  if (filters.municipio && normalizeText(company.municipio) === normalizeText(filters.municipio)) {
    score += 10
    reasons.push('mesma cidade')
  }
  if (filters.uf && normalizeText(company.uf) === normalizeText(filters.uf)) score += 5
  if (filters.keyword) {
    const haystack = normalizeText(`${company.razao_social} ${company.nome_fantasia ?? ''} ${company.cnae_descricao ?? ''}`)
    if (haystack.includes(normalizeText(filters.keyword))) { score += 10; reasons.push('aderência ao termo buscado') }
  }
  return {
    ...company,
    score: Math.max(0, Math.min(100, score)),
    score_reason: reasons.length ? reasons.join(' · ') : 'Score calculado pelos dados disponíveis',
  }
}

function demoCompanies(filters: SearchFilters): ExternalCompany[] {
  const city = filters.municipio || 'São Paulo'
  const uf = filters.uf || 'SP'
  const segment = filters.keyword || 'Tecnologia e Serviços'
  const names = [
    'Horizonte Soluções Empresariais',
    'Nexa Gestão e Tecnologia',
    'Atlas Serviços Integrados',
    'Vértice Operações',
    'Lumina Sistemas Corporativos',
    'Ponto Norte Soluções',
    'Orbe Gestão Empresarial',
    'Prisma Serviços B2B',
    'Conecta Brasil Operações',
    'Elo Forte Tecnologia',
    'Nova Rota Serviços',
    'Integra Prime Soluções',
    'Base Alfa Sistemas',
    'Via Central Gestão',
    'Sigma Pro Serviços',
  ]
  return names.slice(0, filters.limit).map((name, index) => scoreCompany({
    cnpj: `TEST-${String(index + 1).padStart(4, '0')}`,
    razao_social: `${name} LTDA`,
    nome_fantasia: name,
    cnae_principal: filters.cnae || null,
    cnae_descricao: segment,
    porte: filters.porte || (index % 3 === 0 ? 'Médio' : 'Pequeno'),
    capital_social: null,
    situacao: 'ATIVA - DADO DE TESTE',
    data_abertura: null,
    telefone: `(11) 3000-${String(1000 + index).slice(-4)}`,
    whatsapp: `(11) 90000-${String(1000 + index).slice(-4)}`,
    email: `teste${index + 1}@example.com`,
    logradouro: 'Endereço fictício para homologação',
    numero: null,
    bairro: null,
    municipio: city,
    uf,
    cep: null,
    website: 'https://example.com',
    source: filters.source,
  }, filters))
}

type GooglePlace = {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  primaryTypeDisplayName?: { text?: string }
  primaryType?: string
  addressComponents?: Array<{ types?: string[]; longText?: string; shortText?: string }>
  location?: { latitude?: number; longitude?: number }
}

function googleAddress(place: GooglePlace, type: string): string | null {
  const item = (place.addressComponents ?? []).find((part) => (part.types ?? []).includes(type))
  return item?.shortText ?? item?.longText ?? null
}

async function googleCenter(filters: SearchFilters, key: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!filters.radius_km) return null
  if (!filters.municipio) throw new Error('Informe a cidade para usar busca por raio.')
  const address = [filters.municipio, filters.uf, 'Brasil'].filter(Boolean).join(', ')
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${encodeURIComponent(key)}&language=pt-BR&region=br`)
  if (!res.ok) throw new Error(`Falha ao localizar a cidade no Google (${res.status}).`)
  const payload = await res.json() as any
  const location = payload?.results?.[0]?.geometry?.location
  if (!location?.lat || !location?.lng) throw new Error(payload?.error_message || `Não foi possível localizar ${address}.`)
  return { latitude: location.lat, longitude: location.lng }
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const rad = (n: number) => n * Math.PI / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLng = rad(b.longitude - a.longitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

async function searchGoogle(filters: SearchFilters): Promise<ExternalCompany[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new Error('Google Places não está configurado. Cadastre GOOGLE_PLACES_API_KEY antes do uso oficial.')
  const query = [filters.keyword, filters.municipio, filters.uf].filter(Boolean).join(' ').trim()
  if (!query) throw new Error('Informe um segmento/palavra-chave para pesquisar no Google Places.')
  const center = await googleCenter(filters, key)
  const radiusMeters = Math.min(50_000, Math.round((filters.radius_km ?? 0) * 1000))
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.nationalPhoneNumber,places.websiteUri,places.primaryType,places.primaryTypeDisplayName,places.addressComponents,places.location',
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: 'pt-BR',
      regionCode: 'BR',
      pageSize: Math.min(20, filters.limit),
      ...(center ? { locationBias: { circle: { center, radius: radiusMeters } } } : {}),
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Google Places ${res.status}: ${text.slice(0, 180)}`)
  }
  const payload = await res.json() as { places?: GooglePlace[] }
  return (payload.places ?? []).map((p) => {
    const phone = p.internationalPhoneNumber || p.nationalPhoneNumber || null
    const company: ExternalCompany = {
      cnpj: p.id || `google-${crypto.randomUUID()}`,
      razao_social: p.displayName?.text || 'Empresa sem nome',
      nome_fantasia: p.displayName?.text || null,
      cnae_principal: null,
      cnae_descricao: p.primaryTypeDisplayName?.text || p.primaryType || null,
      porte: null,
      capital_social: null,
      situacao: null,
      data_abertura: null,
      telefone: phone,
      whatsapp: detectWhatsapp(phone),
      email: null,
      logradouro: p.formattedAddress || null,
      numero: null,
      bairro: googleAddress(p, 'sublocality_level_1') || googleAddress(p, 'sublocality'),
      municipio: googleAddress(p, 'administrative_area_level_2') || googleAddress(p, 'locality'),
      uf: googleAddress(p, 'administrative_area_level_1'),
      cep: googleAddress(p, 'postal_code'),
      website: p.websiteUri || null,
      latitude: p.location?.latitude ?? null,
      longitude: p.location?.longitude ?? null,
      source: 'google_places',
    }
    if (center && company.latitude != null && company.longitude != null) {
      company.distance_km = Number(distanceKm(center, { latitude: company.latitude, longitude: company.longitude }).toFixed(1))
    }
    return scoreCompany(company, filters)
  }).filter((company) => !center || company.distance_km == null || company.distance_km <= (filters.radius_km ?? 50)).slice(0, filters.limit)
}

type ApifyPlace = {
  title?: string
  categoryName?: string
  address?: string
  street?: string
  city?: string
  state?: string
  postalCode?: string
  phone?: string
  phoneUnformatted?: string
  website?: string
  url?: string
  placeId?: string
  emails?: string[]
}

async function searchApify(filters: SearchFilters): Promise<ExternalCompany[]> {
  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error('Apify não está configurado. Cadastre APIFY_TOKEN antes do uso oficial.')
  const query = [filters.keyword, filters.municipio, filters.uf].filter(Boolean).join(' ').trim()
  if (!query) throw new Error('Informe um segmento/palavra-chave para pesquisar no Apify.')
  const actorId = process.env.APIFY_ACTOR_ID || 'compass~crawler-google-places'
  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      searchStringsArray: [query],
      maxCrawledPlacesPerSearch: Math.min(30, filters.limit),
      language: 'pt-BR',
      countryCode: 'br',
      scrapeContacts: true,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Apify ${res.status}: ${text.slice(0, 200)}`)
  }
  const items = await res.json() as ApifyPlace[]
  return (Array.isArray(items) ? items : []).slice(0, filters.limit).map((p) => {
    const phone = p.phone || p.phoneUnformatted || null
    return scoreCompany({
      cnpj: p.placeId || `apify-${crypto.randomUUID()}`,
      razao_social: p.title || 'Empresa sem nome',
      nome_fantasia: p.title || null,
      cnae_principal: null,
      cnae_descricao: p.categoryName || null,
      porte: null,
      capital_social: null,
      situacao: null,
      data_abertura: null,
      telefone: phone,
      whatsapp: detectWhatsapp(phone),
      email: p.emails?.[0] || null,
      logradouro: p.street || p.address || null,
      numero: null,
      bairro: null,
      municipio: p.city || null,
      uf: p.state || null,
      cep: p.postalCode || null,
      website: p.website || p.url || null,
      source: 'apify',
    }, filters)
  })
}

const UF_IBGE: Record<string, string> = {
  AC: '12', AL: '27', AP: '16', AM: '13', BA: '29', CE: '23', DF: '53', ES: '32', GO: '52', MA: '21', MT: '51', MS: '50', MG: '31', PA: '15', PB: '25', PR: '41', PE: '26', PI: '22', RJ: '33', RN: '24', RS: '43', RO: '11', RR: '14', SC: '42', SP: '35', SE: '28', TO: '17',
}

async function resolveCityIbge(uf: string, municipio: string): Promise<string | null> {
  const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios`)
  if (!res.ok) return null
  const rows = await res.json() as Array<{ id: number; nome: string }>
  const target = normalizeText(municipio)
  return String(rows.find((row) => normalizeText(row.nome) === target)?.id ?? '') || null
}

async function searchCnpjWsCommercial(filters: SearchFilters): Promise<ExternalCompany[]> {
  const token = process.env.CNPJWS_API_KEY
  if (!token) throw new Error('A pesquisa oficial no CNPJ.ws exige token do plano comercial/Premium. A API pública não oferece pesquisa por filtros.')
  if (!filters.cnae && !filters.keyword) throw new Error('Para CNPJ.ws informe CNAE ou razão/nome da empresa.')
  const params = new URLSearchParams({ limite: String(filters.limit) })
  if (filters.cnae) params.set('atividade_id', filters.cnae.replace(/\D/g, ''))
  if (filters.keyword && !filters.cnae) params.set('razao_social', filters.keyword)
  if (filters.uf && UF_IBGE[filters.uf.toUpperCase()]) params.set('estado_id', UF_IBGE[filters.uf.toUpperCase()])
  if (filters.uf && filters.municipio) {
    const cityId = await resolveCityIbge(filters.uf, filters.municipio)
    if (cityId) params.set('cidade_id', cityId)
  }
  params.set('situacao_cadastral', 'Ativa')
  const searchRes = await fetch(`https://comercial.cnpj.ws/v2/pesquisa?${params.toString()}`, {
    headers: { accept: 'application/json', 'x_api_token': token },
  })
  if (!searchRes.ok) {
    const text = await searchRes.text().catch(() => '')
    throw new Error(`CNPJ.ws pesquisa ${searchRes.status}: ${text.slice(0, 200)}`)
  }
  const searchPayload = await searchRes.json() as { data?: string[] }
  const cnpjs = (searchPayload.data ?? []).slice(0, filters.limit)
  const companies: ExternalCompany[] = []
  for (const cnpj of cnpjs) {
    const detailRes = await fetch(`https://comercial.cnpj.ws/cnpj/${cnpj}`, {
      headers: { accept: 'application/json', 'x_api_token': token },
    })
    if (!detailRes.ok) continue
    const item = await detailRes.json() as any
    const estab = item?.estabelecimento ?? {}
    const phone = estab.ddd1 && estab.telefone1 ? `(${estab.ddd1}) ${estab.telefone1}` : (estab.telefone1 ?? null)
    const company: ExternalCompany = {
      cnpj: estab.cnpj || cnpj,
      razao_social: item.razao_social || '',
      nome_fantasia: estab.nome_fantasia ?? null,
      cnae_principal: estab.atividade_principal?.subclasse ?? estab.atividade_principal?.id ?? null,
      cnae_descricao: estab.atividade_principal?.descricao ?? null,
      porte: typeof item.porte === 'string' ? item.porte : item.porte?.descricao ?? null,
      capital_social: item.capital_social != null ? Number(item.capital_social) : null,
      situacao: estab.situacao_cadastral ?? null,
      data_abertura: estab.data_inicio_atividade ?? null,
      telefone: phone,
      whatsapp: detectWhatsapp(phone),
      email: estab.email ?? null,
      logradouro: [estab.tipo_logradouro, estab.logradouro].filter(Boolean).join(' ') || null,
      numero: estab.numero ?? null,
      bairro: estab.bairro ?? null,
      municipio: estab.cidade?.nome ?? null,
      uf: estab.estado?.sigla ?? null,
      cep: estab.cep ?? null,
      source: 'cnpj_ws',
    }
    companies.push(scoreCompany(company, filters))
  }
  const porte = normalizeText(filters.porte)
  return companies.filter((company) => !porte || normalizeText(company.porte).includes(porte)).slice(0, filters.limit)
}

function searchHash(filters: SearchFilters): string {
  return JSON.stringify({ ...filters, keyword: normalizeText(filters.keyword), municipio: normalizeText(filters.municipio) })
}

export const getLeadSearchCapabilities = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = orgIdFrom(context)
    const { data: settings } = await (context.supabase as any)
      .from('company_settings')
      .select('prospecting_sources')
      .eq('organization_id', orgId)
      .limit(1)
      .maybeSingle()
    const configured = (settings?.prospecting_sources as Record<string, boolean> | null) ?? {}
    const [cnpj, google, apify] = await Promise.all([
      getIntegrationRuntimeState(context as any, 'cnpj_ws'),
      getIntegrationRuntimeState(context as any, 'google_places'),
      getIntegrationRuntimeState(context as any, 'apify'),
    ])
    return {
      test: true,
      sources: {
        cnpj_ws: { enabled: configured.cnpj_ws !== false && cnpj.operational && cnpj.mode === 'real', configured: cnpj.credentialConfigured, paused: cnpj.paused, mode: cnpj.mode, label: 'CNPJ.ws Comercial' },
        google_places: { enabled: configured.google_places !== false && google.operational && google.mode === 'real', configured: google.credentialConfigured, paused: google.paused, mode: google.mode, label: 'Google Places' },
        apify: { enabled: configured.apify !== false && apify.operational && apify.mode === 'real', configured: apify.credentialConfigured, paused: apify.paused, mode: apify.mode, label: 'Apify / Google Maps' },
        ai_only: { enabled: false, configured: !!process.env.ANTHROPIC_API_KEY, label: 'IA somente (não validada)' },
      },
    }
  })

export const searchLeadProspects = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data, context }) => {
    const orgId = orgIdFrom(context)
    const filters: SearchFilters = data
    const hash = searchHash(filters)
    const { data: cached } = await (context.supabase as any)
      .from('prospecting_cache')
      .select('id, results')
      .eq('organization_id', orgId)
      .eq('user_id', context.userId)
      .eq('filters_hash', hash)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (cached) return { cache_id: cached.id as string, cached: true, mode: filters.mode, results: (cached.results ?? []) as ExternalCompany[] }

    let results: ExternalCompany[]
    if (filters.mode === 'live') {
      if (filters.source === 'ai_only') throw new Error('A fonte IA somente não é aceita para prospecção oficial sem validação externa.')
      await assertIntegrationOperational(context as any, filters.source as 'cnpj_ws' | 'google_places' | 'apify', { requireReal: true })
    }
    if (filters.mode === 'test') results = demoCompanies(filters)
    else if (filters.source === 'google_places') results = await searchGoogle(filters)
    else if (filters.source === 'apify') results = await searchApify(filters)
    else if (filters.source === 'cnpj_ws') results = await searchCnpjWsCommercial(filters)
    else throw new Error('A fonte IA somente não é aceita para prospecção oficial sem validação externa.')

    const now = new Date()
    const expiry = new Date(now.getTime() + (filters.mode === 'test' ? 24 : 12) * 60 * 60 * 1000).toISOString()
    const name = `${filters.mode === 'test' ? 'TESTE' : 'OFICIAL'} · ${filters.keyword || filters.cnae || 'Busca'} · ${filters.municipio || filters.uf || 'Brasil'} · ${results.length}`
    const { data: row, error } = await (context.supabase as any)
      .from('prospecting_cache')
      .insert({
        organization_id: orgId,
        user_id: context.userId,
        filters,
        filters_hash: hash,
        results,
        data: {},
        total_found: results.length,
        scored: true,
        name,
        saved: true,
        expires_at: expiry,
      })
      .select('id')
      .single()
    if (error) throw new Error(`Não foi possível salvar a busca: ${error.message}`)
    return { cache_id: row.id as string, cached: false, mode: filters.mode, results }
  })

export const listLeadSearchHistory = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const orgId = orgIdFrom(context)
    const { data, error } = await (context.supabase as any)
      .from('prospecting_cache')
      .select('id, name, filters, total_found, created_at')
      .eq('organization_id', orgId)
      .eq('user_id', context.userId)
      .eq('saved', true)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? 'Busca sem nome',
      source: row.filters?.source ?? '—',
      mode: row.filters?.mode ?? 'live',
      total_found: row.total_found ?? 0,
      created_at: row.created_at,
    }))
  })

export const importLeadProspects = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => importSchema.parse(data))
  .handler(async ({ data, context }) => {
    const orgId = orgIdFrom(context)
    const supabase = context.supabase as any
    const { data: cache, error: cacheError } = await supabase
      .from('prospecting_cache')
      .select('results, filters')
      .eq('id', data.cache_id)
      .eq('organization_id', orgId)
      .eq('user_id', context.userId)
      .maybeSingle()
    if (cacheError) throw new Error(cacheError.message)
    if (!cache) throw new Error('Resultado de busca não encontrado para esta empresa.')
    const filters = (cache.filters ?? {}) as SearchFilters
    const isTest = filters.mode === 'test'
    const companies = ((cache.results ?? []) as ExternalCompany[]).filter((company) => data.keys.includes(company.cnpj))
    if (!companies.length) throw new Error('Nenhum prospecto válido foi selecionado.')

    const cfg = await loadLeadFlowSettings(supabase, orgId)
    const importedIds: string[] = []
    const skipped: Array<{ key: string; reason: string }> = []
    const blocked: Array<{ id?: string; company: string; reason: string }> = []

    for (const company of companies) {
      try {
        if (!isTest && !company.whatsapp && !company.telefone && !company.email) {
          skipped.push({ key: company.cnpj, reason: 'Sem canal de contato validado' })
          continue
        }
        if (!isTest) {
          const { isAnyContactSuppressed } = await import('./outreach.functions')
          const suppressed = await isAnyContactSuppressed(context as never, null, {
            whatsapp: company.whatsapp,
            phone: company.telefone,
            email: company.email,
          })
          if (suppressed) {
            skipped.push({ key: company.cnpj, reason: 'Contato em opt-out/supressão' })
            continue
          }
        }

        const origin = `${isTest ? 'test' : 'live'}:${company.source}:${company.cnpj}`
        const { data: duplicate } = await supabase
          .from('leads')
          .select('id')
          .eq('organization_id', orgId)
          .eq('origin', origin)
          .maybeSingle()
        if (duplicate) {
          skipped.push({ key: company.cnpj, reason: 'Duplicado' })
          continue
        }

        const now = new Date().toISOString()
        const assignee = data.approach === 'humano' ? (data.assignee_id || context.userId) : null
        const channels = {
          whatsapp: { available: !!company.whatsapp, last_status: null, last_attempt_at: null },
          email: { available: !!company.email, last_status: null, last_attempt_at: null },
          phone: { available: !!company.telefone, last_status: null, last_attempt_at: null },
        }
        const payload = {
          organization_id: orgId,
          owner_id: context.userId,
          company: company.nome_fantasia || company.razao_social,
          contact: null,
          title: null,
          phone: company.telefone,
          whatsapp: company.whatsapp,
          email: company.email,
          segment: company.cnae_descricao,
          uf: company.uf,
          city: company.municipio,
          distance: company.distance_km == null ? null : Math.round(company.distance_km),
          size: normalizeText(company.porte).includes('grande') ? 'grande' : normalizeText(company.porte).includes('médio') || normalizeText(company.porte).includes('medio') ? 'media' : 'pequena',
          score: company.score ?? 0,
          score_snapshot: { total: company.score ?? 0, reason: company.score_reason ?? null, mode: isTest ? 'test' : 'live', source: company.source, captured_at: now },
          score_explanation: company.score_reason ?? null,
          score_source: company.source,
          score_verified_at: now,
          temp: (company.score ?? 0) >= 75 ? 'hot' : (company.score ?? 0) >= 50 ? 'warm' : 'cold',
          stage: 'Prospecção',
          origin,
          contact_channels: channels,
          approach_type: data.approach,
          approach_set_at: now,
          owner: data.approach === 'ia' ? 'ia' : 'human',
          ai_paused: data.approach === 'humano' || isTest,
          assigned_to: assignee,
        }
        const { data: lead, error } = await supabase.from('leads').insert(payload).select('id, company').single()
        if (error) throw new Error(error.message)
        importedIds.push(lead.id)

        if (data.approach === 'humano') {
          const sla = data.sla_hours ?? cfg.human_sla_hours
          const dueAt = new Date(Date.now() + sla * 3600_000).toISOString()
          if (cfg.human_create_task) {
            await supabase.from('lead_tasks').insert({
              organization_id: orgId,
              lead_id: lead.id,
              text: isTest ? 'Primeiro contato com lead de teste' : 'Primeiro contato com o lead',
              due_at: dueAt,
              owner_id: assignee,
              owner_label: 'Vendedor',
              completed: false,
            })
          }
          if (cfg.human_notify && assignee) {
            await supabase.from('notifications').insert({
              organization_id: orgId,
              user_id: assignee,
              kind: 'lead',
              title: `${isTest ? '[TESTE] ' : ''}Novo lead para abordagem: ${lead.company}`,
              description: `SLA de ${sla}h para o primeiro contato.`,
              link: `/leads/${lead.id}`,
              read: false,
            })
          }
        } else if (!isTest && cfg.ai_auto_start) {
          try {
            const { triggerOutreachInternal } = await import('./outreach.functions')
            await triggerOutreachInternal(context as never, lead.id)
            await markFirstOutreach(supabase, lead.id, cfg)
          } catch (error) {
            blocked.push({ id: lead.id, company: lead.company, reason: `Lead criado, mas o disparo da Ana falhou: ${(error as Error).message}` })
          }
        }

        await supabase.from('audit_logs').insert({
          organization_id: orgId,
          actor_id: context.userId,
          actor_name: context.claims?.email ?? 'user',
          actor_type: 'human',
          action: isTest ? 'lead_search_import_test' : 'lead_search_import_live',
          detail: `${lead.company} importado da Busca de Leads (${company.source}) para abordagem ${data.approach}`,
          entity_id: lead.id,
          entity_table: 'leads',
        })
      } catch (error) {
        skipped.push({ key: company.cnpj, reason: (error as Error).message })
      }
    }

    return {
      imported: importedIds.length,
      imported_ids: importedIds,
      started: data.approach === 'ia' && !isTest ? importedIds.length - blocked.length : 0,
      skipped,
      blocked,
      mode: isTest ? 'test' : 'live',
    }
  })