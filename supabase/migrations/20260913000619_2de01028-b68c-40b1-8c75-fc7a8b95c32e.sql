DROP TRIGGER IF EXISTS delete_forum_attachment_before_delete ON public.forum_attachments;
DROP TRIGGER IF EXISTS delete_forum_post_storage_before_delete ON public.forum_posts;
DROP TRIGGER IF EXISTS delete_message_attachment_before_delete ON public.messages;
DROP TRIGGER IF EXISTS delete_class_resource_file_before_delete ON public.class_resources;
DROP TRIGGER IF EXISTS delete_class_storage_before_delete ON public.classes;