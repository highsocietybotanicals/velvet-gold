ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS viva_order_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';