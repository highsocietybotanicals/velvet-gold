REVOKE EXECUTE ON FUNCTION public.apply_order_stock(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_order_stock() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_stock_flag() FROM anon, authenticated;