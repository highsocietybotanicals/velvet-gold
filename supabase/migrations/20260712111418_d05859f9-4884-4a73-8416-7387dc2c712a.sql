
CREATE OR REPLACE FUNCTION public.validate_product_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.price <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than 0';
  END IF;

  IF length(NEW.name) > 200 THEN
    RAISE EXCEPTION 'Product name is too long (max 200 characters)';
  END IF;

  RETURN NEW;
END;
$function$;
