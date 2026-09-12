import mark from "@/assets/builder-academy-mark.png";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-3", className)}>
    <img src={mark} alt="Símbolo de Builder Academy" width={816} height={816} className="h-11 w-11 object-contain" />
    {!compact && <div className="leading-none"><strong className="block text-base font-extrabold text-card-foreground">BUILDER</strong><span className="text-xs font-bold text-accent">ACADEMY</span></div>}
  </div>;
}