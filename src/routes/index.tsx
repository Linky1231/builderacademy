import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Boxes, GraduationCap, Radio, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Builder Academy | Aprende a crear en Builda" },
    { name: "description", content: "Academia online para dominar Builda con clases, comunidad y aprendizaje en vivo." },
    { property: "og:title", content: "Builder Academy | Aprende a crear en Builda" },
    { property: "og:description", content: "Clases y comunidad para construir experiencias increíbles en Builda." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user) void navigate({ to: "/dashboard" }); }); }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setNotice("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (result.error) return setNotice(result.error.message);
    if (mode === "signup" && !result.data.session) return setNotice("Revisa tu correo para confirmar la cuenta.");
    await navigate({ to: "/dashboard" });
  }

  async function google() {
    setBusy(true); setNotice("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin, extraParams: { prompt: "select_account" } });
    if (result.error) { setBusy(false); setNotice(result.error.message); return; }
    if (!result.redirected) await navigate({ to: "/dashboard" });
  }

  return <main className="relative min-h-screen overflow-hidden">
    <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
      <section className="max-w-2xl py-8">
        <Brand className="mb-16" />
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-bold text-accent"><span className="h-2 w-2 rounded-full bg-emerald-400" /> CREA. PUBLICA. CRECE.</div>
        <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.05] text-card-foreground sm:text-7xl">Construye mundos.<br/><span className="text-accent">Conviértete en creador.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">Domina Builda con clases prácticas, sesiones en vivo y una comunidad que convierte ideas en experiencias jugables.</p>
        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
          {[{icon:GraduationCap,n:"Rutas",t:"guiadas"},{icon:Radio,n:"Clases",t:"en vivo"},{icon:Users,n:"Comunidad",t:"activa"}].map(({icon:Icon,n,t}) => <div key={n} className="rounded-2xl border border-border bg-card/70 p-4"><Icon className="mb-3 text-accent"/><strong className="block text-card-foreground">{n}</strong><span className="text-xs text-muted-foreground">{t}</span></div>)}
        </div>
      </section>

      <section className="academy-panel relative rounded-[24px] border border-border bg-card/95 p-6 sm:p-8">
        <div className="mb-7 flex items-center gap-3"><div className="ice-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary"><Boxes className="text-accent"/></div><div><h2 className="text-2xl font-extrabold text-card-foreground">{mode === "login" ? "Continúa creando" : "Empieza tu camino"}</h2><p className="text-sm text-muted-foreground">Tu próxima gran idea comienza aquí.</p></div></div>
        <Button onClick={google} disabled={busy} variant="outline" className="h-12 w-full border-primary text-accent hover:bg-secondary hover:text-card-foreground"><span className="text-lg font-bold">G</span> Continuar con Google</Button>
        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border"/>O CON CORREO<span className="h-px flex-1 bg-border"/></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold text-card-foreground">Correo<Input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required placeholder="tu@correo.com" className="mt-2 h-12 bg-background/50" /></label>
          <label className="block text-sm font-semibold text-card-foreground">Contraseña<Input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" minLength={6} required placeholder="Mínimo 6 caracteres" className="mt-2 h-12 bg-background/50" /></label>
          {notice && <p role="status" className="rounded-xl border border-border bg-secondary/40 p-3 text-sm text-foreground">{notice}</p>}
          <Button disabled={busy} type="submit" className="h-12 w-full text-base">{busy ? "Procesando…" : mode === "login" ? "Entrar a la academia" : "Crear mi cuenta"}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "¿Aún no tienes cuenta?" : "¿Ya eres parte?"} <button type="button" onClick={()=>setMode(mode === "login" ? "signup" : "login")} className="font-bold text-accent hover:underline">{mode === "login" ? "Regístrate" : "Inicia sesión"}</button></p>
      </section>
    </div>
  </main>;
}