DROP POLICY "Participants view class resources" ON storage.objects;
CREATE POLICY "Participants view accessible class files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'class-resources'
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.status <> 'closed' OR private.has_role(auth.uid(), 'admin'))
  )
);
CREATE POLICY "Participants attach files to open classes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'class-resources'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.status <> 'closed'
  )
);