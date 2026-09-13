ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS challenge text NOT NULL DEFAULT '';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_challenge boolean NOT NULL DEFAULT false;