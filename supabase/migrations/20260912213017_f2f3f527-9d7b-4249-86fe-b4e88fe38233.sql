-- 1. Inventory table
CREATE TABLE public.product_inventory (
  product_id text PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  stock_grams numeric NOT NULL DEFAULT 0,
  low_stock_threshold_g numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_inventory TO authenticated;
GRANT ALL ON public.product_inventory TO service_role;

ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage inventory"
ON public.product_inventory FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_product_inventory_updated
BEFORE UPDATE ON public.product_inventory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Movements table
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  delta_grams numeric NOT NULL,
  reason text NOT NULL CHECK (reason IN ('sale','restock','manual','cancel')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX inventory_movements_order_unique
ON public.inventory_movements (order_id, product_id, reason)
WHERE order_id IS NOT NULL;

CREATE INDEX inventory_movements_product_idx ON public.inventory_movements (product_id, created_at DESC);

GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read movements"
ON public.inventory_movements FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins insert movements"
ON public.inventory_movements FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- 3. Sync products.is_out_of_stock from inventory
CREATE OR REPLACE FUNCTION public.sync_product_stock_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.products
  SET is_out_of_stock = (NEW.stock_grams <= 0)
  WHERE id = NEW.product_id
    AND is_out_of_stock IS DISTINCT FROM (NEW.stock_grams <= 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_product_stock_flag
AFTER INSERT OR UPDATE OF stock_grams ON public.product_inventory
FOR EACH ROW EXECUTE FUNCTION public.sync_product_stock_flag();

-- 4. Apply order stock movements
CREATE OR REPLACE FUNCTION public.apply_order_stock(p_order_id uuid, p_direction integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_reason text := CASE WHEN p_direction < 0 THEN 'sale' ELSE 'cancel' END;
BEGIN
  FOR r IN
    SELECT oi.product_id,
           sum(coalesce(oi.weight, 0) * coalesce(oi.quantity, 1)) AS grams
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
      AND oi.weight IS NOT NULL
    GROUP BY oi.product_id
    HAVING sum(coalesce(oi.weight, 0) * coalesce(oi.quantity, 1)) > 0
  LOOP
    BEGIN
      INSERT INTO public.inventory_movements (product_id, order_id, delta_grams, reason)
      VALUES (r.product_id, p_order_id, r.grams * sign(p_direction), v_reason);
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;

    INSERT INTO public.product_inventory (product_id, stock_grams)
    VALUES (r.product_id, greatest(0, r.grams * sign(p_direction)))
    ON CONFLICT (product_id) DO UPDATE
      SET stock_grams = greatest(0, public.product_inventory.stock_grams + r.grams * sign(p_direction));
  END LOOP;
END;
$$;

-- 5. Triggers on orders
CREATE OR REPLACE FUNCTION public.trg_order_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.payment_status = 'paid' THEN
      PERFORM public.apply_order_stock(NEW.id, -1);
    END IF;
    RETURN NEW;
  END IF;

  -- becomes paid
  IF NEW.payment_status = 'paid' AND coalesce(OLD.payment_status, '') <> 'paid' THEN
    PERFORM public.apply_order_stock(NEW.id, -1);
  END IF;

  -- paid order cancelled or refunded => restore
  IF OLD.payment_status = 'paid'
     AND (NEW.payment_status IN ('refunded', 'cancelled')
          OR (NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled')) THEN
    PERFORM public.apply_order_stock(NEW.id, 1);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_stock_insert
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_stock();

CREATE TRIGGER trg_orders_stock_update
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_stock();

-- 6. Seed inventory rows for existing products
INSERT INTO public.product_inventory (product_id, stock_grams)
SELECT id, 0 FROM public.products
ON CONFLICT (product_id) DO NOTHING;