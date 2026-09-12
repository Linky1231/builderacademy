ALTER TABLE public.messages
ADD COLUMN attachment_mime_type text;

CREATE POLICY "Participants view open room attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND (c.status <> 'closed' OR private.has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Participants upload to open rooms"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.status <> 'closed'
  )
);

CREATE POLICY "Authors or admins delete room attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (
    (storage.foldername(name))[2] = auth.uid()::text
    OR private.has_role(auth.uid(), 'admin')
  )
);

CREATE OR REPLACE FUNCTION private.delete_message_attachment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF OLD.attachment_path IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'message-attachments' AND name = OLD.attachment_path;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER delete_message_attachment_before_delete
BEFORE DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION private.delete_message_attachment();

CREATE OR REPLACE FUNCTION private.delete_class_resource_file()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'class-resources' AND name = OLD.file_path;
  RETURN OLD;
END;
$$;

CREATE TRIGGER delete_class_resource_file_before_delete
BEFORE DELETE ON public.class_resources
FOR EACH ROW EXECUTE FUNCTION private.delete_class_resource_file();

CREATE OR REPLACE FUNCTION private.delete_class_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id IN ('message-attachments', 'class-resources')
    AND (storage.foldername(name))[1] = OLD.id::text;
  RETURN OLD;
END;
$$;

CREATE TRIGGER delete_class_storage_before_delete
BEFORE DELETE ON public.classes
FOR EACH ROW EXECUTE FUNCTION private.delete_class_storage();