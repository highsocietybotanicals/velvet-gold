// Espace commercial : la rangée de panneaux de signalisation (navigation).
// Visuel uniquement : sur téléphone, la rangée défile pour montrer le panneau de la page ouverte.
import { useEffect, useRef, type ReactNode } from "react";

const SignRow = ({ children }: { children: ReactNode }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    const on = row?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!row || !on) return;
    const r = row.getBoundingClientRect();
    const o = on.getBoundingClientRect();
    if (o.left < r.left || o.right > r.right) row.scrollLeft += o.left - r.left - 16;
  }, []);

  return (
    <nav className="cm-roadway" aria-label="Espace commercial">
      <div ref={rowRef} className="cm-signs">
        {children}
      </div>
    </nav>
  );
};

export default SignRow;
