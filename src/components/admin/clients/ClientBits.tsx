import { cn } from "@/lib/utils";
import { initials, type CustomerStatus } from "@/lib/customers";

const STATUS_STYLE: Record<CustomerStatus, string> = {
  "À l'heure": "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
  Bientôt: "border-gold/50 text-gold bg-gold/10",
  "À relancer": "border-orange-500/50 text-orange-300 bg-orange-500/10",
  Nouveau: "border-sky-500/40 text-sky-300 bg-sky-500/10",
  Endormi: "border-border text-muted-foreground bg-muted/30",
};

export const StatusPill = ({ status, className }: { status: CustomerStatus; className?: string }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", STATUS_STYLE[status], className)}>
    {status}
  </span>
);

export const ResellerBadge = () => (
  <span className="inline-flex items-center rounded-full border border-gold/40 px-2 py-0.5 text-[11px] text-gold whitespace-nowrap">
    Profil revendeur ?
  </span>
);

export const Avatar = ({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) => (
  <span
    aria-hidden
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/5 font-display text-gold",
      size === "lg" ? "h-20 w-20 text-2xl" : "h-10 w-10 text-sm"
    )}
  >
    {initials(name)}
  </span>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted/40", className)} />
);

export const ErrorBox = ({ error }: { error: Error }) => (
  <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
    Impossible de charger les clients : {error.message}
  </div>
);
