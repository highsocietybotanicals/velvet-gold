import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProCart } from "@/contexts/ProCartContext";
import { useProCartTotals, useProSettings } from "@/hooks/useProCartTotals";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProTierBar from "@/components/pro/ProTierBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { BANK_DETAILS } from "@/lib/bankDetails";
import { ProPlaque } from "@/components/minuit/areas/pro/ProDecor";
import { embStyle } from "@/components/minuit/areas/pro/proEmblem";

const eur = (n: number) => `${n.toFixed(2)} €`;

// Date d'établissement du bordereau (affichage seul)
const todayLabel = () =>
  new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const ProCartPage = () => {
  const { lines, setUnits, clearProCart } = useProCart();
  const { totals, isLoading } = useProCartTotals();
  const { data: settings } = useProSettings();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"transfer" | "physical" | "quote">("physical");
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
      <div className="pr-empty py-24 text-center">
        {/* Bordereau vierge (décor) */}
        <div className="pr-empty-sheet" style={embStyle} aria-hidden="true">
          <span className="t">Bordereau d'achat</span>
          <i className="w" />
          <span className="s">Vierge</span>
        </div>
        <p>Ton panier professionnel est vide.</p>
        <Button onClick={() => navigate("/pro/catalogue")}>Voir le catalogue</Button>
      </div>
    );
  }

  return (
    <div className="pr-bordereau space-y-6">
      <div className="pr-doc-hd">
        <div>
          <p className="pr-kicker">Bordereau d'achat · prix HT</p>
          <h1>Panier professionnel</h1>
        </div>
        <div className="pr-doc-side">
          <p className="pr-doc-meta">
            Établi le <b>{todayLabel()}</b>
            {profile?.company_name ? (
              <>
                <br />
                Pour <b>{profile.company_name}</b>
              </>
            ) : null}
          </p>
        </div>
      </div>

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

      {/* Détail du bordereau : registre noir, filets d'or (feuillets sur téléphone) */}
      <Card className="pr-ledger pr-slips">
        <CardHeader className="pr-ledger-hd">
          <p className="pr-kicker">Détail</p>
          <h2>Lignes du bordereau</h2>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Unités</TableHead>
                <TableHead className="text-right">Poids</TableHead>
                <TableHead className="pr-unit text-right">€/g HT</TableHead>
                <TableHead className="text-right">Total HT</TableHead>
                <TableHead className="text-right">Marge revendeur</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {totals.lines.map((l) => (
                <TableRow key={`${l.productId}-${l.format}`}>
                  <TableCell className="pr-name pr-span font-medium">{l.productName}</TableCell>
                  <TableCell data-label="Format">{l.format} g</TableCell>
                  <TableCell data-label="Unités" className="text-right">{l.units}</TableCell>
                  <TableCell data-label="Poids" className="text-right">{l.weightG} g</TableCell>
                  <TableCell data-label="€/g HT" className="text-right">{eur(l.pricePerGram)}</TableCell>
                  <TableCell data-label="Total HT" className="pr-strong text-right">{eur(l.totalHT)}</TableCell>
                  <TableCell data-label="Marge revendeur" className="pr-gold text-right">
                    {eur(l.resellerMargin)}
                  </TableCell>
                  <TableCell className="pr-act text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Retirer ${l.productName} (${l.format} g)`}
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
        {/* Arrêté du bordereau : bord perforé, plaque de membre (écho de la carte du salon) */}
        <Card className="pr-arrete pr-perf">
          <CardHeader className="pr-ledger-hd pr-arrete-hd">
            <div className="min-w-0">
              <p className="pr-kicker">Arrêté du bordereau</p>
              <h2>Récapitulatif</h2>
            </div>
            <ProPlaque className="is-sm" />
          </CardHeader>
          <CardContent className="pr-sum space-y-1.5 text-sm">
            <div className="pr-sum-row flex justify-between gap-4">
              <span className="l">Poids total</span>
              <span>{totals.totalWeightG} g</span>
            </div>
            <div className="pr-sum-row flex justify-between gap-4">
              <span className="l">Total HT</span>
              <span>{eur(totals.totalHT)}</span>
            </div>
            <div className="pr-sum-row flex justify-between gap-4">
              <span className="l">TVA 20 %</span>
              <span>{eur(totals.totalVAT)}</span>
            </div>
            <div className="pr-total flex justify-between gap-4">
              <span className="l">Total TTC</span>
              <span className="v pr-foil">{eur(totals.totalTTC)}</span>
            </div>
            <div className="pr-sum-note space-y-1">
              <p>
                Valeur de revente conseillée (prix identiques au site) :{" "}
                {eur(totals.retailTotalTTC)} TTC, soit {eur(totals.retailTotalHT)} HT après TVA
                reversée — marge estimée{" "}
                <span className="g">{eur(totals.resellerMarginTotal)}</span>.
              </p>
              <p>
                Port offert à partir de {eur(franco)} HT. Briquet + feuilles inclus dans chaque
                pochon de 10 g, sans supplément.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Règlement : options gravées */}
        <Card className="pr-reglement">
          <CardHeader className="pr-ledger-hd">
            <p className="pr-kicker">Mode de règlement</p>
            <h2>Validation</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <div className="pr-opt flex items-start gap-2">
                <RadioGroupItem value="transfer" id="m-transfer" className="pr-radio mt-1" />
                <Label htmlFor="m-transfer" className="pr-opt-l font-normal">
                  <span>Virement — facture à {delai} jours</span>
                  <span className="pr-iban mt-1 block">
                    {BANK_DETAILS.holder} · IBAN {BANK_DETAILS.iban} · BIC {BANK_DETAILS.bic}
                  </span>
                </Label>
              </div>
              <div className="pr-opt flex items-start gap-2">
                <RadioGroupItem value="physical" id="m-physical" className="pr-radio mt-1" />
                <Label htmlFor="m-physical" className="pr-opt-l font-normal">
                  Carte bancaire par TPE à la remise — mode privilégié
                </Label>
              </div>
              <div className="pr-opt flex items-start gap-2">
                <RadioGroupItem value="quote" id="m-quote" className="pr-radio mt-1" />
                <Label htmlFor="m-quote" className="pr-opt-l font-normal">
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
