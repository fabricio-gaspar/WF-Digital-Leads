-- Armazena, exclusivamente no servidor, chaves cifradas de conectores por usuário.
-- O cliente autenticado não recebe permissão direta nesta tabela.
CREATE TABLE IF NOT EXISTS public.app_user_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connector_id text NOT NULL,
  connection_key_ciphertext text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_user_connections_user_connector_key UNIQUE (user_id, connector_id)
);

ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_user_connections FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_user_connections TO service_role;

DROP TRIGGER IF EXISTS app_user_connections_set_updated_at ON public.app_user_connections;
CREATE TRIGGER app_user_connections_set_updated_at
  BEFORE UPDATE ON public.app_user_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
