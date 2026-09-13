import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, MessagesSquare, Shield, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { clearCachedAuthSession } from "@/lib/auth-session";
import { clearDataCache } from "@/lib/data-cache";

export function AppShell({ children, isAdmin = false, fullScreen = false }: { children: ReactNode; isAdmin?: boolean; fullScreen?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear(); clearCachedAuthSession(); clearDataCache(); await supabase.auth.signOut(); await navigate({ to: "/", replace: true });
  }
  return <div className={cn("min-h-screen", fullScreen && "fixed inset-0 flex h-dvh min-h-0 w-full flex-col overflow-hidden overscroll-none")}>
    <header className={cn("sticky top-0 z-40 shrink-0 border-b border-border bg-background/85 backdrop-blur-xl", fullScreen && "hidden sm:block")}><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link to="/dashboard" preload="intent" aria-label="Ir al panel"><Brand /></Link>
      <nav className="flex items-center gap-1">
        <Button asChild variant="ghost"><Link to="/dashboard" preload="intent" activeProps={{ className: "bg-accent text-accent-foreground" }}><LayoutDashboard /><span className="hidden sm:inline">Clases</span></Link></Button>
        <Button asChild variant="ghost"><Link to="/forum" preload="intent" activeProps={{ className: "bg-accent text-accent-foreground" }}><MessagesSquare /><span className="hidden sm:inline">Foro</span></Link></Button>
        {isAdmin && <Button asChild variant="ghost"><Link to="/admin" preload="intent" activeProps={{ className: "bg-accent text-accent-foreground" }}><Shield /><span className="hidden sm:inline">Administración</span></Link></Button>}
        <Button asChild variant="ghost"><Link to="/onboarding" preload="intent" activeProps={{ className: "bg-accent text-accent-foreground" }}><UserRound /><span className="hidden sm:inline">Perfil</span></Link></Button>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut /></Button>
      </nav>
    </div></header>
    <main className={cn("motion-page w-full", fullScreen ? "h-full min-h-0 flex-1 overflow-hidden" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12")}>{children}</main>
  </div>;
}