
-- Fix update_loyalty_counter: is_pro() no longer accepts arguments
CREATE OR REPLACE FUNCTION public.update_loyalty_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count integer;
  user_is_pro boolean;
BEGIN
  -- Skip for guest/manual orders without user
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check pro status directly from user_roles table
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'pro'
  ) INTO user_is_pro;

  -- Only for non-Pro customers with order >= 10g
  IF NEW.total_flower_weight >= 10 AND NOT user_is_pro THEN
    UPDATE profiles
    SET qualifying_orders_count = COALESCE(qualifying_orders_count, 0) + 1
    WHERE id = NEW.user_id
    RETURNING qualifying_orders_count INTO current_count;

    IF current_count >= 10 THEN
      UPDATE profiles
      SET
        qualifying_orders_count = 0,
        free_grams_available = COALESCE(free_grams_available, 0) + 10
      WHERE id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
