
-- Fix 1: DEFINER_OR_RPC_BYPASS - Restrict role-check functions to only check the caller's own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_pro(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'pro'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Fix 2: INPUT_VALIDATION - Add server-side validation triggers

-- Validate profile fields
CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  -- Validate SIRET: must be exactly 14 digits if provided
  IF NEW.siret IS NOT NULL AND NEW.siret != '' THEN
    IF NEW.siret !~ '^\d{14}$' THEN
      RAISE EXCEPTION 'SIRET must be exactly 14 digits';
    END IF;
  END IF;

  -- Validate VAT number format if provided
  IF NEW.vat_number IS NOT NULL AND NEW.vat_number != '' THEN
    IF NEW.vat_number !~ '^[A-Z]{2}[A-Z0-9]{2,12}$' THEN
      RAISE EXCEPTION 'Invalid VAT number format (e.g. FR12345678901)';
    END IF;
  END IF;

  -- Validate postal code (French: 5 digits) if provided
  IF NEW.postal_code IS NOT NULL AND NEW.postal_code != '' THEN
    IF NEW.postal_code !~ '^\d{5}$' THEN
      RAISE EXCEPTION 'Postal code must be 5 digits';
    END IF;
  END IF;

  -- Validate phone format if provided (allow international formats)
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    IF length(NEW.phone) > 20 THEN
      RAISE EXCEPTION 'Phone number too long';
    END IF;
  END IF;

  -- Text field length limits
  IF NEW.full_name IS NOT NULL AND length(NEW.full_name) > 200 THEN
    RAISE EXCEPTION 'Name is too long (max 200 characters)';
  END IF;

  IF NEW.company_name IS NOT NULL AND length(NEW.company_name) > 200 THEN
    RAISE EXCEPTION 'Company name is too long (max 200 characters)';
  END IF;

  IF NEW.address_line1 IS NOT NULL AND length(NEW.address_line1) > 500 THEN
    RAISE EXCEPTION 'Address is too long (max 500 characters)';
  END IF;

  IF NEW.city IS NOT NULL AND length(NEW.city) > 200 THEN
    RAISE EXCEPTION 'City name is too long (max 200 characters)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_before_insert_update
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_fields();

-- Validate product prices
CREATE OR REPLACE FUNCTION public.validate_product_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than 0';
  END IF;

  IF NEW.pro_price IS NOT NULL AND NEW.pro_price <= 0 THEN
    RAISE EXCEPTION 'Pro price must be greater than 0';
  END IF;

  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Product name is too long (max 200 characters)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_product_before_insert_update
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_fields();
