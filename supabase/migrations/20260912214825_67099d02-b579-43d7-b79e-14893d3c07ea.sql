CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

ALTER POLICY "Users can view own profile or admins view all" ON public.profiles USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Users can view own role or admins view all" ON public.user_roles USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can create classes" ON public.classes WITH CHECK (private.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
ALTER POLICY "Admins can update classes" ON public.classes USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins can delete classes" ON public.classes USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Participants can view open class messages" ON public.messages USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND (c.status <> 'closed' OR private.has_role(auth.uid(), 'admin'))));
ALTER POLICY "Authors or admins can delete messages" ON public.messages USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Participants can view open class resources" ON public.class_resources USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND (c.status <> 'closed' OR private.has_role(auth.uid(), 'admin'))));
ALTER POLICY "Admins can manage resources" ON public.class_resources USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
ALTER POLICY "Admins upload class resources" ON storage.objects WITH CHECK (bucket_id = 'class-resources' AND private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins update class resources" ON storage.objects USING (bucket_id = 'class-resources' AND private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins delete class resources" ON storage.objects USING (bucket_id = 'class-resources' AND private.has_role(auth.uid(), 'admin'));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_profile_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;