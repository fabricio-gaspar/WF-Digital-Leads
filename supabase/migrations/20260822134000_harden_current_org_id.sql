-- Remove SECURITY DEFINER from current_org_id().
-- The function only needs to read the signed-in user's own user_roles rows,
-- which are already allowed by RLS. This removes unnecessary privilege elevation.

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
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
