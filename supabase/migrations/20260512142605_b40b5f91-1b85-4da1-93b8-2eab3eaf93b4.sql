CREATE POLICY "Admins can update social-media objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'social-media' AND public.is_admin())
WITH CHECK (bucket_id = 'social-media' AND public.is_admin());