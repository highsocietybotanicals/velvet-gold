ALTER TABLE public.orders
ADD COLUMN promo_code text DEFAULT NULL,
ADD COLUMN promo_discount_percent numeric DEFAULT NULL,
ADD COLUMN promo_discount_amount numeric DEFAULT NULL;