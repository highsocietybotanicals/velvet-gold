
-- Table to track promo code usage (one per user)
CREATE TABLE public.promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_percent numeric NOT NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);

ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own promo usage"
ON public.promo_code_usage FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can insert
CREATE POLICY "Service role can manage promo usage"
ON public.promo_code_usage FOR ALL
TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);
