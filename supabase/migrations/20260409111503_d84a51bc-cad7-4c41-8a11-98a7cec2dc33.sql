
-- Step 1: Drop ALL policies that depend on is_admin(uuid) and is_pro(uuid)
-- orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
-- order_items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
DROP POLICY IF EXISTS "Only admins can delete order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can insert order items" ON public.order_items;
-- order_status_history
DROP POLICY IF EXISTS "Admins can view all order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Admins can insert status history" ON public.order_status_history;
-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
-- contacts
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;
-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
-- promo_codes
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Authenticated can read active promo codes" ON public.promo_codes;
-- promo_code_usage
DROP POLICY IF EXISTS "Admins can view all promo usage" ON public.promo_code_usage;
-- product_reviews
DROP POLICY IF EXISTS "Admins can read all reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.product_reviews;
-- products
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
-- social_posts
DROP POLICY IF EXISTS "Admins can manage social posts" ON public.social_posts;
-- pro_prices
DROP POLICY IF EXISTS "Validated pros and admins can read pro_prices" ON public.pro_prices;
-- storage policies
DROP POLICY IF EXISTS "Admins can upload social media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete social media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all invoices" ON storage.objects;

-- Step 2: Drop old functions with uuid parameter
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_pro(uuid);

-- Step 3: Create parameterless versions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_pro()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'pro'
  )
$$;

-- Step 4: Recreate all policies using parameterless is_admin() / is_pro()
-- orders
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update all orders" ON public.orders FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Only admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (is_admin());
-- order_items
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Only admins can delete order items" ON public.order_items FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (is_admin());
-- order_status_history
CREATE POLICY "Admins can view all order status history" ON public.order_status_history FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert status history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (is_admin());
-- profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin());
-- contacts
CREATE POLICY "Admins can view all contacts" ON public.contacts FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (is_admin());
-- user_roles
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (is_admin());
-- promo_codes (admin-only now, no public read)
CREATE POLICY "Admins can manage promo codes" ON public.promo_codes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
-- promo_code_usage
CREATE POLICY "Admins can view all promo usage" ON public.promo_code_usage FOR SELECT TO authenticated USING (is_admin());
-- product_reviews
CREATE POLICY "Admins can read all reviews" ON public.product_reviews FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admins can update reviews" ON public.product_reviews FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins can delete reviews" ON public.product_reviews FOR DELETE TO authenticated USING (is_admin());
-- products
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (is_admin());
-- social_posts
CREATE POLICY "Admins can manage social posts" ON public.social_posts FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
-- pro_prices
CREATE POLICY "Validated pros and admins can read pro_prices" ON public.pro_prices FOR SELECT USING (
  is_admin() OR (is_pro() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_pro_validated = true))
);
-- storage
CREATE POLICY "Admins can upload social media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'social-media' AND is_admin());
CREATE POLICY "Admins can delete social media" ON storage.objects FOR DELETE USING (bucket_id = 'social-media' AND is_admin());
CREATE POLICY "Admins can read all invoices" ON storage.objects FOR SELECT USING (bucket_id = 'invoices' AND is_admin());

-- Step 5: Update prevent_profile_privilege_escalation
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    NEW.is_pro_validated := OLD.is_pro_validated;
    NEW.is_vat_validated := OLD.is_vat_validated;
    NEW.free_grams_available := OLD.free_grams_available;
    NEW.qualifying_orders_count := OLD.qualifying_orders_count;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 6: Create validate_promo_code RPC
CREATE OR REPLACE FUNCTION public.validate_promo_code(p_code text, p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo record;
  v_usage_exists boolean;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 OR length(p_code) > 50 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code promo invalide');
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = upper(trim(p_code)) AND is_active = true;

  IF v_promo IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Code promo invalide');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Ce code promo a expiré');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Ce code promo a atteint son nombre maximum d''utilisations');
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.promo_code_usage
      WHERE user_id = p_user_id AND code = upper(trim(p_code))
    ) INTO v_usage_exists;

    IF v_usage_exists THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Tu as déjà utilisé ce code');
    END IF;
  END IF;

  RETURN jsonb_build_object('valid', true, 'discount_percent', v_promo.discount_percent, 'code', v_promo.code);
END;
$$;
