import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const ProPartnerApplyForm = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: profile?.company_name ?? "",
    siret: profile?.siret ?? "",
    vat_number: profile?.vat_number ?? "",
    address_line1: profile?.address_line1 ?? "",
    postal_code: profile?.postal_code ?? "",
    city: profile?.city ?? "",
    phone: profile?.phone ?? "",
    full_name: profile?.full_name ?? "",
    notes: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { notes, ...profileFields } = form;
      const { error } = await updateProfile(profileFields as any);
      if (error) throw error;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "pro" as const });
      // 23505 = déjà pro, on ignore
      if (roleError && (roleError as any).code !== "23505") throw roleError;

      await refreshProfile();
      toast({
        title: "Demande envoyée",
        description: "Ton compte partenaire sera validé sous 24 à 48 h ouvrées.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message ?? "Impossible d'envoyer la demande.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Devenir partenaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Crée ton compte professionnel pour accéder à la grille tarifaire revendeur.
          </p>
          <Button asChild>
            <Link to="/auth">Créer un compte pro</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dossier partenaire</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Raison sociale</Label>
            <Input value={form.company_name} onChange={set("company_name")} required />
          </div>
          <div className="space-y-1.5">
            <Label>SIRET (14 chiffres)</Label>
            <Input value={form.siret} onChange={set("siret")} required />
          </div>
          <div className="space-y-1.5">
            <Label>N° TVA intracommunautaire</Label>
            <Input value={form.vat_number} onChange={set("vat_number")} placeholder="FR12345678901" required />
          </div>
          <div className="space-y-1.5">
            <Label>Contact</Label>
            <Input value={form.full_name} onChange={set("full_name")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Adresse</Label>
            <Input value={form.address_line1} onChange={set("address_line1")} />
          </div>
          <div className="space-y-1.5">
            <Label>Code postal</Label>
            <Input value={form.postal_code} onChange={set("postal_code")} />
          </div>
          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input value={form.city} onChange={set("city")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Message (facultatif)</Label>
            <Textarea value={form.notes} onChange={set("notes")} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Envoyer ma demande
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProPartnerApplyForm;
