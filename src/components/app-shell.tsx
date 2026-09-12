import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Shield, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/", replace: true });
  }
  return <div className="min-h-screen">
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl"><div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
      <Link to="/dashboard" aria-label="Ir al panel"><Brand /></Link>
      <nav className="flex items-center gap-1">
        <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/dashboard"><LayoutDashboard />Clases</Link></Button>
        {isAdmin && <Button asChild variant="ghost"><Link to="/admin"><Shield /><span className="hidden sm:inline">Administración</span></Link></Button>}
        <Button asChild variant="ghost"><Link to="/onboarding"><UserRound /><span className="hidden sm:inline">Perfil</span></Link></Button>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut /></Button>
      </nav>
    </div></header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
  </div>;
}