-- 1. pro_quotes
CREATE TABLE public.pro_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text,
  contact_email text,
  status text NOT NULL DEFAULT 'pending',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_weight_g numeric NOT NULL DEFAULT 0,
  total_ht numeric NOT NULL DEFAULT 0,
  total_ttc numeric NOT NULL DEFAULT 0,
  notes text,
  admin_notes text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_quotes TO authenticated;
GRANT ALL ON public.pro_quotes TO service_role;

ALTER TABLE public.pro_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pros manage own quotes select" ON public.pro_quotes
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Pros create own quotes" ON public.pro_quotes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update quotes" ON public.pro_quotes
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete quotes" ON public.pro_quotes
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER update_pro_quotes_updated_at
  BEFORE UPDATE ON public.pro_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. pro_settings
CREATE TABLE public.pro_settings (
  id integer PRIMARY KEY DEFAULT 1,
  franco_port_seuil_ht numeric NOT NULL DEFAULT 300,
  delai_paiement_jours integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pro_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.pro_settings TO authenticated;
GRANT INSERT, UPDATE ON public.pro_settings TO authenticated;
GRANT ALL ON public.pro_settings TO service_role;

ALTER TABLE public.pro_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read pro settings" ON public.pro_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pro settings insert" ON public.pro_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins manage pro settings update" ON public.pro_settings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.pro_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. orders channel & payment method
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_channel text NOT NULL DEFAULT 'b2c',
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';