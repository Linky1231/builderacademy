import logo from "@/assets/builder-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-3", className)}>
    <img src={logo.url} alt="Logo de Builder Academy" width={768} height={768} className="motion-logo h-11 w-11 rounded-xl object-cover" />
    {!compact && <div className="leading-none"><strong className="block text-base font-extrabold text-card-foreground">BUILDER</strong><span className="text-xs font-bold text-accent">ACADEMY</span></div>}
  </div>;
}