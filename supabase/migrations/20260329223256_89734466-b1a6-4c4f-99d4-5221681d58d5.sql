INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can upload invoices"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'invoices' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Admins can read all invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'invoices' AND
  public.is_admin(auth.uid())
);