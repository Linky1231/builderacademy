import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AcademyClass = Tables<"classes">;
export type Profile = Tables<"profiles">;
export type AcademyMessage = Tables<"messages">;

export async function getSignedAsset(bucket: string, path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export function formatClassDate(value: string | null) {
  if (!value) return "A tu ritmo";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export const statusCopy = {
  live: { label: "En vivo", dot: "bg-red-400", description: "Únete ahora" },
  available: { label: "Disponible", dot: "bg-emerald-400", description: "Lista para aprender" },
  closed: { label: "Cerrada", dot: "bg-muted-foreground", description: "Sesión finalizada" },
} as const;