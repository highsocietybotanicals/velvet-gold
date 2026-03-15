-- Create order_status_history table
CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS: users can view their own order status history
CREATE POLICY "Users can view own order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.user_id = auth.uid()
  ));

-- RLS: admins can view all
CREATE POLICY "Admins can view all order status history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- RLS: service role can insert
CREATE POLICY "Service role can insert status history"
  ON public.order_status_history FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

-- RLS: admins can insert (for manual status changes via frontend)
CREATE POLICY "Admins can insert status history"
  ON public.order_status_history FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Trigger function to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to orders table
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;