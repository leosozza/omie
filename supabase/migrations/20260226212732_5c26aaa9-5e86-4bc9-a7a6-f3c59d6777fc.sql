-- Fix user_roles: remove overly permissive ALL policy, keep only the SELECT policy
DROP POLICY IF EXISTS "Service role full access on user_roles" ON public.user_roles;

-- user_roles only needs SELECT for authenticated users (to check their own roles)
-- INSERT/UPDATE/DELETE should only happen via service_role (edge functions)
-- The existing "Users can view own roles" policy already handles SELECT