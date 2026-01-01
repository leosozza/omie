-- =====================================================
-- CONECTOR ENTERPRISE BITRIX24 ↔ OMIE ERP
-- Multi-Tenant Database Schema
-- =====================================================

-- 1. Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'viewer');

-- 2. Enum para status de instalação
CREATE TYPE public.installation_status AS ENUM ('active', 'expired', 'revoked', 'pending');

-- 3. Enum para status de sincronização
CREATE TYPE public.sync_status AS ENUM ('pending', 'processing', 'success', 'error', 'retrying');

-- 4. Enum para direção de mapeamento
CREATE TYPE public.mapping_direction AS ENUM ('omie_to_bitrix', 'bitrix_to_omie', 'bidirectional');

-- 5. Enum para entidades Bitrix
CREATE TYPE public.bitrix_entity AS ENUM ('lead', 'deal', 'contact', 'company', 'spa');

-- =====================================================
-- TABELA: bitrix_installations (Core Multi-Tenant)
-- =====================================================
CREATE TABLE public.bitrix_installations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  member_id TEXT UNIQUE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  client_endpoint TEXT,
  application_token TEXT,
  status public.installation_status NOT NULL DEFAULT 'active',
  fields_provisioned BOOLEAN DEFAULT false,
  robots_registered BOOLEAN DEFAULT false,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABELA: omie_configurations (Credenciais por Tenant)
-- =====================================================
CREATE TABLE public.omie_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  app_key TEXT NOT NULL,
  app_secret TEXT NOT NULL,
  environment TEXT DEFAULT 'production',
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id)
);

-- =====================================================
-- TABELA: field_mappings (Motor de Mapeamento Dinâmico)
-- =====================================================
CREATE TABLE public.field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  bitrix_entity public.bitrix_entity NOT NULL,
  spa_type_id INTEGER,
  omie_entity TEXT NOT NULL,
  omie_field_code TEXT NOT NULL,
  omie_field_name TEXT,
  omie_field_type TEXT,
  bitrix_field_code TEXT NOT NULL,
  bitrix_field_name TEXT,
  bitrix_field_type TEXT,
  direction public.mapping_direction DEFAULT 'bidirectional',
  is_custom_field BOOLEAN DEFAULT false,
  is_required BOOLEAN DEFAULT false,
  transform_rule JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABELA: sync_queue (Fila de Processamento Resiliente)
-- =====================================================
CREATE TABLE public.sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  status public.sync_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABELA: integration_logs (Auditoria Completa)
-- =====================================================
CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  status TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- TABELA: user_roles (Controle de Acesso)
-- =====================================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- =====================================================
-- TABELA: omie_cached_fields (Cache de Campos Omie)
-- =====================================================
CREATE TABLE public.omie_cached_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  field_code TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT,
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, entity_type, field_code)
);

-- =====================================================
-- TABELA: bitrix_cached_fields (Cache de Campos Bitrix)
-- =====================================================
CREATE TABLE public.bitrix_cached_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  entity_type public.bitrix_entity NOT NULL,
  spa_type_id INTEGER,
  field_code TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT,
  is_required BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  options JSONB,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, entity_type, field_code)
);

-- =====================================================
-- TABELA: robots_registry (Registro de Robots)
-- =====================================================
CREATE TABLE public.robots_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES public.bitrix_installations(member_id) ON DELETE CASCADE,
  robot_code TEXT NOT NULL,
  robot_name TEXT NOT NULL,
  entity_type public.bitrix_entity NOT NULL,
  is_registered BOOLEAN DEFAULT false,
  last_error TEXT,
  registered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, robot_code)
);

-- =====================================================
-- INDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX idx_installations_member_id ON public.bitrix_installations(member_id);
CREATE INDEX idx_installations_status ON public.bitrix_installations(status);
CREATE INDEX idx_omie_configs_tenant ON public.omie_configurations(tenant_id);
CREATE INDEX idx_field_mappings_tenant ON public.field_mappings(tenant_id);
CREATE INDEX idx_field_mappings_entity ON public.field_mappings(bitrix_entity);
CREATE INDEX idx_sync_queue_tenant ON public.sync_queue(tenant_id);
CREATE INDEX idx_sync_queue_status ON public.sync_queue(status);
CREATE INDEX idx_sync_queue_next_retry ON public.sync_queue(next_retry_at) WHERE status = 'retrying';
CREATE INDEX idx_logs_tenant ON public.integration_logs(tenant_id);
CREATE INDEX idx_logs_created ON public.integration_logs(created_at DESC);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.bitrix_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omie_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omie_cached_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_cached_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.robots_registry ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÃO: has_role (Security Definer para evitar recursão)
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id TEXT, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  )
$$;

-- =====================================================
-- FUNÇÃO: get_user_tenant (Obter tenant do usuário)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- =====================================================
-- FUNÇÃO: update_updated_at (Trigger de timestamp)
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================================================
-- TRIGGERS DE UPDATED_AT
-- =====================================================
CREATE TRIGGER update_bitrix_installations_updated_at
  BEFORE UPDATE ON public.bitrix_installations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_omie_configurations_updated_at
  BEFORE UPDATE ON public.omie_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_field_mappings_updated_at
  BEFORE UPDATE ON public.field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS POLICIES: bitrix_installations
-- =====================================================
-- Edge Functions podem acessar tudo (service role)
CREATE POLICY "Service role full access on installations"
  ON public.bitrix_installations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: omie_configurations
-- =====================================================
CREATE POLICY "Service role full access on omie_configs"
  ON public.omie_configurations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: field_mappings
-- =====================================================
CREATE POLICY "Service role full access on field_mappings"
  ON public.field_mappings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: sync_queue
-- =====================================================
CREATE POLICY "Service role full access on sync_queue"
  ON public.sync_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: integration_logs
-- =====================================================
CREATE POLICY "Service role full access on integration_logs"
  ON public.integration_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: user_roles
-- =====================================================
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_roles"
  ON public.user_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: omie_cached_fields
-- =====================================================
CREATE POLICY "Service role full access on omie_cached_fields"
  ON public.omie_cached_fields
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: bitrix_cached_fields
-- =====================================================
CREATE POLICY "Service role full access on bitrix_cached_fields"
  ON public.bitrix_cached_fields
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- RLS POLICIES: robots_registry
-- =====================================================
CREATE POLICY "Service role full access on robots_registry"
  ON public.robots_registry
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ENABLE REALTIME (para sync_queue e logs)
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.integration_logs;