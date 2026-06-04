ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS abandoned_email_2h_sent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS abandoned_email_24h_sent_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_orders_unpaid_created 
ON public.orders (created_at) 
WHERE payment_status = 'unpaid';