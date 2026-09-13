import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, Check, UserRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [
    { title: "Completa tu perfil | Builder Academy" },
    { name: "description", content: "Configura tu perfil de creador y tu cuenta de Builda." },
    { property: "og:title", content: "Perfil de creador | Builder Academy" },
    { property: "og:description", content: "Completa tu identidad de creador en Builder Academy." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}), component: Onboarding,
});

function Onboarding() {
  const { user } = Route.useRouteContext(); const navigate = useNavigate();
  const [username,setUsername]=useState(""); const [buildaId,setBuildaId]=useState(""); const [avatar,setAvatar]=useState<File|null>(null); const [preview,setPreview]=useState<string|null>(null); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  useEffect(()=>{ supabase.from("profiles").select("username, builda_id, avatar_path").eq("id",user.id).maybeSingle().then(({data})=>{ if(data){setUsername(data.username);setBuildaId(data.builda_id); if(data.avatar_path) supabase.storage.from("avatars").createSignedUrl(data.avatar_path,3600).then(({data:url})=>setPreview(url?.signedUrl??null));} }); },[user.id]);
  async function save(event: FormEvent){event.preventDefault();setBusy(true);setError("");let avatarPath: string|undefined;
    if(avatar){avatarPath=`${user.id}/avatar-${Date.now()}.${avatar.name.split(".").pop()??"jpg"}`;const {error:uploadError}=await supabase.storage.from("avatars").upload(avatarPath,avatar,{upsert:true});if(uploadError){setBusy(false);setError(uploadError.message);return;}}
    const payload={id:user.id,username:username.trim(),builda_id:buildaId.trim(),...(avatarPath?{avatar_path:avatarPath}:{})}; const {error:profileError}=await supabase.from("profiles").upsert(payload);setBusy(false);if(profileError){setError(profileError.message);return;}await navigate({to:"/dashboard"});}
  return <main className="motion-page flex min-h-screen items-center justify-center px-4 py-10"><section className="academy-panel motion-surface w-full max-w-xl rounded-xl border border-border bg-card/95 p-6 sm:p-10"><Brand className="mb-10"/><div className="mb-8"><span className="text-xs font-bold text-accent">PASO OBLIGATORIO</span><h1 className="mt-2 text-3xl font-extrabold text-card-foreground">Tu identidad de creador</h1><p className="mt-2 text-muted-foreground">Así te reconocerá la comunidad en cada clase.</p></div>
    <form onSubmit={save} className="motion-stagger space-y-5"><div className="flex items-center gap-5"><label className="motion-interactive relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-primary bg-secondary"><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e)=>{const f=e.target.files?.[0]??null;setAvatar(f);if(f)setPreview(URL.createObjectURL(f));}}/>{preview?<img src={preview} alt="Vista previa del avatar" className="motion-surface h-full w-full object-cover"/>:<Camera className="text-accent"/>}<span className="absolute bottom-1 right-1 rounded-full bg-primary p-1"><Check className="h-3 w-3"/></span></label><div><strong className="text-card-foreground">Foto de perfil</strong><p className="mt-1 text-sm text-muted-foreground">JPG, PNG o WebP. Máximo 5 MB.</p></div></div>
      <label className="block text-sm font-semibold text-card-foreground">Nombre de usuario<Input value={username} onChange={(e)=>setUsername(e.target.value)} required minLength={3} maxLength={30} placeholder="ej. NovaBuilder" className="mt-2 h-12 bg-background/50"/></label>
      <label className="block text-sm font-semibold text-card-foreground">ID de tu cuenta de Builda<Input value={buildaId} onChange={(e)=>setBuildaId(e.target.value)} required minLength={3} placeholder="Tu identificador en Builda" className="mt-2 h-12 bg-background/50"/></label>
      {error&&<p className="motion-notice text-sm text-destructive">{error}</p>}<Button disabled={busy} className="h-12 w-full text-base" type="submit"><UserRound/>{busy?"Guardando…":"Completar perfil"}</Button></form></section></main>;
}