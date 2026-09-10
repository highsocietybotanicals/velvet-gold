import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailX } from "lucide-react";

type Status = "checking" | "valid" | "invalid" | "submitting" | "success";

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      try {
        const response = await fetch(
          `${baseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey } }
        );
        setStatus(response.ok ? "valid" : "invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    const { error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setStatus(error ? "invalid" : "success");
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-primary/30">
        <CardHeader className="text-center">
          <MailX className="mx-auto h-8 w-8 text-primary" />
          <CardTitle className="gold-text">Préférences email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          {status === "checking" && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
          {status === "valid" && (
            <>
              <p className="text-sm text-muted-foreground">Confirmez-vous ne plus vouloir recevoir nos emails d’information ?</p>
              <Button variant="destructive" onClick={confirm}>Confirmer la désinscription</Button>
            </>
          )}
          {status === "submitting" && <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />}
          {status === "success" && <p className="text-sm">Votre désinscription a bien été enregistrée.</p>}
          {status === "invalid" && <p className="text-sm text-muted-foreground">Ce lien est invalide ou a déjà été utilisé.</p>}
          <Button asChild variant="outline"><Link to="/">Retour au site</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default UnsubscribePage;