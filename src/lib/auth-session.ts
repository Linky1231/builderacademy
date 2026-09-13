import { supabase } from "@/integrations/supabase/client";

type AuthSession = {
  user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>;
  isAdmin: boolean;
};

let cachedSession: Promise<AuthSession | null> | null = null;

export function getCachedAuthSession() {
  if (!cachedSession) {
    cachedSession = (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      return {
        user: data.user,
        isAdmin: roles?.some((entry) => entry.role === "admin") ?? false,
      };
    })();
  }

  return cachedSession;
}

export function clearCachedAuthSession() {
  cachedSession = null;
}