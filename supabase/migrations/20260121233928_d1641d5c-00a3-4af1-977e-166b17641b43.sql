-- Add server-side input validation constraints to profiles table

-- SIRET must be exactly 14 digits (French business identifier)
ALTER TABLE public.profiles 
ADD CONSTRAINT siret_format 
CHECK (siret IS NULL OR siret ~ '^[0-9]{14}$');

-- VAT number format: 2 letter country code + 2-12 alphanumeric characters
ALTER TABLE public.profiles 
ADD CONSTRAINT vat_format 
CHECK (vat_number IS NULL OR vat_number ~ '^[A-Z]{2}[A-Z0-9]{2,12}$');

-- French postal code: exactly 5 digits
ALTER TABLE public.profiles 
ADD CONSTRAINT postal_code_format 
CHECK (postal_code IS NULL OR postal_code ~ '^[0-9]{5}$');

-- Phone number: basic format validation (starts with + or 0, 8-15 digits)
ALTER TABLE public.profiles 
ADD CONSTRAINT phone_format 
CHECK (phone IS NULL OR phone ~ '^(\+|0)[0-9]{8,14}$');

-- Email basic format validation
ALTER TABLE public.profiles 
ADD CONSTRAINT email_format 
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');