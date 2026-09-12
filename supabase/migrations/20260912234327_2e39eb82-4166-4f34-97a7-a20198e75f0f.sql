CREATE TABLE public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view posts" ON public.forum_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can create posts" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) AND created_by = auth.uid());
CREATE POLICY "Admins can update posts" ON public.forum_posts FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Admins can delete posts" ON public.forum_posts FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role));
CREATE TRIGGER set_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.forum_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_path text NOT NULL,
  mime_type text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX forum_attachments_post_id_idx ON public.forum_attachments(post_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_attachments TO authenticated;
GRANT ALL ON public.forum_attachments TO service_role;
ALTER TABLE public.forum_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view post files" ON public.forum_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage post files" ON public.forum_attachments FOR ALL TO authenticated USING (private.has_role(auth.uid(),'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) AND created_by = auth.uid());

CREATE OR REPLACE FUNCTION private.delete_forum_attachment_file()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','storage' AS $$
BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'forum-media' AND name = OLD.file_path;
  RETURN OLD;
END; $$;
CREATE TRIGGER delete_forum_attachment_before_delete BEFORE DELETE ON public.forum_attachments FOR EACH ROW EXECUTE FUNCTION private.delete_forum_attachment_file();

CREATE OR REPLACE FUNCTION private.delete_forum_post_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','storage' AS $$
BEGIN
  DELETE FROM storage.objects WHERE bucket_id = 'forum-media' AND (storage.foldername(name))[1] = OLD.id::text;
  RETURN OLD;
END; $$;
CREATE TRIGGER delete_forum_post_storage_before_delete BEFORE DELETE ON public.forum_posts FOR EACH ROW EXECUTE FUNCTION private.delete_forum_post_storage();