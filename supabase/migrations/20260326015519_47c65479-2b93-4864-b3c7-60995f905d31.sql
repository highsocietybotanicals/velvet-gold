
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percent numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer DEFAULT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Authenticated can read active promo codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE OR REPLACE FUNCTION public.validate_promo_code_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.discount_percent <= 0 OR NEW.discount_percent > 100 THEN
    RAISE EXCEPTION 'Discount must be between 1 and 100';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_promo_code_before_insert_update
  BEFORE INSERT OR UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_promo_code_fields();
