
-- product_costs
CREATE TABLE public.product_costs (
  product_id text PRIMARY KEY,
  cost_per_gram numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_costs TO authenticated;
GRANT ALL ON public.product_costs TO service_role;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_costs" ON public.product_costs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role product_costs" ON public.product_costs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- consumable_costs
CREATE TABLE public.consumable_costs (
  key text PRIMARY KEY,
  label text NOT NULL,
  unit_cost numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'unit',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consumable_costs TO authenticated;
GRANT ALL ON public.consumable_costs TO service_role;
ALTER TABLE public.consumable_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage consumable_costs" ON public.consumable_costs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role consumable_costs" ON public.consumable_costs FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.consumable_costs (key, label, unit_cost, unit) VALUES
  ('pochon_alu', 'Pochon aluminium HSB', 0.35, 'unité'),
  ('boveda_62', 'Boveda 62% (sachet)', 0.45, 'unité'),
  ('etiquette', 'Étiquette produit', 0.05, 'unité'),
  ('sachet_expedition', 'Sachet expédition', 0.20, 'unité'),
  ('briquet_bic', 'Briquet BIC (cadeau)', 0.40, 'unité'),
  ('feuilles_slim', 'Feuilles slim + carton (cadeau)', 0.30, 'kit')
ON CONFLICT (key) DO NOTHING;

-- fixed_costs_settings
CREATE TABLE public.fixed_costs_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  colissimo_domicile numeric NOT NULL DEFAULT 7.90,
  colissimo_relais numeric NOT NULL DEFAULT 5.90,
  essence_per_km numeric NOT NULL DEFAULT 0.20,
  viva_commission_pct numeric NOT NULL DEFAULT 1.5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixed_costs_settings TO authenticated;
GRANT ALL ON public.fixed_costs_settings TO service_role;
ALTER TABLE public.fixed_costs_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fixed_costs_settings" ON public.fixed_costs_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role fixed_costs_settings" ON public.fixed_costs_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
INSERT INTO public.fixed_costs_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- pro_price_tiers
CREATE TABLE public.pro_price_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gamme text NOT NULL,
  tier_max_g int NOT NULL,
  price_per_gram numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gamme, tier_max_g)
);
GRANT SELECT ON public.pro_price_tiers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pro_price_tiers TO authenticated;
GRANT ALL ON public.pro_price_tiers TO service_role;
ALTER TABLE public.pro_price_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read pro_price_tiers" ON public.pro_price_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write pro_price_tiers" ON public.pro_price_tiers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Service role pro_price_tiers" ON public.pro_price_tiers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed tiers. tier_max_g = 200 means "up to 200g", 600 = "up to 600g", 1000 = "up to 1kg", 999999 = "beyond 1kg"
INSERT INTO public.pro_price_tiers (gamme, tier_max_g, price_per_gram) VALUES
  ('classiques', 200, 4.00), ('classiques', 600, 3.60), ('classiques', 1000, 3.20), ('classiques', 999999, 2.80),
  ('911_og',     200, 4.50), ('911_og',     600, 4.05), ('911_og',     1000, 3.60), ('911_og',     999999, 3.15),
  ('poussiere',  200, 3.75), ('poussiere',  600, 3.40), ('poussiere',  1000, 3.00), ('poussiere',  999999, 2.65),
  ('nectar_top', 200, 5.00), ('nectar_top', 600, 4.50), ('nectar_top', 1000, 4.00), ('nectar_top', 999999, 3.50)
ON CONFLICT (gamme, tier_max_g) DO NOTHING;
