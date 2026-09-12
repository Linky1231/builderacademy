ALTER TABLE public.messages DROP CONSTRAINT messages_content_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_content_or_attachment_check
CHECK (
  (char_length(content) BETWEEN 1 AND 4000)
  OR (content = '' AND attachment_path IS NOT NULL)
);