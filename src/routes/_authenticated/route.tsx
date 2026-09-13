import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getCachedAuthSession } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = await getCachedAuthSession();
    if (!session) throw redirect({ to: "/" });
    return session;
  },
  component: () => <Outlet />,
});