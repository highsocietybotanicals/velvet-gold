import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMyRep, useAllReps, useProspects } from "@/hooks/useCommercial";
import { VAT_RATE, PRO_FORMATS, proPricePerGram } from "@/lib/proPricing";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";

interface Line {
  designation: string;
  format_g: string;
  quantity: string;
  unit_price_ht: string;
}

const emptyLine: Line = { designation: "", format_g: "10", quantity: "1", unit_price_ht: "" };
const BANK_KEY = "hsb-bank-details";
const eur = (n: number) => `${n.toFixed(2)} €`;

const CommercialFacturationPage = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const { data: rep } = useMyRep();
  const { data: allReps = [] } = useAllReps(isAdmin);
  const { prospects } = useProspects(rep?.id);
  const { all: catalog } = useCatalogProducts();
  const { tiers } = useProPriceTiers();
  const [pickedProduct, setPickedProduct] = useState<string>("");

  const [repId, setRepId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }]);
  const [dueDays, setDueDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [bank, setBank] = useState({ holder: "High Society Botanicals", iban: "", bic: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ orderNumber: string; url?: string; emailSent: boolean } | null>(
    null
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BANK_KEY);
      if (saved) setBank((b) => ({ ...b, ...JSON.parse(saved) }));
    } catch {
      /* ignore */
    }
  }, []);

  const totals = useMemo(() => {
    let ht = 0;
    let grams = 0;
    lines.forEach((l) => {
      const g = (Number(l.format_g) || 0) * (Number(l.quantity) || 0);
      grams += g;
      ht += g * (Number(l.unit_price_ht) || 0);
    });
    ht = Math.round(ht * 100) / 100;
    const tva = Math.round(ht * (VAT_RATE / 100) * 100) / 100;
    return { ht, tva, ttc: Math.round((ht + tva) * 100) / 100, grams: Math.round(grams * 100) / 100 };
  }, [lines]);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({ title: "Email client invalide", variant: "destructive" });
      return;
    }
    if (!bank.iban.replace(/\s/g, "")) {
      toast({ title: "IBAN manquant", description: "Renseigne l'IBAN de règlement.", variant: "destructive" });
      return;
    }
    if (totals.ht <= 0) {
      toast({ title: "Facture vide", description: "Ajoute au moins une ligne valide.", variant: "destructive" });
      return;
    }

    setSending(true);
    setResult(null);
    try {
      localStorage.setItem(BANK_KEY, JSON.stringify(bank));
      const { data, error } = await supabase.functions.invoke("commercial-invoice", {
        body: {
          email: email.trim().toLowerCase(),
          rep_id: rep?.id ?? repId ?? null,
          due_days: Number(dueDays) || 30,
          notes,
          holder: bank.holder,
          iban: bank.iban,
          bic: bank.bic,
          lines: lines.map((l) => ({
            designation: l.designation,
            format_g: Number(l.format_g) || 0,
            quantity: Number(l.quantity) || 0,
            unit_price_ht: Number(l.unit_price_ht) || 0,
          })),
        },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      const d = data as any;
      const url = d.pdfBase64 ? `data:application/pdf;base64,${d.pdfBase64}` : undefined;
      setResult({ orderNumber: d.orderNumber, url, emailSent: !!d.emailSent });
      toast({
        title: `Facture ${d.orderNumber} émise`,
        description: d.emailSent
          ? "Envoyée par email et disponible dans l'espace pro du client."
          : "Disponible dans l'espace pro du client, mais l'email n'a pas pu être envoyé.",
      });
      setLines([{ ...emptyLine }]);
      setNotes("");
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gold-text">Facturation partenaire</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Émets une facture pro : le PDF part par email et s'affiche dans l'espace pro du buraliste,
          payable par virement avec le numéro de facture en libellé.
        </p>
      </div>

      {result && (
        <Card className="border-primary/40">
          <CardContent className="pt-6 flex flex-wrap items-center gap-4">
            <FileText className="h-5 w-5 text-gold" />
            <div className="text-sm">
              <p className="font-medium">Facture {result.orderNumber}</p>
              <p className="text-muted-foreground">
                Libellé de virement à indiquer : <span className="text-gold">{result.orderNumber}</span>
                {result.emailSent ? " · email envoyé" : " · email non envoyé"}
              </p>
            </div>
            {result.url && (
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <a href={result.url} download={`${result.orderNumber}.pdf`}>
                  <Download className="h-4 w-4 mr-2" /> Télécharger le PDF
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client professionnel</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Email du compte pro *</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@tabac-du-centre.fr"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Le compte pro doit déjà exister (créé automatiquement à l'ajout du prospect).
            </p>
          </div>
          {prospects.length > 0 && (
            <div>
              <Label>Reprendre un prospect</Label>
              <Select value="" onValueChange={(v) => setEmail(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir dans mes prospects" />
                </SelectTrigger>
                <SelectContent>
                  {prospects
                    .filter((p) => p.email)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.email!}>
                        {p.business_name} — {p.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!rep && isAdmin && allReps.length > 0 && (
            <div>
              <Label>Commercial à commissionner</Label>
              <Select value={repId} onValueChange={setRepId}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  {allReps.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Échéance (jours)</Label>
            <Input value={dueDays} onChange={(e) => setDueDays(e.target.value)} inputMode="numeric" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lignes de facture (prix HT au gramme)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-12 items-end">
              <div className="sm:col-span-5">
                <Label className="text-xs">Désignation</Label>
                <Input
                  value={l.designation}
                  onChange={(e) => setLine(i, { designation: e.target.value })}
                  placeholder="911 OG — Force Noire"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Format (g)</Label>
                <Input
                  value={l.format_g}
                  onChange={(e) => setLine(i, { format_g: e.target.value })}
                  inputMode="decimal"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Quantité</Label>
                <Input
                  value={l.quantity}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                  inputMode="numeric"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">PU HT /g</Label>
                <Input
                  value={l.unit_price_ht}
                  onChange={(e) => setLine(i, { unit_price_ht: e.target.value })}
                  inputMode="decimal"
                  placeholder="5.00"
                />
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setLines((ls) => [...ls, { ...emptyLine }])}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter une ligne
          </Button>

          <div className="border-t border-border/50 pt-3 text-sm space-y-1">
            <p className="text-muted-foreground">Poids total : {totals.grams} g</p>
            <p>Total HT : {eur(totals.ht)}</p>
            <p className="text-muted-foreground">TVA {VAT_RATE} % : {eur(totals.tva)}</p>
            <p className="text-lg font-semibold gold-text">Total TTC : {eur(totals.ttc)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coordonnées bancaires (virement)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Titulaire</Label>
            <Input value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} />
          </div>
          <div>
            <Label>IBAN *</Label>
            <Input
              value={bank.iban}
              onChange={(e) => setBank({ ...bank, iban: e.target.value })}
              placeholder="FR76 3000 4000 0300 0000 0000 000"
            />
          </div>
          <div>
            <Label>BIC</Label>
            <Input value={bank.bic} onChange={(e) => setBank({ ...bank, bic: e.target.value })} />
          </div>
          <div className="sm:col-span-3">
            <Label>Note sur la facture (facultatif)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Livraison en main propre par votre commercial, échantillons offerts…"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={sending}>
          {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Émettre et envoyer la facture
        </Button>
      </div>
    </div>
  );
};

export default CommercialFacturationPage;
