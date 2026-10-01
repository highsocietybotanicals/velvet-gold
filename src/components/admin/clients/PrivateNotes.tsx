import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomerNote, useCustomerNote } from "@/hooks/useCustomers";

type State = "idle" | "saving" | "saved" | "error";

/** Private notes with an 800 ms debounced upsert on the canonical key. */
const PrivateNotes = ({ canonicalKey, allKeys }: { canonicalKey: string; allKeys: string[] }) => {
  const { data, isLoading } = useCustomerNote(allKeys);
  const [value, setValue] = useState("");
  const [state, setState] = useState<State>("idle");
  const loaded = useRef(false);
  const timer = useRef<number>();

  useEffect(() => {
    if (!isLoading && !loaded.current) { setValue(data ?? ""); loaded.current = true; }
  }, [data, isLoading]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onChange = (v: string) => {
    setValue(v);
    setState("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try { await saveCustomerNote(canonicalKey, v); setState("saved"); }
      catch { setState("error"); }
    }, 800);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="crm-notes" className="font-display text-lg">Notes privées</label>
        <span aria-live="polite" className={state === "error" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré" : state === "error" ? "Erreur d'enregistrement" : ""}
        </span>
      </div>
      <Textarea id="crm-notes" rows={5} disabled={isLoading} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Préférences, horaires, remarques…" />
    </div>
  );
};

export default PrivateNotes;
