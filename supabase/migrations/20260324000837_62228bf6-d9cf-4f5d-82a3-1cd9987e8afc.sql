ALTER TABLE public.orders
  ADD COLUMN relay_point_id text,
  ADD COLUMN relay_point_name text,
  ADD COLUMN relay_point_address text;