CREATE TYPE public.app_role AS ENUM ('admin', 'student');
CREATE TYPE public.class_status AS ENUM ('live', 'available', 'closed');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  username text NOT NULL UNIQUE CHECK (char_length(username) BETWEEN 3 AND 30),
  avatar_path text,
  builda_id text NOT NULL UNIQUE CHECK (char_length(builda_id) BETWEEN 3 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view own role or admins view all"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.assign_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_email text;
BEGIN
  account_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN account_email = 'judithereyes534@gmail.com' THEN 'admin'::public.app_role ELSE 'student'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER assign_profile_role_after_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_profile_role();

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 500),
  status public.class_status NOT NULL DEFAULT 'available',
  category text NOT NULL DEFAULT 'Builda',
  scheduled_at timestamptz,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 480),
  cover_key text NOT NULL DEFAULT 'blueprint',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view classes"
ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can create classes"
ON public.classes FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
CREATE POLICY "Admins can update classes"
ON public.classes FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete classes"
ON public.classes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  attachment_path text,
  attachment_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view open class messages"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND (c.status <> 'closed' OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Participants can send to open classes"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.status <> 'closed'));
CREATE POLICY "Authors or admins can delete messages"
ON public.messages FOR DELETE TO authenticated
USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.class_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  file_path text NOT NULL,
  mime_type text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_resources TO authenticated;
GRANT ALL ON public.class_resources TO service_role;
ALTER TABLE public.class_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view open class resources"
ON public.class_resources FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND (c.status <> 'closed' OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "Admins can manage resources"
ON public.class_resources FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.classes (title, description, status, category, scheduled_at, duration_minutes, cover_key, created_by)
VALUES
('Diseño de mundos que enganchan', 'Aprende a transformar una idea en un mundo jugable con ritmo, objetivos y recompensas claras.', 'live', 'Diseño de juego', now(), 75, 'world', '00000000-0000-0000-0000-000000000000'),
('Scripting visual desde cero', 'Construye tus primeras mecánicas interactivas en Builda sin perderte entre nodos y eventos.', 'available', 'Desarrollo', now() + interval '1 day', 60, 'nodes', '00000000-0000-0000-0000-000000000000'),
('Publica y haz crecer tu juego', 'Prepara el lanzamiento, presenta tu experiencia y crea una comunidad activa alrededor de ella.', 'closed', 'Comunidad', now() - interval '2 days', 50, 'launch', '00000000-0000-0000-0000-000000000000');

ALTER PUBLICATION supabase_realtime ADD TABLE public.classes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE POLICY "Users upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');
CREATE POLICY "Users update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);
CREATE POLICY "Users delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);
CREATE POLICY "Participants view class resources"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'class-resources');
CREATE POLICY "Admins upload class resources"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'class-resources' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update class resources"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'class-resources' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete class resources"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'class-resources' AND public.has_role(auth.uid(), 'admin'));