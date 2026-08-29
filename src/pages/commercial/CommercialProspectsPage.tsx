import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Phone, Mail, MapPin } from "lucide-react";
import {
  useMyRep,
  useAllReps,
  useProspects,
  PROSPECT_STATUSES,
  prospectStatusLabel,
  ProspectStatus,
} from "@/hooks/useCommercial";
import { useAuth } from "@/contexts/AuthContext";

const emptyForm = {
  business_name: "",
  contact_name: "",
  city: "",
  postal_code: "",
  address: "",
  phone: "",
  email: "",
  status: "a_visiter" as ProspectStatus,
  next_followup: "",
  notes: "",
};

const statusColor: Record<string, string> = {
  a_visiter: "bg-muted text-muted-foreground",
  visite: "bg-blue-500/15 text-blue-300",
  echantillon: "bg-amber-500/15 text-amber-300",
  negociation: "bg-purple-500/15 text-purple-300",
  signe: "bg-emerald-500/15 text-emerald-300",
  refuse: "bg-red-500/15 text-red-300",
};

const CommercialProspectsPage = () => {
  const { isAdmin } = useAuth();
  const { data: rep } = useMyRep();
  const { data: allReps = [] } = useAllReps(isAdmin);
  const [selectedRepId, setSelectedRepId] = useState<string>("");

  // Le commercial voit ses prospects ; l'admin voit tout (ou filtre sur un commercial)
  const { prospects, isLoading, createProspect, updateProspect, deleteProspect } = useProspects(
    isAdmin && !rep ? selectedRepId || undefined : rep?.id
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<string>("all");
  const [emailError, setEmailError] = useState("");

  // Commercial cible pour la création : sa propre fiche, sinon celle choisie par l'admin
  const targetRepId = rep?.id ?? selectedRepId;
  const canCreate = !!targetRepId;

  const filtered = useMemo(
    () => (filter === "all" ? prospects : prospects.filter((p) => p.status === filter)),
    [prospects, filter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    prospects.forEach((p) => (c[p.status] = (c[p.status] ?? 0) + 1));
    return c;
  }, [prospects]);

  const submit = async () => {
    if (!targetRepId || !form.business_name.trim()) return;
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Un email valide est obligatoire : il sert à créer l'accès pro du buraliste.");
      return;
    }
    setEmailError("");
    await createProspect.mutateAsync({
      ...form,
      email,
      next_followup: form.next_followup || null,
      rep_id: targetRepId,
    } as any);
    setForm(emptyForm);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold gold-text">
            {rep ? "Mes prospects" : "Prospects"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi du démarchage terrain : bureaux de tabac, CBD shops, épiceries fines.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} disabled={!canCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nouveau prospect
        </Button>
      </div>

      {!rep && isAdmin && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label>Commercial concerné</Label>
            {allReps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun commercial enregistré : crée-le d'abord dans Admin → Commerciaux.
              </p>
            ) : (
              <Select value={selectedRepId} onValueChange={setSelectedRepId}>
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Choisir un commercial" />
                </SelectTrigger>
                <SelectContent>
                  {allReps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      )}

      {!rep && !isAdmin && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Aucune fiche commerciale n'est rattachée à ton compte : un administrateur doit la créer
            avant de pouvoir enregistrer des prospects.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Badge
          onClick={() => setFilter("all")}
          className="cursor-pointer bg-primary/15 text-primary"
        >
          Tous ({prospects.length})
        </Badge>
        {PROSPECT_STATUSES.map((s) => (
          <Badge
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`cursor-pointer ${statusColor[s.value]}`}
          >
            {s.label} ({counts[s.value] ?? 0})
          </Badge>
        ))}
      </div>

      {open && canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter un prospect</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Enseigne *</Label>
              <Input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                placeholder="Tabac Presse du Centre"
              />
            </div>
            <div>
              <Label>Contact</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <Label>Code postal</Label>
              <Input
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@tabac-du-centre.fr"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obligatoire : un compte pro est créé automatiquement et les identifiants sont
                envoyés à cette adresse.
              </p>
              {emailError && <p className="text-xs text-destructive mt-1">{emailError}</p>}
            </div>
            <div>
              <Label>Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as ProspectStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROSPECT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Relance prévue</Label>
              <Input
                type="date"
                value={form.next_followup}
                onChange={(e) => setForm({ ...form, next_followup: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Échantillons remis, objections, horaires du gérant…"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={submit} disabled={createProspect.isPending}>
                {createProspect.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun prospect pour ce filtre.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.business_name}</p>
                    {p.contact_name && (
                      <p className="text-xs text-muted-foreground">{p.contact_name}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteProspect.mutate(p.id)}
                    aria-label="Supprimer le prospect"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {(p.city || p.postal_code) && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.postal_code} {p.city}
                    </p>
                  )}
                  {p.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <a href={`tel:${p.phone}`} className="hover:text-foreground">
                        {p.phone}
                      </a>
                    </p>
                  )}
                  {p.email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${p.email}`} className="hover:text-foreground">
                        {p.email}
                      </a>
                    </p>
                  )}
                  {p.next_followup && <p>Relance : {new Date(p.next_followup).toLocaleDateString("fr-FR")}</p>}
                  {p.notes && <p className="italic">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge className={statusColor[p.status]}>{prospectStatusLabel(p.status)}</Badge>
                  <Select
                    value={p.status}
                    onValueChange={(v) => updateProspect.mutate({ id: p.id, status: v as ProspectStatus })}
                  >
                    <SelectTrigger className="h-8 w-[190px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROSPECT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommercialProspectsPage;
