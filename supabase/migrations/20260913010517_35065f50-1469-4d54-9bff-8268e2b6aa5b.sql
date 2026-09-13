ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_points integer NOT NULL DEFAULT 100;

CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TYPE public.sanction_type AS ENUM ('warning', 'suspension', 'ban');

CREATE TABLE public.trust_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  balance_after integer NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.trust_events TO authenticated;
GRANT ALL ON public.trust_events TO service_role;
ALTER TABLE public.trust_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own trust events or admins view all" ON public.trust_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can record trust events" ON public.trust_events FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) AND created_by = auth.uid());

CREATE TABLE public.user_sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.sanction_type NOT NULL DEFAULT 'warning',
  reason text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sanctions TO authenticated;
GRANT ALL ON public.user_sanctions TO service_role;
ALTER TABLE public.user_sanctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sanctions or admins view all" ON public.user_sanctions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can create sanctions" ON public.user_sanctions FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) AND created_by = auth.uid());
CREATE POLICY "Admins can update sanctions" ON public.user_sanctions FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can delete sanctions" ON public.user_sanctions FOR DELETE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER set_user_sanctions_updated_at BEFORE UPDATE ON public.user_sanctions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_restricted(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_sanctions
    WHERE user_id = _user_id
      AND active
      AND type IN ('suspension', 'ban')
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

DROP POLICY "Participants can send to open classes" ON public.messages;
CREATE POLICY "Participants can send to open classes" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND NOT public.is_restricted(auth.uid())
  AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = messages.class_id AND c.status <> 'closed'::public.class_status)
);