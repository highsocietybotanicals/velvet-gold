-- Helper: is the current user a validated commercial (sales rep)?
CREATE OR REPLACE FUNCTION public.is_commercial()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'commercial'::public.app_role
  );
$$;

-- Sales reps
CREATE TABLE public.sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  zone text,
  commission_percent numeric NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_reps TO authenticated;
GRANT ALL ON public.sales_reps TO service_role;
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps read own profile" ON public.sales_reps
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins manage reps insert" ON public.sales_reps
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage reps update" ON public.sales_reps
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage reps delete" ON public.sales_reps
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER update_sales_reps_updated_at
  BEFORE UPDATE ON public.sales_reps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prospects (CRM)
CREATE TABLE public.sales_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  city text,
  postal_code text,
  address text,
  contact_name text,
  phone text,
  email text,
  status text NOT NULL DEFAULT 'a_visiter',
  next_followup date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_prospects_rep ON public.sales_prospects(rep_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_prospects TO authenticated;
GRANT ALL ON public.sales_prospects TO service_role;
ALTER TABLE public.sales_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps read own prospects" ON public.sales_prospects
  FOR SELECT TO authenticated
  USING (public.is_admin() OR rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid()));
CREATE POLICY "Reps create own prospects" ON public.sales_prospects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid()));
CREATE POLICY "Reps update own prospects" ON public.sales_prospects
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid()))
  WITH CHECK (public.is_admin() OR rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid()));
CREATE POLICY "Reps delete own prospects" ON public.sales_prospects
  FOR DELETE TO authenticated
  USING (public.is_admin() OR rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid()));

CREATE TRIGGER update_sales_prospects_updated_at
  BEFORE UPDATE ON public.sales_prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commissions
CREATE TABLE public.sales_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  client_label text NOT NULL,
  period_month date NOT NULL DEFAULT date_trunc('month', now())::date,
  revenue_ht numeric NOT NULL DEFAULT 0,
  commission_percent numeric NOT NULL DEFAULT 10,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'a_payer',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_commissions_rep ON public.sales_commissions(rep_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_commissions TO authenticated;
GRANT ALL ON public.sales_commissions TO service_role;
ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps read own commissions" ON public.sales_commissions
  FOR SELECT TO authenticated
  USING (public.is_admin() OR rep_id IN (SELECT id FROM public.sales_reps WHERE user_id = auth.uid()));
CREATE POLICY "Admins insert commissions" ON public.sales_commissions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins update commissions" ON public.sales_commissions
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete commissions" ON public.sales_commissions
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER update_sales_commissions_updated_at
  BEFORE UPDATE ON public.sales_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();