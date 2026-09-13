import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Calendar, Clock, Radio, Shield, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatClassDate, statusCopy, type AcademyClass, type Profile } from "@/lib/academy";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [
    { title: "Mis clases | Builder Academy" },
    { name: "description", content: "Explora tus clases disponibles y sesiones en vivo de Builder Academy." },
    { property: "og:title", content: "Mis clases | Builder Academy" },
    { property: "og:description", content: "Aprende a construir en Builda con tus clases y sesiones en vivo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}), component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext(); const navigate = useNavigate();
  const [classes,setClasses]=useState<AcademyClass[]>([]); const [profile,setProfile]=useState<Profile|null>(null); const [isAdmin,setIsAdmin]=useState(false); const [loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([supabase.from("profiles").select("*").eq("id",user.id).maybeSingle(),supabase.from("user_roles").select("role").eq("user_id",user.id),supabase.from("classes").select("*").order("scheduled_at",{ascending:true,nullsFirst:false})]).then(([p,r,c])=>{if(!p.data){void navigate({to:"/onboarding"});return;}setProfile(p.data);setIsAdmin(r.data?.some(x=>x.role==="admin")??false);setClasses(c.data??[]);setLoading(false);});},[navigate,user.id]);
  return <AppShell isAdmin={isAdmin}><section className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="text-xs font-bold text-accent">CENTRO DE APRENDIZAJE</span><h1 className="mt-2 text-4xl font-extrabold text-card-foreground">Hola, {profile?.username ?? "builder"}</h1><p className="mt-2 text-muted-foreground">Elige una clase y sigue construyendo.</p></div>{isAdmin&&<Button asChild variant="outline"><Link to="/admin"><Shield/>Gestionar academia</Link></Button>}</section>
    {loading?<div className="py-24 text-center text-muted-foreground">Cargando tus clases…</div>:classes.length===0?<div className="academy-panel rounded-xl border border-border bg-card/80 px-6 py-20 text-center"><BookOpen className="mx-auto mb-4 h-10 w-10 text-accent"/><h2 className="text-xl font-bold text-card-foreground">Pronto habrá nuevas clases</h2><p className="mt-2 text-muted-foreground">Vuelve pronto para descubrir el próximo reto.</p></div>:<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{classes.map((item)=>{const status=statusCopy[item.status];return <article key={item.id} className="academy-panel group overflow-hidden rounded-xl border border-border bg-card/90"><div className="relative aspect-[16/8] overflow-hidden bg-secondary"><div className="absolute inset-0 grid place-items-center opacity-45 transition-opacity duration-300 group-hover:opacity-65 motion-reduce:transition-none"><BookOpen className="h-16 w-16 text-accent transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"/></div><div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs font-bold text-card-foreground backdrop-blur"><span className={`h-2 w-2 rounded-full ${status.dot}`}/>{status.label}</div></div><div className="p-5"><p className="text-xs font-bold uppercase text-accent">{item.category}</p><h2 className="mt-2 text-xl font-extrabold text-card-foreground">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p><div className="mt-5 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/>{formatClassDate(item.scheduled_at)}</span><span className="flex items-center gap-1.5"><Clock className="h-4 w-4"/>{item.duration_minutes} min</span></div><Button asChild disabled={item.status==="closed"} className="mt-6 w-full"><Link to="/class/$id" params={{id:item.id}}>{item.status==="live"?<Radio/>:<UserRound/>}{item.status==="live"?"Entrar en vivo":item.status==="closed"?"Clase cerrada":"Abrir clase"}</Link></Button></div></article>})}</div>}
  </AppShell>;
}