
CREATE TABLE public.mileage_settings (
  id integer PRIMARY KEY DEFAULT 1,
  rate_per_km numeric NOT NULL DEFAULT 0.636,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE ON public.mileage_settings TO authenticated;
GRANT ALL ON public.mileage_settings TO service_role;
ALTER TABLE public.mileage_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage mileage settings" ON public.mileage_settings FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
INSERT INTO public.mileage_settings (id, rate_per_km) VALUES (1, 0.636) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.delivery_mileage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  departure_address text NOT NULL,
  arrival_address text NOT NULL,
  distance_km_one_way numeric,
  distance_km_round_trip numeric,
  duration_min numeric,
  rate_per_km numeric NOT NULL DEFAULT 0,
  cost_euros numeric,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  computed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_mileage TO authenticated;
GRANT ALL ON public.delivery_mileage TO service_role;
ALTER TABLE public.delivery_mileage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage mileage" ON public.delivery_mileage FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_delivery_mileage_updated_at
BEFORE UPDATE ON public.delivery_mileage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_mileage_settings_updated_at
BEFORE UPDATE ON public.mileage_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
