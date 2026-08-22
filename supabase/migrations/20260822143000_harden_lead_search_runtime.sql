-- Harden LeadAI Busca de Leads runtime for both test and live usage.
-- 1) Prevent tenantless prospecting cache rows.
-- 2) Allow members to create notifications for another active member in the same organization.
-- 3) Prevent duplicate imports created by concurrent requests for Lead Search origins.

-- Backfill any legacy cache rows that can be resolved from the creating user's membership.
UPDATE public.prospecting_cache pc
SET organization_id = (
  SELECT ur.organization_id
  FROM public.user_roles ur
  WHERE ur.user_id = pc.user_id
  ORDER BY ur.id
  LIMIT 1
)
WHERE pc.organization_id IS NULL
  AND pc.user_id IS NOT NULL;

-- Remove unresolved cache rows instead of leaving cross-tenant/tenantless data behind.
DELETE FROM public.prospecting_cache
WHERE organization_id IS NULL;

ALTER TABLE public.prospecting_cache
  ALTER COLUMN organization_id SET NOT NULL;

-- Existing notifications_owner_access only lets a user insert a notification for themselves.
-- Human lead assignment needs the current organization member to notify another active member.
DROP POLICY IF EXISTS notifications_org_member_insert ON public.notifications;
CREATE POLICY notifications_org_member_insert
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  private.is_active_org_member(organization_id, auth.uid())
  AND private.is_active_org_member(organization_id, user_id)
);

-- The Lead Search service already performs an application-level duplicate check.
-- This partial unique index closes the race condition without affecting legacy/manual origins.
CREATE UNIQUE INDEX IF NOT EXISTS leads_search_origin_unique_idx
ON public.leads (organization_id, origin)
WHERE origin LIKE 'test:%' OR origin LIKE 'live:%';

CREATE INDEX IF NOT EXISTS prospecting_cache_org_user_created_idx
ON public.prospecting_cache (organization_id, user_id, created_at DESC);
