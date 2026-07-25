import { useState } from "react";
import { useCosts, useConsumablesList } from "@/hooks/useCosts";
import { useProPriceTiers } from "@/hooks/useProPriceTiers";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { GAMME_LABEL, type ProGamme } from "@/lib/margin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CostRow = ({
  label,
  suffix,
  initial,
  onSave,
}: {
  label: string;
  suffix: string;
  initial: number;
  onSave: (v: number) => Promise<void> | void;
}) => {
  const [val, setVal] = useState(String(initial));
  const [saving, setSaving] = useState(false);
  const dirty = parseFloat(val) !== Number(initial);

  const save = async () => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return;
    setSaving(true);
    try {
      await onSave(n);
      toast.success("Enregistré");
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40">
      <span className="flex-1 text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-24 h-8"
        />
        <span className="text-xs text-muted-foreground w-14">{suffix}</span>
        <Button size="sm" variant={dirty ? "default" : "ghost"} disabled={!dirty || saving} onClick={save}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
        </Button>
      </div>
    </div>
  );
};

export default function CostsManager() {
  const { costs, isLoading, updateProductCost, updateConsumable, updateFixed } = useCosts();
  const { data: consumablesList } = useConsumablesList();
  const { tiers, updateTier } = useProPriceTiers();
  const { all: products } = useCatalogProducts();

  if (isLoading || !costs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coût matière (€/gramme)</CardTitle>
          <p className="text-xs text-muted-foreground">Ce que tu paies pour chaque gramme acheté / produit.</p>
        </CardHeader>
        <CardContent>
          {products.map((p) => (
            <CostRow
              key={p.id}
              label={p.name}
              suffix="€/g"
              initial={costs.productCosts[p.id] ?? 0}
              onSave={(v) => updateProductCost.mutateAsync({ productId: p.id, cost: v })}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consommables et cadeaux</CardTitle>
        </CardHeader>
        <CardContent>
          {(consumablesList ?? []).map((c) => (
            <CostRow
              key={c.key}
              label={c.label}
              suffix={`€/${c.unit}`}
              initial={Number(c.unit_cost)}
              onSave={(v) => updateConsumable.mutateAsync({ key: c.key, cost: v })}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frais fixes</CardTitle>
        </CardHeader>
        <CardContent>
          <CostRow
            label="Colissimo Domicile"
            suffix="€"
            initial={costs.fixed.colissimo_domicile}
            onSave={(v) => updateFixed.mutateAsync({ colissimo_domicile: v })}
          />
          <CostRow
            label="Colissimo Point Relais"
            suffix="€"
            initial={costs.fixed.colissimo_relais}
            onSave={(v) => updateFixed.mutateAsync({ colissimo_relais: v })}
          />
          <CostRow
            label="Essence livraison perso"
            suffix="€/km"
            initial={costs.fixed.essence_per_km}
            onSave={(v) => updateFixed.mutateAsync({ essence_per_km: v })}
          />
          <CostRow
            label="Commission Viva Wallet"
            suffix="%"
            initial={costs.fixed.viva_commission_pct}
            onSave={(v) => updateFixed.mutateAsync({ viva_commission_pct: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grille prix pro (€/g par palier volume)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Prix pro HT — s'applique automatiquement aux commandes pro selon le poids total commandé.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {(["classiques", "911_og", "poussiere", "nectar_top"] as ProGamme[]).map((g) => {
            const forGamme = tiers.filter((t) => t.gamme === g);
            return (
              <div key={g}>
                <Label className="text-gold text-sm">{GAMME_LABEL[g]}</Label>
                <div className="mt-2">
                  {forGamme.map((t) => {
                    const label =
                      t.tier_max_g >= 999999
                        ? "> 1 kg"
                        : t.tier_max_g === 1000
                        ? "> 600 g et ≤ 1 kg"
                        : t.tier_max_g === 600
                        ? "> 200 g et ≤ 600 g"
                        : `≤ ${t.tier_max_g} g`;
                    return (
                      <CostRow
                        key={t.id}
                        label={label}
                        suffix="€/g"
                        initial={Number(t.price_per_gram)}
                        onSave={(v) => updateTier.mutateAsync({ id: t.id, price: v })}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
