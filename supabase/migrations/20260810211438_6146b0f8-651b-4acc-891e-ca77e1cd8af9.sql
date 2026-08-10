CREATE OR REPLACE FUNCTION public.trigger_compute_mileage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  svc text;
BEGIN
  IF NEW.delivery_type <> 'personal' OR NEW.payment_status <> 'paid' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.payment_status = 'paid' THEN
    RETURN NEW;
  END IF;
  IF NEW.delivery_address IS NULL THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.delivery_mileage dm WHERE dm.order_id = NEW.id AND dm.status = 'computed') THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO svc FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key';
  IF svc IS NULL THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://pvwwxpcosiqetsflykmp.supabase.co/functions/v1/compute-mileage',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || svc),
      body := jsonb_build_object('orderId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'trigger_compute_mileage failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_compute_mileage_on_paid ON public.orders;
CREATE TRIGGER trg_compute_mileage_on_paid
AFTER INSERT OR UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trigger_compute_mileage();