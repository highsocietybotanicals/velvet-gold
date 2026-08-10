CREATE OR REPLACE FUNCTION public.cleanup_abandoned_orders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count integer := 0;
  cutoff timestamp with time zone := now() - interval '48 hours';
BEGIN
  CREATE TEMP TABLE _abandoned ON COMMIT DROP AS
  SELECT id FROM public.orders
  WHERE payment_status = 'unpaid'
    AND created_at < cutoff
    AND coalesce(order_channel, 'b2c') <> 'pro'
    AND coalesce(payment_method, 'online') = 'online';

  DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM _abandoned);
  DELETE FROM public.order_status_history WHERE order_id IN (SELECT id FROM _abandoned);
  DELETE FROM public.delivery_mileage WHERE order_id IN (SELECT id FROM _abandoned);
  DELETE FROM public.promo_code_usage WHERE order_id IN (SELECT id FROM _abandoned);

  DELETE FROM public.orders WHERE id IN (SELECT id FROM _abandoned);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;