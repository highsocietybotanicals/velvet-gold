-- Table des commandes
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_number serial NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric NOT NULL,
  total_flower_weight numeric NOT NULL DEFAULT 0,
  delivery_type text NOT NULL,
  delivery_address text,
  delivery_date date,
  delivery_time text,
  contact_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les recherches par utilisateur
CREATE INDEX idx_orders_user_id ON public.orders(user_id);

-- RLS pour orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table des articles de commande
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_type text NOT NULL,
  weight numeric,
  quantity integer,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index pour les recherches par commande
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- RLS pour order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Ajouter colonnes de fidélité au profil
ALTER TABLE public.profiles 
ADD COLUMN qualifying_orders_count integer DEFAULT 0,
ADD COLUMN free_grams_available integer DEFAULT 0;

-- Trigger pour updated_at sur orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour le compteur de fidélité
CREATE OR REPLACE FUNCTION public.update_loyalty_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  is_pro boolean;
BEGIN
  -- Vérifier si l'utilisateur est Pro
  SELECT public.is_pro(NEW.user_id) INTO is_pro;
  
  -- Seulement pour les clients non-Pro avec commande >= 10g
  IF NEW.total_flower_weight >= 10 AND NOT is_pro THEN
    -- Incrémenter le compteur
    UPDATE profiles 
    SET qualifying_orders_count = COALESCE(qualifying_orders_count, 0) + 1
    WHERE id = NEW.user_id
    RETURNING qualifying_orders_count INTO current_count;
    
    -- Si 10 commandes atteintes, ajouter 10g offerts et reset
    IF current_count >= 10 THEN
      UPDATE profiles 
      SET 
        qualifying_orders_count = 0,
        free_grams_available = COALESCE(free_grams_available, 0) + 10
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger sur insertion de commande
CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_counter();