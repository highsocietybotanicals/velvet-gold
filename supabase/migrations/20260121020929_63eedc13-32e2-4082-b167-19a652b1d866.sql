-- Ajouter le champ numéro de TVA au profil
ALTER TABLE public.profiles 
ADD COLUMN vat_number text;

-- Créer la table products pour la gestion dynamique des prix
CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('fleur', 'resine')),
  price numeric NOT NULL,
  pro_price numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Lecture publique des produits actifs
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
USING (is_active = true);

-- Les admins peuvent tout voir (y compris produits inactifs)
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Les admins peuvent insérer des produits
CREATE POLICY "Admins can insert products"
ON public.products
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Les admins peuvent modifier les produits
CREATE POLICY "Admins can update products"
ON public.products
FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Les admins peuvent supprimer les produits
CREATE POLICY "Admins can delete products"
ON public.products
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Trigger pour updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les produits existants depuis le code (fleurs)
INSERT INTO public.products (id, name, category, price) VALUES
('amnesia-haze', 'Amnesia Haze', 'fleur', 8),
('og-kush', 'OG Kush', 'fleur', 8),
('white-widow', 'White Widow', 'fleur', 8),
('northern-lights', 'Northern Lights', 'fleur', 8),
('sour-diesel', 'Sour Diesel', 'fleur', 8),
('blue-dream', 'Blue Dream', 'fleur', 8),
('jack-herer', 'Jack Herer', 'fleur', 8),
('gorilla-glue', 'Gorilla Glue', 'fleur', 8),
('girl-scout-cookies', 'Girl Scout Cookies', 'fleur', 8),
('purple-haze', 'Purple Haze', 'fleur', 8),
('lemon-haze', 'Lemon Haze', 'fleur', 8),
('strawberry-kush', 'Strawberry Kush', 'fleur', 8),
('pineapple-express', 'Pineapple Express', 'fleur', 8),
('ak-47', 'AK-47', 'fleur', 8),
('critical', 'Critical', 'fleur', 8),
('cheese', 'Cheese', 'fleur', 8),
('bubba-kush', 'Bubba Kush', 'fleur', 8),
('gelato', 'Gelato', 'fleur', 8),
('wedding-cake', 'Wedding Cake', 'fleur', 8),
('zkittlez', 'Zkittlez', 'fleur', 8);

-- Insérer les produits existants (résines)
INSERT INTO public.products (id, name, category, price) VALUES
('moroccan-hash', 'Moroccan Hash', 'resine', 10),
('afghan-hash', 'Afghan Hash', 'resine', 10),
('lebanese-hash', 'Lebanese Hash', 'resine', 10),
('charas', 'Charas', 'resine', 12),
('nepal-temple-ball', 'Nepal Temple Ball', 'resine', 12),
('bubble-hash', 'Bubble Hash', 'resine', 14),
('dry-sift', 'Dry Sift', 'resine', 14),
('rosin-press', 'Rosin Press', 'resine', 16),
('live-rosin', 'Live Rosin', 'resine', 18),
('moonrocks', 'Moonrocks', 'resine', 20);