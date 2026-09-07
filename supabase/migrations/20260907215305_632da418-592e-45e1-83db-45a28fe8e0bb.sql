-- 1. Numéro interne fixe par produit
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode_seq integer;

CREATE SEQUENCE IF NOT EXISTS public.products_barcode_seq_seq START 1;
ALTER TABLE public.products ALTER COLUMN barcode_seq SET DEFAULT nextval('public.products_barcode_seq_seq');

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.products WHERE barcode_seq IS NULL ORDER BY display_order, id LOOP
    UPDATE public.products SET barcode_seq = nextval('public.products_barcode_seq_seq') WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS products_barcode_seq_key ON public.products(barcode_seq);
GRANT USAGE, SELECT ON SEQUENCE public.products_barcode_seq_seq TO authenticated, service_role;

-- 2. Codes-barres par produit + poids
CREATE TABLE public.product_barcodes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  weight_grams numeric NOT NULL,
  ean13 text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, weight_grams)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_barcodes TO authenticated;
GRANT SELECT ON public.product_barcodes TO anon;
GRANT ALL ON public.product_barcodes TO service_role;

ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read barcodes" ON public.product_barcodes
  FOR SELECT USING (true);
CREATE POLICY "Staff can create barcodes" ON public.product_barcodes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR public.is_commercial());
CREATE POLICY "Admins can update barcodes" ON public.product_barcodes
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete barcodes" ON public.product_barcodes
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE TRIGGER trg_product_barcodes_updated
  BEFORE UPDATE ON public.product_barcodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Paliers de commission
CREATE TABLE public.sales_commission_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_revenue_ht numeric NOT NULL,
  commission_percent numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (min_revenue_ht)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_commission_tiers TO authenticated;
GRANT ALL ON public.sales_commission_tiers TO service_role;

ALTER TABLE public.sales_commission_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can read tiers" ON public.sales_commission_tiers
  FOR SELECT TO authenticated USING (public.is_admin() OR public.is_commercial());
CREATE POLICY "Admins manage tiers" ON public.sales_commission_tiers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_sales_commission_tiers_updated
  BEFORE UPDATE ON public.sales_commission_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sales_commission_tiers (min_revenue_ht, commission_percent)
VALUES (0, 10), (5000, 12), (10000, 15);

-- 4. Versements des bonus de palier
CREATE TABLE public.sales_bonus_payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  period_month date NOT NULL,
  revenue_ht numeric NOT NULL DEFAULT 0,
  tier_percent numeric NOT NULL DEFAULT 10,
  bonus_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rep_id, period_month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_bonus_payouts TO authenticated;
GRANT ALL ON public.sales_bonus_payouts TO service_role;

ALTER TABLE public.sales_bonus_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reps read their bonuses" ON public.sales_bonus_payouts
  FOR SELECT TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.sales_reps sr WHERE sr.id = rep_id AND sr.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins manage bonuses" ON public.sales_bonus_payouts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_sales_bonus_payouts_updated
  BEFORE UPDATE ON public.sales_bonus_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();