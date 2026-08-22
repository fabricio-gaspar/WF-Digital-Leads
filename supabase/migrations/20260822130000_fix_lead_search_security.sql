-- LeadAI / Busca de Leads
-- Corrige isolamento multiempresa do cache de prospecção e torna current_org_id resiliente.

ALTER TABLE public.prospecting_cache
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Recupera organização dos registros antigos a partir do vínculo do usuário.
UPDATE public.prospecting_cache pc
SET organization_id = (
  SELECT ur.organization_id
  FROM public.user_roles ur
  WHERE ur.user_id = pc.user_id
  ORDER BY ur.organization_id
  LIMIT 1
)
WHERE pc.organization_id IS NULL
  AND pc.user_id IS NOT NULL;

ALTER TABLE public.prospecting_cache ENABLE ROW LEVEL SECURITY;

-- Esta policy antiga permitia leitura irrestrita a qualquer usuário autenticado.
DROP POLICY IF EXISTS "prospecting_cache_read" ON public.prospecting_cache;
DROP POLICY IF EXISTS "prospecting_cache_isolation" ON public.prospecting_cache;

CREATE POLICY "prospecting_cache_isolation"
ON public.prospecting_cache
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT ur.organization_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT ur.organization_id
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
  )
);

-- Fallback seguro para código legado que usa current_org_id() em defaults/policies.
-- O GUC pode não sobreviver a conexões PostgREST com pooling; quando ausente,
-- a função resolve a organização diretamente pelo usuário autenticado.
CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_org_id', true), '')::uuid,
    (
      SELECT ur.organization_id
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      ORDER BY ur.organization_id
      LIMIT 1
    )
  );
$$;

CREATE INDEX IF NOT EXISTS idx_prospecting_cache_org_user_created
  ON public.prospecting_cache (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prospecting_cache_org_hash_expiry
  ON public.prospecting_cache (organization_id, filters_hash, expires_at);

COMMENT ON COLUMN public.prospecting_cache.organization_id IS
  'Organização proprietária do resultado de prospecção; obrigatório para isolamento multiempresa.';
