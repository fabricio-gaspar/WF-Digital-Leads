-- LeadAI integration control center.
-- Adds operational state, test telemetry and safe editable metadata to each integration.

ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_tested_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

-- Preserve existing behavior where a row was already considered connected,
-- while still allowing an administrator to pause it explicitly afterwards.
UPDATE public.integrations
SET enabled = COALESCE(connected, false)
WHERE enabled = false
  AND COALESCE(connected, false) = true;

-- Correct the provider label to match the runtime actually used by LeadAI.
UPDATE public.integrations
SET provider = 'Anthropic', label = 'Ana (IA)'
WHERE key = 'ai';

-- Normalize the canonical operational catalog for every organization.
WITH catalog(key, label, provider, status_detail) AS (
  VALUES
    ('ai', 'Ana (IA)', 'Anthropic', 'IA conversacional e classificação comercial.'),
    ('whatsapp', 'WhatsApp', 'Z-API', 'Envio e recebimento de mensagens WhatsApp.'),
    ('email', 'E-mail', 'Resend', 'Envio transacional/comercial e webhooks de e-mail.'),
    ('google_places', 'Google Places', 'Google', 'Busca geográfica de empresas e geocodificação.'),
    ('apify', 'Apify / Google Maps', 'Apify', 'Busca de empresas por Actor/Task autorizado.'),
    ('cnpj_ws', 'CNPJ.ws Comercial', 'CNPJ.ws', 'Pesquisa empresarial por filtros usando o plano comercial.'),
    ('google_calendar', 'Google Calendar', 'Google', 'Sincronização de reuniões e agenda.'),
    ('scheduler', 'Agendador de automações', 'LeadAI', 'Execução segura de filas, cadências e timeouts.'),
    ('zapi_webhook', 'Webhook Z-API', 'Z-API', 'Recebe respostas e atualizações de entrega do WhatsApp.'),
    ('resend_webhook', 'Webhook Resend', 'Resend', 'Recebe eventos de entrega, bounce e resposta por e-mail.')
)
INSERT INTO public.integrations (
  organization_id,
  key,
  label,
  provider,
  connected,
  enabled,
  paused,
  mode,
  status_detail,
  configuration
)
SELECT
  cs.organization_id,
  c.key,
  c.label,
  c.provider,
  false,
  false,
  false,
  'sandbox',
  c.status_detail,
  '{}'::jsonb
FROM (SELECT DISTINCT organization_id FROM public.company_settings) cs
CROSS JOIN catalog c
ON CONFLICT (organization_id, key) DO UPDATE
SET label = EXCLUDED.label,
    provider = EXCLUDED.provider,
    status_detail = CASE
      WHEN public.integrations.status_detail IS NULL OR public.integrations.status_detail = ''
        THEN EXCLUDED.status_detail
      ELSE public.integrations.status_detail
    END,
    updated_at = now();

CREATE INDEX IF NOT EXISTS integrations_org_enabled_idx
  ON public.integrations (organization_id, enabled, paused, key);

COMMENT ON COLUMN public.integrations.enabled IS 'Administrator-controlled operational enable switch. Credentials are validated separately at runtime.';
COMMENT ON COLUMN public.integrations.paused IS 'Temporary operational pause. Paused integrations must not initiate external outbound operations.';
COMMENT ON COLUMN public.integrations.configuration IS 'Non-secret editable provider configuration. API keys/tokens remain server-side secrets.';
COMMENT ON COLUMN public.integrations.last_tested_at IS 'Last explicit connection test requested by an administrator.';
COMMENT ON COLUMN public.integrations.last_success_at IS 'Last successful connection test or provider operation recorded by the control layer.';
COMMENT ON COLUMN public.integrations.last_error_at IS 'Last failed connection test recorded by the control layer.';
COMMENT ON COLUMN public.integrations.last_error IS 'Sanitized latest integration error; never stores credentials.';
