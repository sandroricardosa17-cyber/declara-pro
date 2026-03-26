CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'irpf-documents'
  AND public.has_role(auth.uid(), 'admin')
);