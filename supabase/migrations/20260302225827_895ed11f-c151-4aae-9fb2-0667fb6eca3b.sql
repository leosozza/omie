
-- Criar tabela purchase_config para configurações avançadas de compras por tenant
CREATE TABLE public.purchase_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  config_type text NOT NULL, -- "conta_corrente", "categoria", "centro_custo", "rateio"
  omie_code text NOT NULL,
  omie_name text NOT NULL,
  bitrix_field text,
  percentual numeric,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- FK para bitrix_installations
ALTER TABLE public.purchase_config
  ADD CONSTRAINT purchase_config_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.bitrix_installations(member_id);

-- Enable RLS
ALTER TABLE public.purchase_config ENABLE ROW LEVEL SECURITY;

-- Tenant users can read own config
CREATE POLICY "Tenant users can read own purchase config"
  ON public.purchase_config
  FOR SELECT
  USING (tenant_id IN (
    SELECT user_roles.tenant_id FROM user_roles WHERE user_roles.user_id = auth.uid()
  ));

-- Index for fast lookups
CREATE INDEX idx_purchase_config_tenant ON public.purchase_config(tenant_id, config_type);
