-- Add is_vat_validated column to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_vat_validated boolean NOT NULL DEFAULT false;