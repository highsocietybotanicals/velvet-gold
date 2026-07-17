-- Add Nectar Divin flag for ultra-premium range
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_nectar_divin BOOLEAN NOT NULL DEFAULT FALSE;

-- Insert Haribo product (Nectar Divin — résine sommeil royal, 10€/g TTC)
INSERT INTO public.products (
  id, name, category, subtitle, badge, description,
  price, price_group, cbd_percentage, image_url,
  intention_match, taste_match, terpenes,
  mood, is_force_noire, is_nectar_divin,
  is_active, display_order
) VALUES (
  'haribo',
  'Haribo',
  'resine',
  'Résine Nectar Divin',
  'Nectar Divin',
  'Résine ultra-premium de la gamme Nectar Divin — puissance supérieure à l''Élixir Noir. Arômes gourmands de bonbon fruité, effets sédatifs profonds pour un sommeil royal.',
  10,
  'B',
  '70% Nectar Divin',
  '/__l5e/assets-v1/9d7d601f-6243-44eb-beef-32473c387bff/haribo.jpg',
  ARRAY['sommeil','detente']::text[],
  ARRAY['fruite']::text[],
  '{"boise":55,"fruite":90,"epice":40,"terreux":70}'::jsonb,
  'Sommeil royal',
  false,
  true,
  true,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subtitle = EXCLUDED.subtitle,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_group = EXCLUDED.price_group,
  cbd_percentage = EXCLUDED.cbd_percentage,
  image_url = EXCLUDED.image_url,
  intention_match = EXCLUDED.intention_match,
  taste_match = EXCLUDED.taste_match,
  terpenes = EXCLUDED.terpenes,
  mood = EXCLUDED.mood,
  is_force_noire = EXCLUDED.is_force_noire,
  is_nectar_divin = EXCLUDED.is_nectar_divin,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;