import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Download, Pencil, Check, X, Route, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MileageRow {
  id: string;
  order_id: string;
  departure_address: string;
  arrival_address: string;
  distance_km_one_way: number | null;
  distance_km_round_trip: number | null;
  duration_min: number | null;
  rate_per_km: number;
  cost_euros: number | null;
  status: string;
  computed_at: string | null;
  error_message: string | null;
  created_at: string;
  orders?: {
    display_order_number: string | null;
    created_at: string;
    delivery_address: string | null;
    contact_phone: string | null;
    guest_name: string | null;
  };
}

const DEFAULT_RATE = 0.636;

const MileageManager = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<MileageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rate, setRate] = useState<number>(DEFAULT_RATE);
  const [rateInput, setRateInput] = useState<string>(String(DEFAULT_RATE));
  const [savingRate, setSavingRate] = useState(false);
  const [month, setMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [recomputing, setRecomputing] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKm, setEditKm] = useState<string>("");

  const loadRate = async () => {
    const { data } = await (supabase as any)
      .from("mileage_settings")
      .select("rate_per_km")
      .eq("id", 1)
      .maybeSingle();
    if (data?.rate_per_km != null) {
      setRate(Number(data.rate_per_km));
      setRateInput(String(data.rate_per_km));
    }
  };

  const loadRows = async () => {
    setLoading(true);
    try {
      const [year, mon] = month.split("-").map(Number);
      if (!year || !mon) {
        setRows([]);
        return;
      }
      const start = new Date(year, mon - 1, 1).toISOString();
      const end = new Date(year, mon, 1).toISOString();

      const { data, error } = await (supabase as any)
        .from("delivery_mileage")
        .select(`
          *,
          orders ( display_order_number, created_at, delivery_address, contact_phone, guest_name )
        `)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false });

      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setRows([]);
      } else {
        setRows((data as MileageRow[]) || []);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message ?? String(e), variant: "destructive" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRate();
  }, []);
  useEffect(() => {
    loadRows();
  }, [month]);

  const saveRate = async () => {
    const v = Number(rateInput);
    if (isNaN(v) || v <= 0) {
      toast({ title: "Tarif invalide", variant: "destructive" });
      return;
    }
    setSavingRate(true);
    const { error } = await (supabase as any)
      .from("mileage_settings")
      .upsert({ id: 1, rate_per_km: v });
    setSavingRate(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setRate(v);
      toast({ title: "Barème mis à jour" });
    }
  };

  const recompute = async (orderId: string) => {
    setRecomputing(orderId);
    const { error } = await supabase.functions.invoke("compute-mileage", {
      body: { orderId },
    });
    setRecomputing(null);
    if (error) {
      toast({ title: "Erreur calcul", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Recalculé" });
      loadRows();
    }
  };

  const backfill = async () => {
    setBackfilling(true);
    // Find paid personal orders without mileage entry
    const { data: orders, error } = await (supabase as any)
      .from("orders")
      .select("id")
      .eq("delivery_type", "personal")
      .eq("payment_status", "paid");
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setBackfilling(false);
      return;
    }
    const { data: existing } = await (supabase as any)
      .from("delivery_mileage")
      .select("order_id");
    const existingIds = new Set((existing || []).map((r: any) => r.order_id));
    const todo = (orders || []).filter((o: any) => !existingIds.has(o.id));
    let ok = 0;
    let fail = 0;
    for (const o of todo) {
      const { error: e } = await supabase.functions.invoke("compute-mileage", {
        body: { orderId: o.id },
      });
      if (e) fail++;
      else ok++;
    }
    setBackfilling(false);
    toast({
      title: "Rétro-calcul terminé",
      description: `${ok} OK · ${fail} échec · ${todo.length === 0 ? "rien à faire" : ""}`,
    });
    loadRows();
  };

  const startEdit = (row: MileageRow) => {
    setEditingId(row.id);
    setEditKm(row.distance_km_one_way?.toString() ?? "");
  };

  const saveManual = async (row: MileageRow) => {
    const oneWay = Number(editKm);
    if (isNaN(oneWay) || oneWay < 0) {
      toast({ title: "Distance invalide", variant: "destructive" });
      return;
    }
    const roundTrip = oneWay * 2;
    const cost = Number((roundTrip * row.rate_per_km).toFixed(2));
    const { error } = await (supabase as any)
      .from("delivery_mileage")
      .update({
        distance_km_one_way: oneWay,
        distance_km_round_trip: roundTrip,
        cost_euros: cost,
        status: "manual",
      })
      .eq("id", row.id);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Fiche mise à jour" });
      setEditingId(null);
      loadRows();
    }
  };

  const totals = useMemo(() => {
    let km = 0;
    let cost = 0;
    let count = 0;
    for (const r of rows) {
      if (r.distance_km_round_trip != null) km += Number(r.distance_km_round_trip);
      if (r.cost_euros != null) cost += Number(r.cost_euros);
      count++;
    }
    return { km, cost, count };
  }, [rows]);

  const exportCsv = () => {
    const header = [
      "Date",
      "N° commande",
      "Départ",
      "Arrivée",
      "Km aller",
      "Km A/R",
      "Durée (min)",
      "€/km",
      "Coût €",
      "Statut",
    ];
    const lines = rows.map((r) => [
      r.orders?.created_at ? format(new Date(r.orders.created_at), "yyyy-MM-dd") : "",
      r.orders?.display_order_number ?? "",
      r.departure_address,
      r.arrival_address,
      r.distance_km_one_way?.toFixed(2) ?? "",
      r.distance_km_round_trip?.toFixed(2) ?? "",
      r.duration_min?.toFixed(0) ?? "",
      r.rate_per_km.toFixed(3),
      r.cost_euros?.toFixed(2) ?? "",
      r.status,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frais-kilometriques-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (s: string) => {
    if (s === "computed") return <Badge className="bg-green-500/20 text-green-500">Calculé</Badge>;
    if (s === "manual") return <Badge className="bg-blue-500/20 text-blue-500">Manuel</Badge>;
    if (s === "failed") return <Badge variant="destructive">Échec</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  return (
    <section className="mb-12">
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 gold-text">
            <Route className="h-5 w-5" />
            Frais kilométriques (livraison personnelle)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Settings + filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Barème (€/km)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.001"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                />
                <Button onClick={saveRate} disabled={savingRate} variant="secondary">
                  {savingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Actuel : {rate} €/km</p>
            </div>
            <div className="space-y-2">
              <Label>Mois</Label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="space-y-2 flex flex-col justify-end">
              <Button onClick={backfill} variant="outline" disabled={backfilling}>
                {backfilling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Calculer les commandes manquantes
              </Button>
              <Button onClick={exportCsv} variant="secondary" disabled={rows.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="grid gap-4 grid-cols-3">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Courses</p>
                <p className="text-2xl font-bold gold-text">{totals.count}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total km (A/R)</p>
                <p className="text-2xl font-bold gold-text">{totals.km.toFixed(1)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Total €</p>
                <p className="text-2xl font-bold gold-text">{totals.cost.toFixed(2)} €</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead className="text-right">Km A/R</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune fiche pour ce mois
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        {r.orders?.created_at && format(new Date(r.orders.created_at), "dd/MM/yy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.orders?.display_order_number}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate" title={r.arrival_address}>
                        {r.arrival_address}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === r.id ? (
                          <Input
                            type="number"
                            step="0.1"
                            value={editKm}
                            onChange={(e) => setEditKm(e.target.value)}
                            className="w-24 h-8 inline-block"
                          />
                        ) : (
                          r.distance_km_round_trip?.toFixed(1) ?? "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {r.duration_min ? `${Math.round(r.duration_min)} min` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.cost_euros != null ? `${r.cost_euros.toFixed(2)} €` : "—"}
                      </TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          {editingId === r.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => saveManual(r)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => recompute(r.order_id)}
                                disabled={recomputing === r.order_id}
                                title="Recalculer via Google Maps"
                              >
                                {recomputing === r.order_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(r)} title="Saisie manuelle">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default MileageManager;
