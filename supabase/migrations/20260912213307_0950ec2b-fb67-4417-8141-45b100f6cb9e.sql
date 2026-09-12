DROP TRIGGER IF EXISTS trg_sync_product_stock_flag ON public.product_inventory;

CREATE OR REPLACE FUNCTION public.sync_product_stock_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ignore no-op updates and the initial seeding of a 0 g row
  IF OLD.stock_grams IS NOT DISTINCT FROM NEW.stock_grams THEN
    RETURN NEW;
  END IF;

  UPDATE public.products
  SET is_out_of_stock = (NEW.stock_grams <= 0)
  WHERE id = NEW.product_id
    AND is_out_of_stock IS DISTINCT FROM (NEW.stock_grams <= 0);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_product_stock_flag() FROM anon, authenticated;

CREATE TRIGGER trg_sync_product_stock_flag
AFTER UPDATE OF stock_grams ON public.product_inventory
FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock_flag();

UPDATE public.products SET is_out_of_stock = false WHERE is_out_of_stock = true;