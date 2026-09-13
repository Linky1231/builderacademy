import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Image as ImageIcon, LoaderCircle, MessagesSquare, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"forum_posts">;
type PostFile = Tables<"forum_attachments">;

export const Route = createFileRoute("/_authenticated/forum")({
  head: () => ({ meta: [
    { title: "Foro | Builder Academy" },
    { name: "description", content: "Publicaciones, materiales y documentos compartidos con la comunidad Builder Academy." },
    { property: "og:title", content: "Foro | Builder Academy" },
    { property: "og:description", content: "Consulta publicaciones y material de estudio de Builder Academy." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Forum,
});

function FilePreview({ file }: { file: PostFile }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("forum-media").createSignedUrl(file.file_path, 3600).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [file.file_path]);
  const isImage = file.mime_type.startsWith("image/");
  if (isImage) {
    return <a href={url ?? undefined} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border bg-background/40">
      {url ? <img src={url} alt={file.title} loading="lazy" className="h-48 w-full object-cover" /> : <div className="grid h-48 place-items-center text-muted-foreground"><LoaderCircle className="animate-spin" /></div>}
    </a>;
  }
  return <Button asChild variant="outline" className="h-auto w-full justify-start p-3">
    <a href={url ?? undefined} target="_blank" rel="noreferrer" download={file.title}>
      <FileText className="text-accent" /><span className="min-w-0 flex-1 truncate text-left text-sm">{file.title}</span><Download />
    </a>
  </Button>;
}

function Forum() {
  const { user } = Route.useRouteContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [files, setFiles] = useState<PostFile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploads, setUploads] = useState<File[]>([]);

  async function load() {
    const [roles, postResult, fileResult] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("forum_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("forum_attachments").select("*").order("created_at"),
    ]);
    setIsAdmin(roles.data?.some((entry) => entry.role === "admin") ?? false);
    setPosts(postResult.data ?? []);
    setFiles(fileResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (loading || !window.location.hash) return;
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setNotice("");
    const created = await supabase.from("forum_posts").insert({ title: title.trim(), description: description.trim(), created_by: user.id }).select().single();
    if (created.error || !created.data) { setBusy(false); setNotice(created.error?.message ?? "No se pudo crear la publicación."); return; }
    for (const file of uploads) {
      if (file.size > 20 * 1024 * 1024) { setNotice(`“${file.name}” supera los 20 MB y no se subió.`); continue; }
      const clean = file.name.replaceAll("/", "-");
      const path = `${created.data.id}/${Date.now()}-${clean}`;
      const uploaded = await supabase.storage.from("forum-media").upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (uploaded.error) { setNotice(uploaded.error.message); continue; }
      await supabase.from("forum_attachments").insert({ post_id: created.data.id, title: clean, file_path: path, mime_type: file.type || "application/octet-stream", created_by: user.id });
    }
    setBusy(false); setTitle(""); setDescription(""); setUploads([]); setOpen(false);
    setNotice("Publicación creada.");
    await load();
  }

  async function removePost(post: Post) {
    setNotice("");
    const result = await supabase.from("forum_posts").delete().eq("id", post.id).select("id").maybeSingle();
    if (result.error) throw new Error(`No se pudo eliminar la publicación: ${result.error.message}`);
    if (!result.data) throw new Error("La publicación no se eliminó. Comprueba tus permisos e inténtalo de nuevo.");
    setPosts((current) => current.filter((entry) => entry.id !== post.id));
    setFiles((current) => current.filter((entry) => entry.post_id !== post.id));
    setNotice("Publicación eliminada.");
    await load();
  }

  return <AppShell isAdmin={isAdmin}>
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <span className="flex items-center gap-2 text-xs font-bold text-accent"><MessagesSquare className="h-4 w-4" /> FORO</span>
        <h1 className="mt-2 text-3xl font-extrabold text-card-foreground sm:text-4xl">Publicaciones y material</h1>
        <p className="mt-2 text-muted-foreground">Consulta anuncios, imágenes y documentos de la academia. Puedes mencionarlos en cualquier sala escribiendo @.</p>
      </div>
      {isAdmin && <Button onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Plus />}{open ? "Cancelar" : "Nueva publicación"}</Button>}
    </header>

    {notice && <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm"><span>{notice}</span><Button size="icon-sm" variant="ghost" onClick={() => setNotice("")} aria-label="Cerrar aviso"><X /></Button></div>}

    {isAdmin && open && <form onSubmit={create} className="mb-8 space-y-4 rounded-xl border border-border bg-card/90 p-5">
      <label className="block text-sm font-semibold">Título<Input required minLength={3} maxLength={140} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 bg-background/50" /></label>
      <label className="block text-sm font-semibold">Descripción<Textarea required minLength={5} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-2 min-h-32 bg-background/50" /></label>
      <label className="block rounded-xl border border-dashed border-primary p-5 text-center text-sm text-muted-foreground">
        <Upload className="mx-auto mb-2 text-accent" />
        {uploads.length ? `${uploads.length} archivo(s) seleccionados` : "Añade imágenes, documentos o material de clase"}
        <input type="file" multiple className="sr-only" onChange={(event) => setUploads([...(event.target.files ?? [])])} />
      </label>
      {uploads.length > 0 && <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">{uploads.map((file) => <li key={file.name} className="flex items-center gap-1 rounded-md border border-border px-2 py-1">{file.type.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}<span className="max-w-40 truncate">{file.name}</span></li>)}</ul>}
      <Button disabled={busy} className="w-full">{busy ? "Publicando…" : "Publicar en el foro"}</Button>
    </form>}

    {loading ? <div className="grid min-h-60 place-items-center text-sm text-muted-foreground"><span className="flex items-center gap-2"><LoaderCircle className="animate-spin" />Cargando el foro…</span></div>
      : posts.length === 0 ? <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">Todavía no hay publicaciones en el foro.</div>
      : <div className="space-y-5">{posts.map((post) => {
        const postFiles = files.filter((file) => file.post_id === post.id);
        const images = postFiles.filter((file) => file.mime_type.startsWith("image/"));
        const documents = postFiles.filter((file) => !file.mime_type.startsWith("image/"));
        return <article key={post.id} id={post.id} className="scroll-mt-24 rounded-xl border border-border bg-card/85 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-card-foreground">{post.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_at))}</p>
            </div>
            {isAdmin && <ConfirmDelete title="Eliminar publicación" description={`Se eliminará “${post.title}” y todo su material.`} onConfirm={() => removePost(post)}>
              <Button size="icon" variant="ghost" aria-label="Eliminar publicación"><Trash2 /></Button>
            </ConfirmDelete>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{post.description}</p>
          {images.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{images.map((file) => <FilePreview key={file.id} file={file} />)}</div>}
          {documents.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{documents.map((file) => <FilePreview key={file.id} file={file} />)}</div>}
        </article>;
      })}</div>}
  </AppShell>;
}
