import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProCart } from "@/contexts/ProCartContext";
import { useProCartTotals, useProSettings } from "@/hooks/useProCartTotals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProTierBar from "@/components/pro/ProTierBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Trash2 } from "lucide-react";

const eur = (n: number) => `${n.toFixed(2)} €`;

const ProCartPage = () => {
  const { lines, setUnits, clearProCart } = useProCart();
  const { totals, isLoading } = useProCartTotals();
  const { data: settings } = useProSettings();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"transfer" | "physical" | "quote">("transfer");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const franco = settings?.franco_port_seuil_ht ?? 300;
  const delai = settings?.delai_paiement_jours ?? 30;

  const submit = async () => {
    if (!user || totals.lines.length === 0) return;
    setSubmitting(true);
    try {
      if (mode === "quote") {
        const { error } = await (supabase as any).from("pro_quotes").insert({
          user_id: user.id,
          company_name: profile?.company_name ?? null,
          contact_email: profile?.email ?? null,
          items: totals.lines,
          total_weight_g: totals.totalWeightG,
          total_ht: totals.totalHT,
          total_ttc: totals.totalTTC,
          notes: notes || null,
        });
        if (error) throw error;
        clearProCart();
        toast({
          title: "Demande de devis envoyée",
          description: "Tu recevras une proforma après validation.",
        });
        navigate("/pro/commandes");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-pro-order", {
        body: {
          lines: lines.filter((l) => l.units > 0),
          paymentMethod: mode,
          notes,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      clearProCart();

      toast({
        title: "Commande enregistrée",
        description:
          mode === "transfer"
            ? `Facture à ${delai} jours — règlement par virement.`
            : "Règlement par TPE à la remise — le paiement sera validé par HSB.",
      });
      navigate("/pro/commandes");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message ?? "Impossible de valider la commande.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (totals.lines.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-muted-foreground">Ton panier professionnel est vide.</p>
        <Button onClick={() => navigate("/pro/catalogue")}>Voir le catalogue</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold gold-text">Panier professionnel</h1>

      <ProTierBar
        totalWeightG={totals.totalWeightG}
        currentTierMaxG={totals.currentTierMaxG}
        gramsToNextTier={totals.gramsToNextTier}
        nextTierSavingPerGram={totals.nextTierSavingPerGram}
        retailTotalTTC={totals.retailTotalTTC}
        retailTotalHT={totals.retailTotalHT}
        totalHT={totals.totalHT}
        resellerMarginTotal={totals.resellerMarginTotal}
      />

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Unités</TableHead>
                <TableHead className="text-right">Poids</TableHead>
                <TableHead className="text-right">€/g HT</TableHead>
                <TableHead className="text-right">Total HT</TableHead>
                <TableHead className="text-right">Marge revendeur</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {totals.lines.map((l) => (
                <TableRow key={`${l.productId}-${l.format}`}>
                  <TableCell className="font-medium">{l.productName}</TableCell>
                  <TableCell>{l.format} g</TableCell>
                  <TableCell className="text-right">{l.units}</TableCell>
                  <TableCell className="text-right">{l.weightG} g</TableCell>
                  <TableCell className="text-right">{eur(l.pricePerGram)}</TableCell>
                  <TableCell className="text-right">{eur(l.totalHT)}</TableCell>
                  <TableCell className="text-right text-gold">
                    {eur(l.resellerMargin)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUnits(l.productId, l.productName, l.format, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Poids total</span>
              <span>{totals.totalWeightG} g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total HT</span>
              <span>{eur(totals.totalHT)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA 20 %</span>
              <span>{eur(totals.totalVAT)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-border/40">
              <span>Total TTC</span>
              <span className="text-gold">{eur(totals.totalTTC)}</span>
            </div>
            <div className="pt-3 text-xs text-muted-foreground space-y-1">
              <p>
                Valeur de revente conseillée (prix identiques au site) :{" "}
                {eur(totals.retailTotalTTC)} TTC, soit {eur(totals.retailTotalHT)} HT après TVA
                reversée — marge estimée{" "}
                <span className="text-gold">{eur(totals.resellerMarginTotal)}</span>.
              </p>
              <p>
                Port offert à partir de {eur(franco)} HT. Briquet + feuilles inclus dans chaque
                pochon de 10 g, sans supplément.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="transfer" id="m-transfer" className="mt-1" />
                <Label htmlFor="m-transfer" className="font-normal">
                  Virement — facture à {delai} jours
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="physical" id="m-physical" className="mt-1" />
                <Label htmlFor="m-physical" className="font-normal">
                  Paiement par TPE à la remise (carte bancaire sur place) — validé par HSB
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="quote" id="m-quote" className="mt-1" />
                <Label htmlFor="m-quote" className="font-normal">
                  Demander un devis (proforma avant engagement)
                </Label>
              </div>
            </RadioGroup>

            <Textarea
              rows={3}
              placeholder="Remarque, délai souhaité, adresse de livraison particulière…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "quote"
                ? "Envoyer la demande de devis"
                : `Valider la commande — ${eur(totals.totalTTC)} TTC`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProCartPage;
