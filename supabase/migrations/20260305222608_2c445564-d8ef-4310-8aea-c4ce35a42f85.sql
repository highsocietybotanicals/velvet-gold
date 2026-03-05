
-- Make user_id nullable for guest orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Add guest columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_phone TEXT;
