-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.bitrix_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omie_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robots_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_cached_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omie_cached_fields ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners
ALTER TABLE public.bitrix_installations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.omie_configurations FORCE ROW LEVEL SECURITY;

-- Drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Service role full access on installations" ON public.bitrix_installations;
DROP POLICY IF EXISTS "Service role full access on integration_logs" ON public.integration_logs;
DROP POLICY IF EXISTS "Service role full access on omie_configs" ON public.omie_configurations;
DROP POLICY IF EXISTS "Service role full access on robots_registry" ON public.robots_registry;
DROP POLICY IF EXISTS "Service role full access on sync_queue" ON public.sync_queue;
DROP POLICY IF EXISTS "Service role full access on field_mappings" ON public.field_mappings;
DROP POLICY IF EXISTS "Service role full access on bitrix_cached_fields" ON public.bitrix_cached_fields;
DROP POLICY IF EXISTS "Service role full access on omie_cached_fields" ON public.omie_cached_fields;

-- Tenant-scoped read policies for authenticated users
CREATE POLICY "Tenant users can read own installation"
  ON public.bitrix_installations FOR SELECT
  TO authenticated
  USING (member_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own logs"
  ON public.integration_logs FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own robots"
  ON public.robots_registry FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own field mappings"
  ON public.field_mappings FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own omie config"
  ON public.omie_configurations FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own cached fields"
  ON public.bitrix_cached_fields FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own omie cached fields"
  ON public.omie_cached_fields FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can read own sync queue"
  ON public.sync_queue FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()));

-- Secure view that hides sensitive tokens
CREATE OR REPLACE VIEW public.bitrix_installations_safe
WITH (security_invoker = on) AS
  SELECT id, domain, member_id, status, fields_provisioned, robots_registered, installed_at, updated_at, expires_at
  FROM public.bitrix_installations;