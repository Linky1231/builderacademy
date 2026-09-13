CREATE OR REPLACE FUNCTION private.is_restricted(_user_id uuid)
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
  AND NOT private.is_restricted(auth.uid())
  AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = messages.class_id AND c.status <> 'closed'::public.class_status)
);

DROP FUNCTION public.is_restricted(uuid);