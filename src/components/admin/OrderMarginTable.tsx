import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCosts } from "@/hooks/useCosts";
import { computeOrderMargin, type OrderLite } from "@/lib/margin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMemo } from "react";

interface OrderRow {
  id: string;
  display_order_number: string | null;
  created_at: string;
  total_amount: number;
  total_flower_weight: number;
  delivery_type: string;
  payment_status: string;
  status: string;
  order_items: {
    product_id: string;
    weight: number | null;
    quantity: number | null;
    unit_price: number;
    total_price: number;
  }[];
}

const fmt = (n: number) => `${n.toFixed(2)} €`;

export default function OrderMarginTable() {
  const { costs, isLoading: costsLoading } = useCosts();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders-margin"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(
          "id, display_order_number, created_at, total_amount, total_flower_weight, delivery_type, payment_status, status, order_items(product_id, weight, quantity, unit_price, total_price)"
        )
        .eq("payment_status", "paid")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  const { data: mileageMap } = useQuery({
    queryKey: ["mileage-by-order"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("delivery_mileage")
        .select("order_id, distance_km_round_trip, distance_km_one_way, cost_euros");
      if (error) throw error;
      const m: Record<string, number> = {};
      (data || []).forEach((r: any) => {
        m[r.order_id] =
          Number(r.distance_km_round_trip) ||
          (Number(r.distance_km_one_way) || 0) * 2;
      });
      return m;
    },
  });

  const rows = useMemo(() => {
    if (!orders || !costs) return [];
    return orders.map((o) => {
      const km = (mileageMap && mileageMap[o.id]) || 0;
      const breakdown = computeOrderMargin(o as OrderLite, costs, km);
      const itemsWeight = (o.order_items ?? []).reduce(
        (s, it) => s + (Number(it.weight) || 0) * (Number(it.quantity) || 1),
        0
      );
      const totalWeight = itemsWeight || Number(o.total_flower_weight) || 0;
      return { o, breakdown, km, totalWeight };
    });
  }, [orders, costs, mileageMap]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.revenue += r.breakdown.revenue;
        acc.cost += r.breakdown.totalCost;
        acc.margin += r.breakdown.margin;
        return acc;
      },
      { revenue: 0, cost: 0, margin: 0 }
    );
  }, [rows]);

  if (isLoading || costsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">CA total (payées)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold gold-text">{fmt(totals.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Coûts cumulés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">- {fmt(totals.cost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Bénéfice net estimé</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold ${totals.margin >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {fmt(totals.margin)}
            </p>
            <p className="text-xs text-muted-foreground">
              {totals.revenue > 0 ? ((totals.margin / totals.revenue) * 100).toFixed(1) : "0"}% de marge
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marge par commande</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Poids</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead>Marge €</TableHead>
                <TableHead>Marge %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ o, breakdown, totalWeight, km }) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.display_order_number ?? o.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{totalWeight}g</TableCell>
                  <TableCell>{fmt(breakdown.revenue)}</TableCell>
                  <TableCell className="text-destructive">
                    <div className="flex items-center gap-1.5">
                      <span>- {fmt(breakdown.totalCost)}</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="text-muted-foreground hover:text-gold transition-colors" aria-label="Détail des coûts">
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 text-xs" align="end">
                          <div className="space-y-2">
                            <p className="font-semibold text-sm mb-2">Détail des coûts</p>
                            <div className="flex justify-between"><span className="text-muted-foreground">Matière (fleurs/résines)</span><span>{fmt(breakdown.costMatter)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Consommables (pochons, boveda, étiquettes, sachet)</span><span>{fmt(breakdown.costConsumables)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Cadeaux (briquet + feuilles / 10g)</span><span>{fmt(breakdown.costGifts)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Expédition ({o.delivery_type || "—"})</span><span>{fmt(breakdown.costShipping)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Frais km ({km.toFixed(1)} km)</span><span>{fmt(breakdown.costMileage)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Commission Viva</span><span>{fmt(breakdown.costCommission)}</span></div>
                            <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                              <span>Total coûts</span><span className="text-destructive">{fmt(breakdown.totalCost)}</span>
                            </div>
                            {(o.order_items?.length ?? 0) > 0 && (
                              <div className="border-t border-border pt-2 mt-2">
                                <p className="text-muted-foreground mb-1">Lignes commande :</p>
                                {o.order_items.map((it, i) => (
                                  <div key={i} className="flex justify-between text-[11px]">
                                    <span className="truncate mr-2">{it.product_id} {it.weight ? `× ${it.weight}g` : it.quantity ? `× ${it.quantity}` : ""}</span>
                                    <span>{fmt(Number(it.total_price) || 0)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </TableCell>
                  <TableCell className={breakdown.margin >= 0 ? "text-emerald-500 font-medium" : "text-destructive font-medium"}>
                    {fmt(breakdown.margin)}
                  </TableCell>
                  <TableCell>{breakdown.marginPct.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                    Aucune commande payée trouvée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
