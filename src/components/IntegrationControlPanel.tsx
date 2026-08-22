import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle, CheckCircle2, Edit3, Loader2, Pause, Play, Plug, RefreshCw, ShieldCheck, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { Card, SectionTitle } from '@/components/ui-kit'
import {
  listIntegrationControls,
  testIntegrationControl,
  updateIntegrationControl,
  type IntegrationKey,
  type IntegrationMode,
} from '@/lib/integration-control.functions'

const STATUS_LABEL: Record<string, string> = {
  ready: 'Pronta para uso real',
  sandbox: 'Sandbox',
  paused: 'Pausada',
  disabled: 'Desativada',
  missing_credentials: 'Credencial pendente',
  legacy_dependency: 'Dependência legada',
}

function statusClass(status: string) {
  if (status === 'ready') return 'bg-success-bg text-success'
  if (status === 'sandbox') return 'bg-warning-bg text-warning'
  if (status === 'paused') return 'bg-warning-bg text-warning'
  if (status === 'missing_credentials') return 'bg-error-bg text-error'
  if (status === 'legacy_dependency') return 'bg-warning-bg text-warning'
  return 'bg-bg-general text-text-sec'
}

export function IntegrationControlPanel() {
  const qc = useQueryClient()
  const listFn = useServerFn(listIntegrationControls)
  const updateFn = useServerFn(updateIntegrationControl)
  const testFn = useServerFn(testIntegrationControl)
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['integration-controls'],
    queryFn: () => listFn(),
  })
  const [editing, setEditing] = useState<IntegrationKey | null>(null)
  const [configText, setConfigText] = useState('{}')

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['integration-controls'] })
    qc.invalidateQueries({ queryKey: ['integrations'] })
    qc.invalidateQueries({ queryKey: ['enabled-sources'] })
    qc.invalidateQueries({ queryKey: ['lead-search-capabilities'] })
  }

  const updateMut = useMutation({
    mutationFn: (payload: { key: IntegrationKey; enabled?: boolean; paused?: boolean; mode?: IntegrationMode; configuration?: Record<string, unknown> }) =>
      updateFn({ data: payload }),
    onSuccess: () => {
      refresh()
      toast.success('Integração atualizada.')
    },
    onError: (e: Error) => toast.error('Falha ao atualizar integração', { description: e.message }),
  })

  const testMut = useMutation({
    mutationFn: (key: IntegrationKey) => testFn({ data: { key } }),
    onSuccess: (result) => {
      refresh()
      result.ok ? toast.success(result.message) : toast.error('Teste falhou', { description: result.message })
    },
    onError: (e: Error) => toast.error('Falha no teste', { description: e.message }),
  })

  if (isLoading) return <Card><div className="flex items-center gap-2 p-3 text-sm text-text-sec"><Loader2 className="h-4 w-4 animate-spin" /> Carregando APIs…</div></Card>
  if (error) return <Card><div className="flex items-center gap-2 text-sm text-error"><AlertCircle className="h-4 w-4" />{error instanceof Error ? error.message : 'Falha ao carregar integrações.'}</div></Card>

  const groups = ['IA', 'Comunicação', 'Prospecção', 'Agenda', 'Automação'] as const

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle title="Central de APIs e Integrações" hint="Controle operacional real: ambiente, conexão, teste, pausa e status. Segredos permanecem no cofre do servidor." />
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Total" value={data.length} />
          <Metric label="Ativas" value={data.filter((i) => i.enabled && !i.paused).length} />
          <Metric label="Prontas reais" value={data.filter((i) => i.status === 'ready').length} />
          <Metric label="Pendências" value={data.filter((i) => ['missing_credentials', 'legacy_dependency'].includes(i.status)).length} />
        </div>
        <div className="mt-3 rounded-md border border-border-card bg-bg-general p-3 text-xs text-text-sec">
          <ShieldCheck className="mr-1 inline h-4 w-4 text-success" />
          API keys, tokens, client secrets e senhas nunca são retornados ao navegador. O botão <b>Editar</b> altera somente parâmetros operacionais não sensíveis.
        </div>
      </Card>

      {groups.map((group) => {
        const rows = data.filter((item) => item.category === group)
        if (!rows.length) return null
        return (
          <Card key={group}>
            <SectionTitle title={group} hint={`${rows.length} integração(ões)`} />
            <div className="space-y-3">
              {rows.map((item) => {
                const busy = (updateMut.isPending && updateMut.variables?.key === item.key) || (testMut.isPending && testMut.variables === item.key)
                return (
                  <div key={item.key} className="rounded-lg border border-border-card p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-text-title">{item.label}</div>
                          <span className="rounded-full border border-border-card px-2 py-0.5 text-[10px] text-text-ter">{item.provider}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(item.status)}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
                        </div>
                        <div className="mt-1 text-xs text-text-sec">{item.description}</div>
                        {item.limitation && <div className="mt-2 rounded-md bg-warning-bg px-2.5 py-2 text-[11px] text-warning"><AlertCircle className="mr-1 inline h-3.5 w-3.5" />{item.limitation}</div>}
                        {!item.credentialConfigured && (
                          <div className="mt-2 text-[11px] text-error">Falta no servidor: {item.missingSecrets.join(', ')}</div>
                        )}
                        <div className="mt-2 grid gap-1 text-[11px] text-text-ter sm:grid-cols-2 xl:grid-cols-4">
                          <span>Teste: {item.lastTestedAt ? new Date(item.lastTestedAt).toLocaleString('pt-BR') : 'Nunca'}</span>
                          <span>Sucesso: {item.lastSuccessAt ? new Date(item.lastSuccessAt).toLocaleString('pt-BR') : '—'}</span>
                          <span>Conexão: {item.connected ? 'Confirmada' : 'Não confirmada'}</span>
                          <span>Estado: {item.paused ? 'Pausado' : item.enabled ? 'Ativo' : 'Desativado'}</span>
                        </div>
                        {item.lastError && <div className="mt-2 text-[11px] text-error">Último erro: {item.lastError}</div>}
                        {item.statusDetail && <div className="mt-1 text-[11px] text-text-sec">{item.statusDetail}</div>}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={item.mode}
                          disabled={busy}
                          onChange={(e) => updateMut.mutate({ key: item.key, mode: e.target.value as IntegrationMode })}
                          className="h-8 rounded-md border border-border-card bg-bg-card px-2 text-xs"
                          aria-label={`Ambiente de ${item.label}`}
                        >
                          <option value="sandbox">Sandbox</option>
                          <option value="real">Real</option>
                          <option value="disabled">Desabilitado</option>
                        </select>

                        <button
                          disabled={busy}
                          onClick={() => updateMut.mutate({ key: item.key, enabled: !item.enabled })}
                          className={`inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs ${item.enabled ? 'border-border-card text-text-sec hover:bg-error-bg hover:text-error' : 'border-primary bg-primary text-primary-foreground'}`}
                        >
                          {item.enabled ? <><Unplug className="h-3.5 w-3.5" /> Desativar</> : <><Plug className="h-3.5 w-3.5" /> Ativar</>}
                        </button>

                        <button
                          disabled={busy || !item.enabled}
                          onClick={() => updateMut.mutate({ key: item.key, paused: !item.paused })}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-border-card px-2.5 text-xs text-text-body hover:bg-bg-general disabled:opacity-40"
                        >
                          {item.paused ? <><Play className="h-3.5 w-3.5" /> Retomar</> : <><Pause className="h-3.5 w-3.5" /> Pausar</>}
                        </button>

                        <button
                          disabled={busy}
                          onClick={() => testMut.mutate(item.key)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-border-card px-2.5 text-xs text-text-body hover:bg-bg-general disabled:opacity-50"
                        >
                          {testMut.isPending && testMut.variables === item.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Testar
                        </button>

                        <button
                          disabled={busy}
                          onClick={() => { setEditing(item.key); setConfigText(JSON.stringify(item.configuration ?? {}, null, 2)) }}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-border-card px-2.5 text-xs text-text-body hover:bg-bg-general"
                        >
                          <Edit3 className="h-3.5 w-3.5" /> Editar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-xl rounded-xl border border-border-card bg-bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-text-title">Editar configuração operacional</div>
            <div className="mt-1 text-xs text-text-sec">Somente dados não sensíveis. Chaves, tokens e senhas digitados aqui são descartados pelo servidor.</div>
            <textarea value={configText} onChange={(e) => setConfigText(e.target.value)} rows={12} spellCheck={false} className="mt-4 w-full rounded-md border border-border-card bg-bg-general p-3 font-mono text-xs outline-none focus:border-primary" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-border-card px-3 py-2 text-xs">Cancelar</button>
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(configText) as Record<string, unknown>
                    updateMut.mutate({ key: editing, configuration: parsed }, { onSuccess: () => setEditing(null) })
                  } catch {
                    toast.error('JSON inválido. Revise a configuração antes de salvar.')
                  }
                }}
                className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >Salvar configuração</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border border-border-card bg-bg-general p-3"><div className="text-[10px] uppercase text-text-ter">{label}</div><div className="mt-1 text-xl font-semibold text-text-title">{value}</div></div>
}
