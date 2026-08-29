import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProspects, useCommissions, prospectStatusLabel } from "@/hooks/useCommercial";

const db = supabase as any;

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

const SalesRepsManager = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    zone: "50 km autour d'Abbaretz (44170)",
    commission_percent: 10,
  });

  const { data: reps, isLoading } = useQuery({
    queryKey: ["sales-reps"],
    queryFn: async () => {
      const { data, error } = await db.from("sales_reps").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { prospects } = useProspects();
  const { commissions } = useCommissions();

  const createRep = useMutation({
    mutationFn: async () => {
      const email = form.email.trim().toLowerCase();
      const { data: profile, error: pErr } = await db
        .from("profiles")
        .select("id, full_name, email")
        .eq("email", email)
        .maybeSingle();
      if (pErr) throw pErr;
      if (!profile)
        throw new Error(
          "Aucun compte avec cet email. Demande-lui de créer son compte sur le site, puis réessaie."
        );

      const { error: rErr } = await db
        .from("user_roles")
        .insert({ user_id: profile.id, role: "commercial" });
      if (rErr && !rErr.message?.includes("duplicate")) throw rErr;

      const { error } = await db.from("sales_reps").insert({
        user_id: profile.id,
        full_name: form.full_name.trim() || profile.full_name || email,
        email,
        phone: form.phone || null,
        zone: form.zone || null,
        commission_percent: Number(form.commission_percent),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-reps"] });
      setForm({ ...form, email: "", full_name: "", phone: "" });
      toast({ title: "Commercial ajouté" });
    },
    onError: (e: Error) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const removeRep = useMutation({
    mutationFn: async (rep: any) => {
      const { error } = await db.from("sales_reps").delete().eq("id", rep.id);
      if (error) throw error;
      await db.from("user_roles").delete().eq("user_id", rep.user_id).eq("role", "commercial");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-reps"] });
      toast({ title: "Commercial retiré" });
    },
    onError: (e: Error) =>
      toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold gold-text">Commerciaux terrain</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Donne l'accès à l'espace commercial (/commercial) et suis le démarchage de chaque
          commercial.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajouter un commercial</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Email du compte *</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="commercial@exemple.fr"
            />
          </div>
          <div>
            <Label>Nom affiché</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Téléphone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label>Secteur</Label>
            <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
          </div>
          <div>
            <Label>Commission (% du CA HT)</Label>
            <Input
              type="number"
              step="0.5"
              value={form.commission_percent}
              onChange={(e) =>
                setForm({ ...form, commission_percent: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => createRep.mutate()}
              disabled={!form.email.trim() || createRep.isPending}
            >
              {createRep.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(reps ?? []).map((rep: any) => {
            const myProspects = prospects.filter((p) => p.rep_id === rep.id);
            const myCommissions = commissions.filter((c) => c.rep_id === rep.id);
            const due = myCommissions
              .filter((c) => c.status !== "paid")
              .reduce((s, c) => s + Number(c.commission_amount), 0);
            return (
              <Card key={rep.id}>
                <CardContent className="pt-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{rep.full_name}</p>
                      <p className="text-xs text-muted-foreground">{rep.email}</p>
                      {rep.zone && <p className="text-xs text-muted-foreground">{rep.zone}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRep.mutate(rep)}
                      aria-label="Retirer le commercial"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="secondary">{Number(rep.commission_percent)} % CA HT</Badge>
                    <Badge variant="secondary">{myProspects.length} prospects</Badge>
                    <Badge variant="secondary">
                      {myProspects.filter((p) => p.status === "signe").length} signés
                    </Badge>
                    <Badge className="bg-amber-500/15 text-amber-300">À verser {euro(due)}</Badge>
                  </div>
                  {myProspects.slice(0, 4).map((p) => (
                    <p key={p.id} className="text-xs text-muted-foreground">
                      · {p.business_name} — {prospectStatusLabel(p.status)}
                    </p>
                  ))}
                </CardContent>
              </Card>
            );
          })}
          {(reps ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun commercial pour le moment.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SalesRepsManager;
