import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Champ du tunnel de commande : libellé relié, aide et erreur annoncées (aria-describedby + région polie),
// zone tactile de 44 px, texte 16 px sur mobile (pas de zoom automatique sur iPhone).

interface CheckoutFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string | null;
  hint?: ReactNode;
  optional?: boolean;
  /** Élément posé à droite dans le champ (ex. bouton afficher le mot de passe). */
  trailing?: ReactNode;
}

export const CheckoutField = forwardRef<HTMLInputElement, CheckoutFieldProps>(
  ({ id, label, error, hint, optional, trailing, className, ...inputProps }, ref) => {
    const hintId = hint ? `${id}-aide` : undefined;
    const errorId = `${id}-erreur`;
    const describedBy = error ? errorId : hintId;

    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-medium tracking-wide text-[color:var(--mn-ivoire-2)]">
          {label}
          {optional && <span className="font-normal text-muted-foreground"> (facultatif)</span>}
        </label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-required={optional ? undefined : true}
            aria-describedby={describedBy}
            className={cn(
              "h-11 rounded-[2px] bg-black/40 border-[color:var(--mn-ligne)] focus-visible:ring-1 focus-visible:ring-[color:var(--mn-or-clair)] focus-visible:ring-offset-0",
              trailing && "pr-12",
              error && "border-red-400/80",
              className,
            )}
            {...inputProps}
          />
          {trailing && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{trailing}</div>}
        </div>
        <div aria-live="polite">
          {error && (
            <p id={errorId} className="flex items-start gap-1.5 text-xs text-red-400">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="text-[11px] leading-snug text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  },
);
CheckoutField.displayName = "CheckoutField";
