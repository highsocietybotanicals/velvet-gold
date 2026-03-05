-- Add display_order_number column
ALTER TABLE public.orders ADD COLUMN display_order_number text;

-- Create function to generate random HSB- order number
CREATE OR REPLACE FUNCTION public.generate_display_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  new_number text;
  exists_already boolean;
BEGIN
  LOOP
    -- Generate HSB- followed by 6 random digits
    new_number := 'HSB-' || lpad(floor(random() * 1000000)::text, 6, '0');
    
    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE display_order_number = new_number) INTO exists_already;
    
    EXIT WHEN NOT exists_already;
  END LOOP;
  
  NEW.display_order_number := new_number;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate on insert
CREATE TRIGGER set_display_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_display_order_number();

-- Backfill existing orders
UPDATE public.orders SET display_order_number = 'HSB-' || lpad(floor(random() * 1000000)::text, 6, '0')
WHERE display_order_number IS NULL;