import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Boxes, Loader2, AlertTriangle, XCircle, Scale, Plus, Minus, Check, History, Zap, Leaf, Package,
} from "lucide-react";
import { useInventory, InventoryRow } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";

const REASON_LABELS: Record<string, string> = {
  sale: "Vente",
  restock: "Réappro",
  manual: "Correction",
  cancel: "Annulation",
};

const StockRow = ({ row }: { row: InventoryRow }) => {
  const { setStock, adjustStock, setThreshold } = useInventory();
  const { toast } = useToast();
  const [draft, setDraft] = useState<string>("");
  const [thresholdDraft, setThresholdDraft] = useState<string>("");
  const [addValue, setAddValue] = useState<string>("");

  const stock = row.stock_grams;
  const low = stock > 0 && stock <= row.low_stock_threshold_g;
  const out = stock <= 0;

  const saveStock = async () => {
    const v = Number(draft.replace(",", "."));
    if (!draft || Number.isNaN(v) || v < 0) return;
    try {
      await setStock.mutateAsync({ productId: row.product_id, grams: v });
      setDraft("");
      toast({ title: `${row.name} : ${v} g en stock` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const adjust = async (sign: 1 | -1) => {
    const v = Number(addValue.replace(",", "."));
    if (!addValue || Number.isNaN(v) || v <= 0) return;
    try {
      await adjustStock.mutateAsync({ productId: row.product_id, delta: sign * v });
      setAddValue("");
      toast({ title: `${row.name} : ${sign > 0 ? "+" : "−"}${v} g` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const saveThreshold = async () => {
    const v = Number(thresholdDraft.replace(",", "."));
    if (!thresholdDraft || Number.isNaN(v) || v < 0) return;
    try {
      await setThreshold.mutateAsync({ productId: row.product_id, grams: v });
      setThresholdDraft("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <TableRow
      className={out ? "bg-destructive/10" : low ? "bg-amber-500/10" : undefined}
    >
      <TableCell>
        <div className="flex items-center gap-2">
          {row.is_force_noire && <Zap className="w-3.5 h-3.5 text-red-500 shrink-0" />}
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.product_id}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {row.category === "fleur" ? (
            <><Leaf className="w-3 h-3 mr-1" />Fleur</>
          ) : (
            <><Package className="w-3 h-3 mr-1" />Résine</>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <span className={`font-semibold ${out ? "text-destructive" : low ? "text-amber-500" : ""}`}>
          {stock.toFixed(1)} g
        </span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            className="h-8 w-20"
            inputMode="decimal"
            placeholder={stock.toFixed(0)}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveStock()}
            aria-label={`Stock de ${row.name} en grammes`}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gold"
            disabled={!draft || setStock.isPending}
            onClick={saveStock}
            aria-label={`Enregistrer le stock de ${row.name}`}
          >
            {setStock.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!addValue || adjustStock.isPending}
            onClick={() => adjust(-1)}
            aria-label={`Retirer des grammes à ${row.name}`}
          >
            <Minus className="w-3.5 h-3.5" />
          </Button>
          <Input
            className="h-8 w-16"
            inputMode="decimal"
            placeholder="g"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && adjust(1)}
            aria-label={`Grammes à ajouter ou retirer pour ${row.name}`}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-gold/40 text-gold"
            disabled={!addValue || adjustStock.isPending}
            onClick={() => adjust(1)}
            aria-label={`Ajouter des grammes à ${row.name}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            className="h-8 w-16"
            inputMode="decimal"
            placeholder={row.low_stock_threshold_g.toFixed(0)}
            value={thresholdDraft}
            onChange={(e) => setThresholdDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveThreshold()}
            aria-label={`Seuil d'alerte de ${row.name}`}
          />
          {thresholdDraft && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-gold"
              onClick={saveThreshold}
              aria-label={`Enregistrer le seuil de ${row.name}`}
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        {out ? (
          <Badge className="bg-destructive/20 text-destructive">Épuisé</Badge>
        ) : low ? (
          <Badge className="bg-amber-500/20 text-amber-500">Stock bas</Badge>
        ) : (
          <Badge className="bg-green-500/20 text-green-500">En stock</Badge>
        )}
        {!row.is_active && <Badge variant="outline" className="ml-1">Inactif</Badge>}
      </TableCell>
    </TableRow>
  );
};

const InventoryManager = () => {
  const { rows, movements, isLoading, totalGrams, lowStock, outOfStock } = useInventory();
  const nameById = useMemo(
    () => new Map(rows.map((r) => [r.product_id, r.name])),
    [rows]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-gold/20">
          <CardContent className="pt-6 flex items-center gap-3">
            <Scale className="w-5 h-5 text-gold" />
            <div>
              <p className="text-2xl font-bold">{totalGrams.toFixed(0)} g</p>
              <p className="text-xs text-muted-foreground">Stock total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{lowStock.length}</p>
              <p className="text-xs text-muted-foreground">Variétés en alerte</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30">
          <CardContent className="pt-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{outOfStock.length}</p>
              <p className="text-xs text-muted-foreground">Variétés épuisées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-gold" />
            Stock par variété
            <Badge variant="secondary" className="ml-2">{rows.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun produit</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variété</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Définir (g)</TableHead>
                    <TableHead>Ajuster</TableHead>
                    <TableHead>Seuil (g)</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <StockRow key={r.product_id} row={r} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-gold" />
            Derniers mouvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              Aucun mouvement enregistré pour l'instant.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Variété</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Commande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell>{nameById.get(m.product_id) ?? m.product_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{REASON_LABELS[m.reason] ?? m.reason}</Badge>
                      </TableCell>
                      <TableCell
                        className={Number(m.delta_grams) < 0 ? "text-destructive" : "text-green-500"}
                      >
                        {Number(m.delta_grams) > 0 ? "+" : ""}
                        {Number(m.delta_grams).toFixed(1)} g
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {m.order_id ? m.order_id.slice(0, 8) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default InventoryManager;
