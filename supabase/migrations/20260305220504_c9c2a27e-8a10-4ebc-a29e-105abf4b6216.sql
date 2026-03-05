CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    NEW.is_pro_validated := OLD.is_pro_validated;
    NEW.is_vat_validated := OLD.is_vat_validated;
    NEW.free_grams_available := OLD.free_grams_available;
    NEW.qualifying_orders_count := OLD.qualifying_orders_count;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();