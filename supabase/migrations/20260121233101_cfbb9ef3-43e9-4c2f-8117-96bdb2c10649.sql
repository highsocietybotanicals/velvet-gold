-- Fix pro_prices RLS policy: Restrict to validated pros and admins only
DROP POLICY IF EXISTS "Authenticated users can read pro_prices" ON public.pro_prices;

CREATE POLICY "Validated pros and admins can read pro_prices" 
ON public.pro_prices
FOR SELECT 
USING (
  public.is_admin(auth.uid()) OR
  (public.is_pro(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_pro_validated = true
  ))
);