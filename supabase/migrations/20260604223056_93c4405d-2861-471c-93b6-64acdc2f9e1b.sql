
-- Enable required extensions for cron-based automation
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cleanup function: hard-delete unpaid orders older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  cutoff timestamp with time zone := now() - interval '7 days';
BEGIN
  -- Best-effort cleanup of dependent rows (no FK cascade defined on all)
  DELETE FROM public.order_items
  WHERE order_id IN (
    SELECT id FROM public.orders
    WHERE payment_status = 'unpaid' AND created_at < cutoff
  );

  DELETE FROM public.order_status_history
  WHERE order_id IN (
    SELECT id FROM public.orders
    WHERE payment_status = 'unpaid' AND created_at < cutoff
  );

  DELETE FROM public.delivery_mileage
  WHERE order_id IN (
    SELECT id FROM public.orders
    WHERE payment_status = 'unpaid' AND created_at < cutoff
  );

  DELETE FROM public.orders
  WHERE payment_status = 'unpaid' AND created_at < cutoff;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_abandoned_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_abandoned_orders() TO service_role;
