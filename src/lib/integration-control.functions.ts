import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

export type IntegrationKey =
  | 'ai'
  | 'whatsapp'
  | 'email'
  | 'google_places'
  | 'apify'
  | 'cnpj_ws'
  | 'google_calendar'
  | 'scheduler'
  | 'zapi_webhook'
  | 'resend_webhook'

export type IntegrationMode = 'sandbox' | 'real' | 'disabled'

type RuntimeContext = {
  supabase: any
  userId: string
  organizationId?: string
  claims?: any
}

const KEYS = [
  'ai',
  'whatsapp',
  'email',
  'google_places',
  'apify',
  'cnpj_ws',
  'google_calendar',
  'scheduler',
  'zapi_webhook',
  'resend_webhook',
] as const

const keySchema = z.enum(KEYS)

const CATALOG: Record<IntegrationKey, {
  label: string
  provider: string
  category: 'IA' | 'Comunicação' | 'Prospecção' | 'Agenda' | 'Automação'
  description: string
  requiredSecrets: string[]
  limitation?: string
}> = {
  ai: {
    label: 'Ana (IA)',
    provider: 'Anthropic',
    category: 'IA',
    description: 'Geração de mensagens, classificação e apoio comercial da Ana.',
    requiredSecrets: ['ANTHROPIC_API_KEY'],
  },
  whatsapp: {
    label: 'WhatsApp',
    provider: 'Z-API',
    category: 'Comunicação',
    description: 'Envio de mensagens WhatsApp pela instância Z-API.',
    requiredSecrets: ['ZAPI_INSTANCE_ID', 'ZAPI_TOKEN'],
  },
  email: {
    label: 'E-mail',
    provider: 'Resend',
    category: 'Comunicação',
    description: 'Envio de e-mails comerciais e transacionais.',
    requiredSecrets: ['RESEND_API_KEY', 'OUTREACH_EMAIL_FROM'],
  },
  google_places: {
    label: 'Google Places',
    provider: 'Google',
    category: 'Prospecção',
    description: 'Busca de empresas por palavra-chave, localização e raio.',
    requiredSecrets: ['GOOGLE_PLACES_API_KEY'],
  },
  apify: {
    label: 'Apify / Google Maps',
    provider: 'Apify',
    category: 'Prospecção',
    description: 'Descoberta de empresas por Actor/Task autorizado da Apify.',
    requiredSecrets: ['APIFY_TOKEN'],
  },
  cnpj_ws: {
    label: 'CNPJ.ws Comercial',
    provider: 'CNPJ.ws',
    category: 'Prospecção',
    description: 'Pesquisa empresarial filtrada usando a API comercial do CNPJ.ws.',
    requiredSecrets: ['CNPJWS_API_KEY'],
    limitation: 'Pesquisa por filtros exige plano comercial/Premium; a API pública serve para consulta de CNPJ específico.',
  },
  google_calendar: {
    label: 'Google Calendar',
    provider: 'Google',
    category: 'Agenda',
    description: 'Sincronização de reuniões com o Google Calendar.',
    requiredSecrets: ['GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY'],
    limitation: 'A implementação atual ainda depende do gateway de conector legado do Lovable. Deve ser migrada para OAuth Google direto para operação totalmente independente.',
  },
  scheduler: {
    label: 'Agendador de automações',
    provider: 'LeadAI',
    category: 'Automação',
    description: 'Protege os endpoints que drenam filas, cadências e timeouts.',
    requiredSecrets: ['OUTREACH_CRON_SECRET'],
  },
  zapi_webhook: {
    label: 'Webhook Z-API',
    provider: 'Z-API',
    category: 'Comunicação',
    description: 'Autentica callbacks de mensagens recebidas e status do WhatsApp.',
    requiredSecrets: ['ZAPI_WEBHOOK_SECRET'],
  },
  resend_webhook: {
    label: 'Webhook Resend',
    provider: 'Resend',
    category: 'Comunicação',
    description: 'Autentica callbacks de entrega, bounce e resposta por e-mail.',
    requiredSecrets: ['RESEND_WEBHOOK_SECRET'],
  },
}

function envConfigured(key: IntegrationKey) {
  const missing = CATALOG[key].requiredSecrets.filter((name) => !process.env[name])
  return { configured: missing.length === 0, missing }
}

function orgIdFrom(context: RuntimeContext): string {
  const orgId = context.organizationId
  if (!orgId) throw new Error('Empresa ativa não encontrada para esta sessão.')
  return String(orgId)
}

function sanitizeConfiguration(input: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!input) return {}
  const blocked = /secret|token|password|api[_-]?key|client[_-]?secret|private[_-]?key/i
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => !blocked.test(key))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 500) : value]),
  )
}

async function loadRow(context: RuntimeContext, key: IntegrationKey) {
  const orgId = orgIdFrom(context)
  const { data, error } = await context.supabase
    .from('integrations')
    .select('*')
    .eq('organization_id', orgId)
    .eq('key', key)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function getIntegrationRuntimeState(context: RuntimeContext, key: IntegrationKey) {
  const row = await loadRow(context, key)
  const credential = envConfigured(key)
  const enabled = Boolean(row?.enabled)
  const paused = Boolean(row?.paused)
  const mode = (row?.mode ?? 'sandbox') as IntegrationMode
  const operational = enabled && !paused && mode !== 'disabled' && credential.configured
  return { row, enabled, paused, mode, credentialConfigured: credential.configured, missing: credential.missing, operational }
}

export async function assertIntegrationOperational(
  context: RuntimeContext,
  key: IntegrationKey,
  options: { requireReal?: boolean } = {},
) {
  const state = await getIntegrationRuntimeState(context, key)
  if (!state.enabled) throw new Error(`${CATALOG[key].label} está desativada em Configurações → Integrações.`)
  if (state.paused) throw new Error(`${CATALOG[key].label} está pausada em Configurações → Integrações.`)
  if (state.mode === 'disabled') throw new Error(`${CATALOG[key].label} está com ambiente desabilitado.`)
  if (options.requireReal && state.mode !== 'real') throw new Error(`${CATALOG[key].label} não está liberada para uso real. Altere o ambiente para Real após validar o sandbox.`)
  if (!state.credentialConfigured) throw new Error(`${CATALOG[key].label} sem credenciais no servidor: ${state.missing.join(', ')}.`)
  return state
}

export const listIntegrationControls = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as RuntimeContext
    const orgId = orgIdFrom(ctx)
    const { data: rows, error } = await ctx.supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', orgId)
      .in('key', [...KEYS])
      .order('label')
    if (error) throw new Error(error.message)

    const byKey = new Map((rows ?? []).map((row: any) => [row.key, row]))
    return KEYS.map((key) => {
      const meta = CATALOG[key]
      const row: any = byKey.get(key) ?? null
      const credential = envConfigured(key)
      const enabled = Boolean(row?.enabled)
      const paused = Boolean(row?.paused)
      const mode = (row?.mode ?? 'sandbox') as IntegrationMode
      let status: 'paused' | 'disabled' | 'missing_credentials' | 'sandbox' | 'ready' | 'legacy_dependency'
      if (paused) status = 'paused'
      else if (!enabled || mode === 'disabled') status = 'disabled'
      else if (!credential.configured) status = 'missing_credentials'
      else if (key === 'google_calendar') status = 'legacy_dependency'
      else if (mode === 'sandbox') status = 'sandbox'
      else status = 'ready'

      return {
        key,
        ...meta,
        id: row?.id ?? null,
        enabled,
        paused,
        connected: Boolean(row?.connected),
        mode,
        status,
        credentialConfigured: credential.configured,
        missingSecrets: credential.missing,
        configuration: sanitizeConfiguration(row?.configuration ?? {}),
        statusDetail: row?.status_detail ?? null,
        lastTestedAt: row?.last_tested_at ?? null,
        lastSuccessAt: row?.last_success_at ?? null,
        lastErrorAt: row?.last_error_at ?? null,
        lastError: row?.last_error ?? null,
      }
    })
  })

const updateSchema = z.object({
  key: keySchema,
  enabled: z.boolean().optional(),
  paused: z.boolean().optional(),
  mode: z.enum(['sandbox', 'real', 'disabled']).optional(),
  configuration: z.record(z.string(), z.unknown()).optional(),
})

export const updateIntegrationControl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as RuntimeContext
    const orgId = orgIdFrom(ctx)
    const meta = CATALOG[data.key]
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.enabled !== undefined) patch.enabled = data.enabled
    if (data.paused !== undefined) patch.paused = data.paused
    if (data.mode !== undefined) patch.mode = data.mode
    if (data.configuration !== undefined) patch.configuration = sanitizeConfiguration(data.configuration)

    const { data: row, error } = await ctx.supabase
      .from('integrations')
      .upsert({ organization_id: orgId, key: data.key, label: meta.label, provider: meta.provider, connected: false, ...patch }, { onConflict: 'organization_id,key' })
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Keep prospecting settings aligned with the canonical control center.
    const sourceKey = data.key === 'cnpj_ws' ? 'cnpj' : data.key
    if (['cnpj_ws', 'google_places', 'apify'].includes(data.key)) {
      await ctx.supabase
        .from('lead_source_configs')
        .update({
          enabled: data.enabled ?? row.enabled,
          mode: (data.mode ?? row.mode) === 'real' ? 'real' : 'sandbox',
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', orgId)
        .eq('source_key', sourceKey)
    }

    return { ok: true, row }
  })

async function providerTest(context: RuntimeContext, key: IntegrationKey): Promise<{ ok: boolean; message: string; connected?: boolean }> {
  const credential = envConfigured(key)
  if (!credential.configured) return { ok: false, message: `Credenciais ausentes: ${credential.missing.join(', ')}` }

  if (key === 'whatsapp') {
    const instance = process.env.ZAPI_INSTANCE_ID!
    const token = process.env.ZAPI_TOKEN!
    const clientToken = process.env.ZAPI_CLIENT_TOKEN
    const res = await fetch(`https://api.z-api.io/instances/${instance}/token/${token}/status`, {
      headers: clientToken ? { 'Client-Token': clientToken } : {},
    })
    const body = await res.json().catch(() => ({})) as any
    if (!res.ok) return { ok: false, message: `Z-API HTTP ${res.status}` }
    const connected = Boolean(body.connected ?? body?.status === 'connected')
    return { ok: true, connected, message: connected ? 'Instância Z-API conectada.' : 'Credenciais válidas; instância ainda não conectada ao WhatsApp.' }
  }

  if (key === 'email') {
    const res = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } })
    if (!res.ok) return { ok: false, message: `Resend HTTP ${res.status}` }
    return { ok: true, connected: true, message: 'Resend autenticado. Remetente configurado no servidor.' }
  }

  if (key === 'apify') {
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${encodeURIComponent(process.env.APIFY_TOKEN!)}`)
    if (!res.ok) return { ok: false, message: `Apify HTTP ${res.status}` }
    const body = await res.json().catch(() => ({})) as any
    return { ok: true, connected: true, message: `Apify autenticada${body?.data?.username ? ` como ${body.data.username}` : ''}.` }
  }

  if (key === 'google_places') {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY!,
        'X-Goog-FieldMask': 'places.id',
      },
      body: JSON.stringify({ textQuery: 'empresa São Paulo Brasil', languageCode: 'pt-BR', regionCode: 'BR', pageSize: 1 }),
    })
    if (!res.ok) return { ok: false, message: `Google Places HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 180)}` }
    return { ok: true, connected: true, message: 'Google Places respondeu corretamente.' }
  }

  if (key === 'cnpj_ws') {
    const res = await fetch('https://comercial.cnpj.ws/consumo', { headers: { accept: 'application/json', x_api_token: process.env.CNPJWS_API_KEY! } })
    if (!res.ok) return { ok: false, message: `CNPJ.ws HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 180)}` }
    return { ok: true, connected: true, message: 'CNPJ.ws Comercial autenticado.' }
  }

  if (key === 'ai') {
    const { data: settings } = await context.supabase.from('company_settings').select('ai_model').limit(1).maybeSingle()
    const model = settings?.ai_model || 'claude-sonnet-4-5-20250929'
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 8, temperature: 0, messages: [{ role: 'user', content: 'Responda apenas OK.' }] }),
    })
    if (!res.ok) return { ok: false, message: `Anthropic HTTP ${res.status}: ${(await res.text().catch(() => '')).slice(0, 180)}` }
    return { ok: true, connected: true, message: `Anthropic respondeu com o modelo ${model}.` }
  }

  if (key === 'google_calendar') {
    const { data: connection } = await context.supabase
      .from('app_user_connections')
      .select('id')
      .eq('user_id', context.userId)
      .eq('connector_id', 'google_calendar')
      .maybeSingle()
    if (!connection) return { ok: false, message: 'Cliente do conector existe, mas este usuário ainda não conectou uma conta Google Calendar.' }
    return { ok: true, connected: true, message: 'Conexão Google Calendar encontrada. Atenção: ainda usa o gateway legado do Lovable.' }
  }

  return { ok: true, connected: true, message: 'Configuração de segurança presente no servidor.' }
}

export const testIntegrationControl = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ key: keySchema }).parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as RuntimeContext
    const orgId = orgIdFrom(ctx)
    const now = new Date().toISOString()
    let result: { ok: boolean; message: string; connected?: boolean }
    try {
      result = await providerTest(ctx, data.key)
    } catch (error) {
      result = { ok: false, message: error instanceof Error ? error.message : 'Falha desconhecida no teste.' }
    }

    const patch = result.ok
      ? { connected: result.connected ?? true, last_tested_at: now, last_success_at: now, last_error: null, last_error_at: null, status_detail: result.message, updated_at: now }
      : { connected: false, last_tested_at: now, last_error: result.message.slice(0, 500), last_error_at: now, status_detail: result.message.slice(0, 500), updated_at: now }

    const { error } = await ctx.supabase
      .from('integrations')
      .update(patch)
      .eq('organization_id', orgId)
      .eq('key', data.key)
    if (error) throw new Error(error.message)

    return result
  })
