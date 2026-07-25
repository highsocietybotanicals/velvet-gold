import { useMemo, useState } from "react";
import { useCosts } from "@/hooks/useCosts";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { computeSimulation, type SimInput } from "@/lib/margin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const fmt = (n: number) => `${n.toFixed(2)} €`;

export default function MarginSimulator() {
  const { costs } = useCosts();
  const { all: products } = useCatalogProducts();

  const [productId, setProductId] = useState<string>("");
  const [weightG, setWeightG] = useState<number>(10);
  const [unitPrice, setUnitPrice] = useState<number>(8);
  const [includeGifts, setIncludeGifts] = useState(true);
  const [shipping, setShipping] = useState<SimInput["shipping"]>("domicile");
  const [mileageKm, setMileageKm] = useState<number>(0);

  const firstProductId = products[0]?.id ?? "";
  const pid = productId || firstProductId;

  const breakdown = useMemo(() => {
    if (!costs || !pid) return null;
    return computeSimulation(
      { productId: pid, weightG, unitPricePerGram: unitPrice, includeGifts, shipping, mileageKm },
      costs
    );
  }, [costs, pid, weightG, unitPrice, includeGifts, shipping, mileageKm]);

  const chartData = breakdown
    ? [
        { name: "Coût matière", value: breakdown.costMatter, fill: "hsl(var(--destructive))" },
        { name: "Consommables", value: breakdown.costConsumables, fill: "#a855f7" },
        { name: "Cadeaux", value: breakdown.costGifts, fill: "#ec4899" },
        { name: "Expédition", value: breakdown.costShipping, fill: "#3b82f6" },
        { name: "Km", value: breakdown.costMileage, fill: "#22d3ee" },
        { name: "Commission Viva", value: breakdown.costCommission, fill: "#f59e0b" },
        { name: "Bénéfice", value: Math.max(0, breakdown.margin), fill: "#10b981" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Simulateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Produit</Label>
            <Select value={pid} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantité (g)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={weightG}
                onChange={(e) => setWeightG(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Prix de vente €/g</Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>Inclure cadeaux (1 kit / 10g)</Label>
            <Switch checked={includeGifts} onCheckedChange={setIncludeGifts} />
          </div>

          <div>
            <Label>Expédition</Label>
            <Select value={shipping} onValueChange={(v) => setShipping(v as SimInput["shipping"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Retrait sur place</SelectItem>
                <SelectItem value="relais">Colissimo Relais</SelectItem>
                <SelectItem value="domicile">Colissimo Domicile</SelectItem>
                <SelectItem value="personal">Livraison perso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shipping === "personal" && (
            <div>
              <Label>Distance A/R (km)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={mileageKm}
                onChange={(e) => setMileageKm(parseFloat(e.target.value) || 0)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Résultat</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown && (
            <>
              <div className="space-y-1 text-sm">
                <Row label="Chiffre d'affaires" value={fmt(breakdown.revenue)} strong />
                <Row label="Coût matière" value={`- ${fmt(breakdown.costMatter)}`} />
                <Row label="Consommables (pochons, Boveda…)" value={`- ${fmt(breakdown.costConsumables)}`} />
                <Row label="Cadeaux offerts" value={`- ${fmt(breakdown.costGifts)}`} />
                <Row label="Expédition" value={`- ${fmt(breakdown.costShipping)}`} />
                {breakdown.costMileage > 0 && <Row label="Km livraison" value={`- ${fmt(breakdown.costMileage)}`} />}
                <Row label="Commission Viva" value={`- ${fmt(breakdown.costCommission)}`} />
                <div className="border-t border-border my-2" />
                <Row
                  label="Bénéfice net"
                  value={`${fmt(breakdown.margin)} (${breakdown.marginPct.toFixed(1)}%)`}
                  strong
                  positive={breakdown.margin >= 0}
                />
              </div>

              <div className="h-56 mt-4">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={chartData} dataKey="value" innerRadius={40} outerRadius={80} paddingAngle={2}>
                      {chartData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const Row = ({
  label,
  value,
  strong,
  positive,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
}) => (
  <div
    className={`flex justify-between ${strong ? "font-semibold" : ""} ${
      positive === true ? "text-emerald-500" : positive === false ? "text-destructive" : ""
    }`}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);
