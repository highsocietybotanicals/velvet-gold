
CREATE TABLE public.pro_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  siret TEXT,
  vat_number TEXT,
  address_line1 TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'France',
  email TEXT,
  phone TEXT,
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 30 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_partners TO authenticated;
GRANT ALL ON public.pro_partners TO service_role;
ALTER TABLE public.pro_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partners" ON public.pro_partners FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_pro_partners_updated BEFORE UPDATE ON public.pro_partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pro_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.pro_partners(id) ON DELETE RESTRICT,
  invoice_number TEXT UNIQUE,
  issued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','cancelled')),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 30,
  total_retail_ttc NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_invoiced_ht NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_invoiced_ttc NUMERIC(10,2) NOT NULL DEFAULT 0,
  pdf_path TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_invoices TO authenticated;
GRANT ALL ON public.pro_invoices TO service_role;
ALTER TABLE public.pro_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pro invoices" ON public.pro_invoices FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_pro_invoices_updated BEFORE UPDATE ON public.pro_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_pro_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  new_number TEXT;
  exists_already BOOLEAN;
BEGIN
  IF NEW.invoice_number IS NOT NULL THEN RETURN NEW; END IF;
  LOOP
    new_number := 'FA-PRO-' || lpad(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.pro_invoices WHERE invoice_number = new_number) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  NEW.invoice_number := new_number;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_pro_invoices_number BEFORE INSERT ON public.pro_invoices FOR EACH ROW EXECUTE FUNCTION public.generate_pro_invoice_number();

CREATE TABLE public.pro_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES public.pro_partners(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  weight_grams NUMERIC(10,2),
  quantity INTEGER NOT NULL DEFAULT 1,
  retail_price_ttc NUMERIC(10,2) NOT NULL CHECK (retail_price_ttc >= 0),
  sold_at DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_id UUID REFERENCES public.pro_invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_deposits TO authenticated;
GRANT ALL ON public.pro_deposits TO service_role;
ALTER TABLE public.pro_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage deposits" ON public.pro_deposits FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE TRIGGER trg_pro_deposits_updated BEFORE UPDATE ON public.pro_deposits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pro_deposits_partner ON public.pro_deposits(partner_id);
CREATE INDEX idx_pro_deposits_invoice ON public.pro_deposits(invoice_id);
CREATE INDEX idx_pro_invoices_partner ON public.pro_invoices(partner_id);
