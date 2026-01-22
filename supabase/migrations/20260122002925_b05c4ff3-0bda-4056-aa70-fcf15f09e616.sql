-- Add explicit DELETE policy for orders table
-- Only admins can delete orders (prevents accidental or malicious deletion by users)

CREATE POLICY "Only admins can delete orders" 
ON public.orders 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Also add DELETE policy for order_items (cascade protection)
CREATE POLICY "Only admins can delete order items" 
ON public.order_items 
FOR DELETE 
USING (is_admin(auth.uid()));