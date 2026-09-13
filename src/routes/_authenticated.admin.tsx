import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, CalendarClock, ExternalLink, FileText, Gavel, GraduationCap, History, MessageCircle, Minus, Pencil, Plus, Radio, Save, Search, Shield, Star, Target, Trash2, Upload, Users, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/app-shell";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { formatClassDate, statusCopy, type AcademyClass, type Profile } from "@/lib/academy";

type Resource = Tables<"class_resources">;
type StatusFilter = "all" | AcademyClass["status"];
type TrustEvent = Tables<"trust_events">;
type Sanction = Tables<"user_sanctions">;

const sanctionCopy: Record<Sanction["type"], string> = { warning: "Advertencia", suspension: "Suspensión", ban: "Baneo" };

function trustTone(points: number) {
  if (points >= 100) return "text-emerald-400";
  if (points >= 50) return "text-amber-400";
  return "text-destructive";
}

function formatMoment(value: string) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Administración | Builder Academy" }, { name: "description", content: "Gestiona clases, salas, recursos y estudiantes de Builder Academy." },
    { property: "og:title", content: "Administración | Builder Academy" }, { property: "og:description", content: "Panel completo de gestión de Builder Academy." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}), component: Admin,
});

const empty = { title: "", description: "", category: "Fundamentos", status: "available" as AcademyClass["status"], scheduled_at: "", duration_minutes: 60, cover_key: "default" };

function Admin() {
  const { user, isAdmin } = Route.useRouteContext();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<AcademyClass[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [resourceClass, setResourceClass] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [challenges, setChallenges] = useState<Record<string, string>>({});
  const [trustEvents, setTrustEvents] = useState<TrustEvent[]>([]);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [trustUser, setTrustUser] = useState("");
  const [trustAmount, setTrustAmount] = useState(10);
  const [trustReason, setTrustReason] = useState("");
  const [sanctionType, setSanctionType] = useState<Sanction["type"]>("warning");
  const [sanctionReason, setSanctionReason] = useState("");
  const [sanctionExpires, setSanctionExpires] = useState("");

  async function load() {
    if (!isAdmin) { void navigate({ to: "/dashboard" }); return; }
    const [classResult, profileResult, resourceResult, trustResult, sanctionResult] = await Promise.all([
      supabase.from("classes").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("class_resources").select("*").order("created_at", { ascending: false }),
      supabase.from("trust_events").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("user_sanctions").select("*").order("created_at", { ascending: false }),
    ]);
    setClasses(classResult.data ?? []);
    setChallenges(Object.fromEntries((classResult.data ?? []).map((entry) => [entry.id, entry.challenge ?? ""])));
    setStudents(profileResult.data ?? []);
    setResources(resourceResult.data ?? []);
    setTrustEvents(trustResult.data ?? []);
    setSanctions(sanctionResult.data ?? []);
    setTrustUser((current) => current || profileResult.data?.[0]?.id || "");
    setResourceClass((current) => current || classResult.data?.[0]?.id || "");
  }

  async function adjustTrust(direction: 1 | -1) {
    const target = students.find((entry) => entry.id === trustUser);
    const amount = Math.abs(Math.round(trustAmount));
    if (!target || !amount) { setNotice("Elige un usuario y una cantidad de puntos."); return; }
    if (!trustReason.trim()) { setNotice("Escribe el motivo del ajuste de Trust Points."); return; }
    setBusy(true); setNotice("");
    const delta = direction * amount;
    const balance = Math.max(0, (target.trust_points ?? 0) + delta);
    const updated = await supabase.from("profiles").update({ trust_points: balance }).eq("id", target.id).select("id").maybeSingle();
    if (updated.error || !updated.data) { setBusy(false); setNotice(updated.error?.message ?? "No se pudieron actualizar los Trust Points."); return; }
    const logged = await supabase.from("trust_events").insert({ user_id: target.id, delta, balance_after: balance, reason: trustReason.trim(), created_by: user.id });
    setBusy(false); setTrustReason("");
    setNotice(logged.error ? "Puntos actualizados, pero el historial no se guardó." : `${delta > 0 ? "+" : ""}${delta} Trust Points para ${target.username}.`);
    await load();
  }

  async function createSanction() {
    const target = students.find((entry) => entry.id === trustUser);
    if (!target) { setNotice("Elige un usuario para sancionar."); return; }
    if (!sanctionReason.trim()) { setNotice("Escribe el motivo de la sanción."); return; }
    setBusy(true); setNotice("");
    const result = await supabase.from("user_sanctions").insert({
      user_id: target.id, type: sanctionType, reason: sanctionReason.trim(),
      expires_at: sanctionExpires ? new Date(sanctionExpires).toISOString() : null, created_by: user.id,
    });
    setBusy(false);
    if (result.error) { setNotice(result.error.message); return; }
    setSanctionReason(""); setSanctionExpires("");
    setNotice(`${sanctionCopy[sanctionType]} aplicada a ${target.username}.`); await load();
  }

  async function toggleSanction(item: Sanction) {
    const result = await supabase.from("user_sanctions").update({ active: !item.active }).eq("id", item.id).select("id").maybeSingle();
    if (result.error || !result.data) { setNotice(result.error?.message ?? "No se pudo actualizar la sanción."); return; }
    setNotice(item.active ? "Sanción levantada." : "Sanción reactivada."); await load();
  }

  async function removeSanction(item: Sanction) {
    const result = await supabase.from("user_sanctions").delete().eq("id", item.id).select("id").maybeSingle();
    if (result.error) throw new Error(`No se pudo eliminar la sanción: ${result.error.message}`);
    if (!result.data) throw new Error("La sanción no se eliminó. Comprueba tus permisos.");
    setSanctions((current) => current.filter((entry) => entry.id !== item.id));
    setNotice("Sanción eliminada del historial."); await load();
  }

  useEffect(() => { void load(); }, [isAdmin]);

  const visibleClasses = useMemo(() => classes.filter((item) => {
    const matchesStatus = filter === "all" || item.status === filter;
    const normalized = query.trim().toLocaleLowerCase();
    return matchesStatus && (!normalized || `${item.title} ${item.category}`.toLocaleLowerCase().includes(normalized));
  }), [classes, filter, query]);

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const payload = { ...form, scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null, created_by: user.id };
    const result = editing ? await supabase.from("classes").update(payload).eq("id", editing) : await supabase.from("classes").insert(payload);
    setBusy(false);
    if (result.error) { setNotice(result.error.message); return; }
    setNotice(editing ? "Clase y sala actualizadas." : "Clase y sala creadas."); setEditing(null); setForm(empty); await load();
  }

  function edit(item: AcademyClass) {
    setEditing(item.id);
    setForm({ title: item.title, description: item.description, category: item.category, status: item.status, scheduled_at: item.scheduled_at ? item.scheduled_at.slice(0, 16) : "", duration_minutes: item.duration_minutes, cover_key: item.cover_key });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function changeStatus(item: AcademyClass, status: AcademyClass["status"]) {
    const result = await supabase.from("classes").update({ status }).eq("id", item.id);
    if (result.error) { setNotice(result.error.message); return; }
    let challengeNotice = "";
    const challenge = (challenges[item.id] ?? item.challenge ?? "").trim();
    if (status !== "closed") {
      if (!challenge) challengeNotice = " Añade un reto en la pestaña Reto para compartirlo al iniciar.";
      else {
        const posted = await supabase.from("messages").insert({ class_id: item.id, author_id: user.id, content: challenge, is_challenge: true });
        challengeNotice = posted.error ? " El reto no pudo publicarse en el chat." : " El reto se publicó en el chat.";
      }
    }
    setNotice((status === "closed" ? "Sala cerrada para participantes." : status === "live" ? "Sala abierta en vivo." : "Sala disponible.") + challengeNotice);
    await load();
  }

  async function saveChallenge(item: AcademyClass) {
    setBusy(true); setNotice("");
    const result = await supabase.from("classes").update({ challenge: (challenges[item.id] ?? "").trim() }).eq("id", item.id);
    setBusy(false);
    if (result.error) { setNotice(result.error.message); return; }
    setNotice(`Reto guardado para “${item.title}”.`); await load();
  }

  async function publishChallenge(item: AcademyClass) {
    const challenge = (challenges[item.id] ?? "").trim();
    if (!challenge) { setNotice("Escribe la indicación del reto antes de publicarla."); return; }
    if (item.status === "closed") { setNotice("Reabre la sala para publicar el reto en el chat."); return; }
    setBusy(true);
    const posted = await supabase.from("messages").insert({ class_id: item.id, author_id: user.id, content: challenge, is_challenge: true });
    setBusy(false);
    setNotice(posted.error ? `No se pudo publicar el reto: ${posted.error.message}` : "Reto publicado en el chat de la clase.");
  }

  async function removeClass(item: AcademyClass) {
    const [classFiles, messageFiles] = await Promise.all([
      supabase.from("class_resources").select("file_path").eq("class_id", item.id),
      supabase.from("messages").select("attachment_path").eq("class_id", item.id).not("attachment_path", "is", null),
    ]);
    const result = await supabase.from("classes").delete().eq("id", item.id).select("id").maybeSingle();
    if (result.error) throw new Error(`No se pudo eliminar la clase: ${result.error.message}`);
    if (!result.data) throw new Error("La clase no se eliminó. Comprueba tus permisos e inténtalo de nuevo.");
    const resourcePaths = (classFiles.data ?? []).map((entry) => entry.file_path);
    const messagePaths = (messageFiles.data ?? []).flatMap((entry) => entry.attachment_path ? [entry.attachment_path] : []);
    const cleanupResults = await Promise.all([
      resourcePaths.length ? supabase.storage.from("class-resources").remove(resourcePaths) : Promise.resolve({ error: null }),
      messagePaths.length ? supabase.storage.from("message-attachments").remove(messagePaths) : Promise.resolve({ error: null }),
    ]);
    setClasses((current) => current.filter((entry) => entry.id !== item.id));
    setResources((current) => current.filter((entry) => entry.class_id !== item.id));
    setNotice(cleanupResults.some((entry) => entry.error) ? "Clase eliminada. Algunos archivos no pudieron limpiarse." : "Clase y sala eliminadas."); if (editing === item.id) { setEditing(null); setForm(empty); } await load();
  }

  async function uploadResource(event: FormEvent) {
    event.preventDefault(); if (!resourceFile || !resourceClass) return; setBusy(true); setNotice("");
    if (resourceFile.size > 20 * 1024 * 1024) { setBusy(false); setNotice("El archivo supera el límite de 20 MB."); return; }
    const cleanName = resourceFile.name.replaceAll("/", "-");
    const path = `${resourceClass}/${user.id}/${Date.now()}-${cleanName}`;
    const uploaded = await supabase.storage.from("class-resources").upload(path, resourceFile, { contentType: resourceFile.type || "application/octet-stream" });
    if (uploaded.error) { setBusy(false); setNotice(uploaded.error.message); return; }
    const created = await supabase.from("class_resources").insert({ class_id: resourceClass, title: resourceTitle.trim() || cleanName, file_path: path, mime_type: resourceFile.type || "application/octet-stream", created_by: user.id });
    if (created.error) { await supabase.storage.from("class-resources").remove([path]); setBusy(false); setNotice(created.error.message); return; }
    setBusy(false); setResourceTitle(""); setResourceFile(null); setNotice("Recurso añadido a la clase."); await load();
  }

  async function openResource(resource: Resource) {
    const { data } = await supabase.storage.from("class-resources").createSignedUrl(resource.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeResource(resource: Resource) {
    const result = await supabase.from("class_resources").delete().eq("id", resource.id).select("id").maybeSingle();
    if (result.error) throw new Error(`No se pudo eliminar el recurso: ${result.error.message}`);
    if (!result.data) throw new Error("El recurso no se eliminó. Comprueba tus permisos e inténtalo de nuevo.");
    const storageResult = await supabase.storage.from("class-resources").remove([resource.file_path]);
    setResources((current) => current.filter((entry) => entry.id !== resource.id));
    setNotice(storageResult.error ? "Recurso eliminado. El archivo no pudo limpiarse." : "Recurso eliminado."); await load();
  }

  const counts = { live: classes.filter((item) => item.status === "live").length, available: classes.filter((item) => item.status === "available").length, closed: classes.filter((item) => item.status === "closed").length };

  return <AppShell isAdmin><header className="mb-8"><span className="flex items-center gap-2 text-xs font-bold text-accent"><Shield className="h-4 w-4"/> CENTRO DE CONTROL</span><h1 className="mt-2 text-3xl font-extrabold text-card-foreground sm:text-4xl">Administra la academia</h1><p className="mt-2 text-muted-foreground">Cada clase incluye una sala. Gestiona su acceso, contenido y participantes desde un solo lugar.</p></header>
    <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Clases y salas", value: classes.length, icon: BookOpen }, { label: "En vivo", value: counts.live, icon: Radio }, { label: "Disponibles", value: counts.available, icon: CalendarClock }, { label: "Estudiantes", value: students.length, icon: Users },
    ].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-xl border border-border bg-card/80 p-4"><Icon className="text-accent"/><strong className="mt-4 block text-3xl text-card-foreground">{value}</strong><span className="text-sm text-muted-foreground">{label}</span></div>)}</section>
    {notice && <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm"><span>{notice}</span><Button size="icon-sm" variant="ghost" onClick={() => setNotice("")} aria-label="Cerrar aviso"><X/></Button></div>}
    <Tabs defaultValue="classes" className="space-y-5"><TabsList className="h-auto w-full justify-start overflow-x-auto bg-card/80 p-1"><TabsTrigger value="classes"><BookOpen/>Clases y salas</TabsTrigger><TabsTrigger value="resources"><FileText/>Recursos</TabsTrigger><TabsTrigger value="challenge"><Target/>Reto</TabsTrigger><TabsTrigger value="trust"><Star/>Trust Points</TabsTrigger><TabsTrigger value="students"><Users/>Estudiantes</TabsTrigger></TabsList>
      <TabsContent value="classes" className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]"><section className="academy-panel self-start rounded-xl border border-border bg-card/90 p-5 xl:sticky xl:top-24"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground">{editing ? <Pencil/> : <Plus/>}{editing ? "Editar clase y sala" : "Nueva clase y sala"}</h2>{editing && <Button size="icon-sm" variant="ghost" onClick={() => { setEditing(null); setForm(empty); }} aria-label="Cancelar edición"><X/></Button>}</div><form onSubmit={save} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Título<Input required minLength={3} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 bg-background/50"/></label><label className="block text-sm font-semibold">Descripción<Textarea required minLength={10} maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-28 bg-background/50"/></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Categoría<Input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-2 bg-background/50"/></label><label className="text-sm font-semibold">Duración<Input type="number" min={15} max={480} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="mt-2 bg-background/50"/></label></div><label className="block text-sm font-semibold">Fecha y hora<Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="mt-2 bg-background/50"/></label><label className="block text-sm font-semibold">Estado<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AcademyClass["status"] })} className="mt-2 h-10 w-full rounded-md border border-input bg-background/50 px-3"><option value="available">Disponible</option><option value="live">En vivo</option><option value="closed">Cerrada</option></select></label><Button disabled={busy} className="w-full"><Save/>{busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear clase y sala"}</Button></form></section>
        <section><div className="mb-4 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título o categoría" className="pl-9"/></label><select value={filter} onChange={(e) => setFilter(e.target.value as StatusFilter)} className="h-10 rounded-md border border-input bg-card px-3 text-sm"><option value="all">Todos los estados</option><option value="live">En vivo</option><option value="available">Disponibles</option><option value="closed">Cerradas</option></select></div><div className="space-y-3">{visibleClasses.length === 0 ? <div className="rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">No hay clases que coincidan.</div> : visibleClasses.map((item) => { const status = statusCopy[item.status]; return <article key={item.id} className="rounded-xl border border-border bg-card/85 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-full bg-background/60 px-2.5 py-1 text-xs font-bold"><span className={`h-2 w-2 rounded-full ${status.dot}`}/>{status.label}</span><span className="text-xs font-bold uppercase text-accent">{item.category}</span></div><h3 className="text-lg font-extrabold text-card-foreground">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">{formatClassDate(item.scheduled_at)} · {item.duration_minutes} min</p></div><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to="/class/$id" params={{ id: item.id }}><MessageCircle/>Abrir sala</Link></Button>{item.status !== "live" && <Button size="sm" variant="secondary" onClick={() => changeStatus(item, "live")}><Radio/>En vivo</Button>}{item.status !== "closed" ? <Button size="sm" variant="outline" onClick={() => changeStatus(item, "closed")}>Cerrar</Button> : <Button size="sm" variant="outline" onClick={() => changeStatus(item, "available")}>Reabrir</Button>}<Button size="icon" variant="ghost" onClick={() => edit(item)} aria-label="Editar clase"><Pencil/></Button><ConfirmDelete title="Eliminar clase y sala" description={`Se eliminarán “${item.title}”, su sala, los mensajes y los recursos. Esta acción no se puede deshacer.`} onConfirm={() => removeClass(item)}><Button size="icon" variant="destructive" aria-label="Eliminar clase y sala"><Trash2/></Button></ConfirmDelete></div></div></article>; })}</div></section></TabsContent>
      <TabsContent value="resources" className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]"><section className="self-start rounded-xl border border-border bg-card/85 p-5"><h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><Upload/>Añadir recurso</h2><form onSubmit={uploadResource} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Clase<select required value={resourceClass} onChange={(e) => setResourceClass(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background/50 px-3"><option value="">Selecciona una clase</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="block text-sm font-semibold">Título<Input value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} placeholder="Opcional: usa el nombre del archivo" className="mt-2"/></label><label className="block rounded-xl border border-dashed border-primary p-5 text-center text-sm text-muted-foreground"><Upload className="mx-auto mb-2 text-accent"/>{resourceFile ? resourceFile.name : "Selecciona cualquier documento"}<input type="file" className="sr-only" onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}/></label><p className="text-xs text-muted-foreground">Máximo 20 MB por archivo.</p><Button disabled={busy || !resourceClass || !resourceFile} className="w-full"><Upload/>Subir recurso</Button></form></section><section><h2 className="mb-4 text-xl font-extrabold text-card-foreground">Biblioteca de recursos</h2><div className="space-y-3">{resources.length === 0 ? <div className="rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">Todavía no hay recursos.</div> : resources.map((resource) => <article key={resource.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/85 p-4"><FileText className="shrink-0 text-accent"/><div className="min-w-0 flex-1"><strong className="block truncate text-card-foreground">{resource.title}</strong><span className="text-xs text-muted-foreground">{classes.find((item) => item.id === resource.class_id)?.title ?? "Clase"}</span></div><Button size="icon" variant="ghost" onClick={() => openResource(resource)} aria-label="Abrir recurso"><ExternalLink/></Button><ConfirmDelete title="Eliminar recurso" description={`Se eliminará “${resource.title}” de la biblioteca.`} onConfirm={() => removeResource(resource)}><Button size="icon" variant="ghost" aria-label="Eliminar recurso"><Trash2/></Button></ConfirmDelete></article>)}</div></section></TabsContent>
      <TabsContent value="challenge"><section className="rounded-xl border border-border bg-card/85 p-5"><h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><Target className="text-accent"/>Reto de cada clase</h2><p className="mt-2 text-sm text-muted-foreground">Escribe la actividad práctica que hará el estudiante. La indicación se publica automáticamente en el chat al iniciar o reanudar la sesión.</p><div className="mt-5 space-y-4">{classes.length === 0 ? <div className="rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">Crea una clase para asignarle un reto.</div> : classes.map((item) => <article key={item.id} className="rounded-xl border border-border bg-background/30 p-4"><div className="flex flex-wrap items-center gap-2"><strong className="text-card-foreground">{item.title}</strong><span className="text-xs font-bold uppercase text-accent">{statusCopy[item.status].label}</span></div><Textarea value={challenges[item.id] ?? ""} onChange={(e) => setChallenges((current) => ({ ...current, [item.id]: e.target.value }))} maxLength={1000} placeholder="Ej.: Construye una landing con tu propuesta de valor y compártela en el chat." className="mt-3 min-h-24 bg-background/50"/><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={() => saveChallenge(item)}><Save/>Guardar reto</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => publishChallenge(item)}><MessageCircle/>Publicar ahora en el chat</Button></div></article>)}</div></section></TabsContent>
      <TabsContent value="trust" className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="academy-panel self-start space-y-6 rounded-xl border border-border bg-card/90 p-5 xl:sticky xl:top-24">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><Star className="text-accent"/>Ajustar Trust Points</h2>
            <p className="mt-2 text-sm text-muted-foreground">Suma o resta puntos de confianza indicando siempre el motivo.</p>
            <label className="mt-4 block text-sm font-semibold">Usuario
              <select value={trustUser} onChange={(e) => setTrustUser(e.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background/50 px-3">
                <option value="">Selecciona un usuario</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.username} · {student.trust_points} pts</option>)}
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold">Cantidad de puntos
              <Input type="number" min={1} max={500} value={trustAmount} onChange={(e) => setTrustAmount(Number(e.target.value))} className="mt-2 bg-background/50"/>
            </label>
            <label className="mt-4 block text-sm font-semibold">Motivo
              <Textarea value={trustReason} onChange={(e) => setTrustReason(e.target.value)} maxLength={300} placeholder="Ej.: Ayudó a otros builders resolviendo dudas del reto." className="mt-2 min-h-20 bg-background/50"/>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button disabled={busy} onClick={() => adjustTrust(1)}><Plus/>Sumar</Button>
              <Button variant="destructive" disabled={busy} onClick={() => adjustTrust(-1)}><Minus/>Restar</Button>
            </div>
          </div>
          <div className="border-t border-border pt-5">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><Gavel className="text-accent"/>Aplicar sanción</h2>
            <p className="mt-2 text-sm text-muted-foreground">Las suspensiones y baneos activos impiden escribir en las salas.</p>
            <label className="mt-4 block text-sm font-semibold">Tipo
              <select value={sanctionType} onChange={(e) => setSanctionType(e.target.value as Sanction["type"])} className="mt-2 h-10 w-full rounded-md border border-input bg-background/50 px-3">
                <option value="warning">Advertencia</option><option value="suspension">Suspensión</option><option value="ban">Baneo</option>
              </select>
            </label>
            <label className="mt-4 block text-sm font-semibold">Motivo
              <Textarea value={sanctionReason} onChange={(e) => setSanctionReason(e.target.value)} maxLength={300} placeholder="Ej.: Lenguaje ofensivo en la sala en vivo." className="mt-2 min-h-20 bg-background/50"/>
            </label>
            <label className="mt-4 block text-sm font-semibold">Vence el (opcional)
              <Input type="datetime-local" value={sanctionExpires} onChange={(e) => setSanctionExpires(e.target.value)} className="mt-2 bg-background/50"/>
            </label>
            <Button variant="secondary" disabled={busy} className="mt-4 w-full" onClick={createSanction}><Gavel/>Aplicar sanción</Button>
          </div>
        </section>
        <section className="space-y-6">
          <div className="rounded-xl border border-border bg-card/85 p-5">
            <h2 className="text-xl font-extrabold text-card-foreground">Reputación de la comunidad</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">{students.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay usuarios registrados.</p> : students.map((student) => {
              const active = sanctions.filter((entry) => entry.user_id === student.id && entry.active);
              return <article key={student.id} className="rounded-xl border border-border bg-background/30 p-4">
                <div className="flex items-center justify-between gap-3"><strong className="truncate text-card-foreground">{student.username}</strong><span className={`text-lg font-extrabold ${trustTone(student.trust_points)}`}>{student.trust_points}</span></div>
                <p className="mt-1 text-xs text-muted-foreground">Builda ID: {student.builda_id}</p>
                {active.length > 0 && <p className="mt-2 text-xs font-bold text-destructive">{active.map((entry) => sanctionCopy[entry.type]).join(" · ")}</p>}
              </article>;
            })}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/85 p-5">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><Gavel className="text-accent"/>Sanciones</h2>
            <div className="mt-4 space-y-3">{sanctions.length === 0 ? <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">Sin sanciones registradas.</div> : sanctions.map((item) => <article key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/30 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><strong className="text-card-foreground">{students.find((entry) => entry.id === item.user_id)?.username ?? "Usuario"}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.active ? "bg-destructive/15 text-destructive" : "bg-secondary/60 text-muted-foreground"}`}>{sanctionCopy[item.type]}{item.active ? " activa" : " levantada"}</span></div>
                <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatMoment(item.created_at)}{item.expires_at ? ` · vence ${formatMoment(item.expires_at)}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleSanction(item)}>{item.active ? "Levantar" : "Reactivar"}</Button>
                <ConfirmDelete title="Eliminar sanción" description="Se borrará este registro del historial de sanciones." onConfirm={() => removeSanction(item)}><Button size="icon" variant="ghost" aria-label="Eliminar sanción"><Trash2/></Button></ConfirmDelete>
              </div>
            </article>)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card/85 p-5">
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><History className="text-accent"/>Historial de Trust Points</h2>
            <div className="mt-4 space-y-2">{trustEvents.length === 0 ? <div className="rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">Aún no hay cambios registrados.</div> : trustEvents.map((item) => <article key={item.id} className="flex items-start gap-3 rounded-xl border border-border bg-background/30 p-3">
              <span className={`min-w-14 text-center text-sm font-extrabold ${item.delta >= 0 ? "text-emerald-400" : "text-destructive"}`}>{item.delta > 0 ? "+" : ""}{item.delta}</span>
              <div className="min-w-0 flex-1">
                <strong className="text-sm text-card-foreground">{students.find((entry) => entry.id === item.user_id)?.username ?? "Usuario"}</strong>
                <p className="text-sm text-muted-foreground">{item.reason}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatMoment(item.created_at)} · saldo {item.balance_after} pts</p>
              </div>
            </article>)}</div>
          </div>
        </section>
      </TabsContent>
      <TabsContent value="students"><section className="rounded-xl border border-border bg-card/85 p-5"><h2 className="flex items-center gap-2 text-xl font-extrabold text-card-foreground"><GraduationCap className="text-accent"/>Directorio de estudiantes <span className="ml-auto text-sm text-muted-foreground">{students.length}</span></h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{students.map((student) => <article key={student.id} className="rounded-xl border border-border bg-background/30 p-4"><div className="flex items-center justify-between gap-3"><strong className="truncate text-card-foreground">{student.username}</strong><span className={`text-sm font-extrabold ${trustTone(student.trust_points)}`}>{student.trust_points} pts</span></div><p className="mt-1 text-xs text-muted-foreground">Builda ID: {student.builda_id}</p></article>)}</div></section></TabsContent>
    </Tabs>
  </AppShell>;
}