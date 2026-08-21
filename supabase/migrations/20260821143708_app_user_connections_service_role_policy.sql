-- A tabela é acessível apenas por rotinas server-side com service_role.
-- A política explícita mantém o contrato de RLS auditável sem liberar clientes.
DROP POLICY IF EXISTS app_user_connections_service_role_only ON public.app_user_connections;
CREATE POLICY app_user_connections_service_role_only
  ON public.app_user_connections
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
