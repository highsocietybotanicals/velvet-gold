DROP POLICY IF EXISTS "Anyone can insert contacts" ON public.contacts;
CREATE POLICY "Anyone can insert valid contacts" ON public.contacts FOR INSERT TO anon, authenticated
WITH CHECK (
  (email IS NOT NULL OR phone IS NOT NULL)
  AND (email IS NULL OR (length(email) <= 254 AND email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'))
  AND (phone IS NULL OR length(phone) <= 20)
  AND (name IS NULL OR length(name) <= 200)
  AND length(source) BETWEEN 1 AND 50
);