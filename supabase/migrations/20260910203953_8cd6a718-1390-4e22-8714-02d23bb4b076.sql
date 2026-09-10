UPDATE public.products
SET is_force_noire = TRUE,
    is_nectar_divin = FALSE,
    subtitle = REPLACE(COALESCE(subtitle, ''), 'Nectar Divin', 'Force Noire'),
    badge = REPLACE(COALESCE(badge, ''), 'Nectar Divin', 'Force Noire'),
    description = REPLACE(COALESCE(description, ''), 'Nectar Divin', 'Force Noire'),
    cbd_percentage = REPLACE(COALESCE(cbd_percentage, ''), 'Nectar Divin', 'Élixir Noir')
WHERE is_nectar_divin = TRUE;

UPDATE public.products
SET subtitle = REPLACE(COALESCE(subtitle, ''), 'Nectar Divin', 'Force Noire'),
    badge = REPLACE(COALESCE(badge, ''), 'Nectar Divin', 'Force Noire'),
    description = REPLACE(COALESCE(description, ''), 'Nectar Divin', 'Force Noire'),
    cbd_percentage = REPLACE(COALESCE(cbd_percentage, ''), 'Nectar Divin', 'Élixir Noir')
WHERE COALESCE(subtitle, '') LIKE '%Nectar Divin%'
   OR COALESCE(badge, '') LIKE '%Nectar Divin%'
   OR COALESCE(description, '') LIKE '%Nectar Divin%'
   OR COALESCE(cbd_percentage, '') LIKE '%Nectar Divin%';