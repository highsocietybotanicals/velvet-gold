import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, ShoppingBag, Users, Euro, Package } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface OrderRow {
  id: string;
  user_id: string | null;
  guest_email: string | null;
  total_amount: number;
  total_flower_weight: number;
  delivery_type: string;
  payment_status: string;
  status: string;
  created_at: string;
  order_items?: { product_name: string; product_id: string; total_price: number; weight: number | null; quantity: number | null }[];
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(217 91% 60%)", "hsl(142 71% 45%)", "hsl(0 72% 51%)"];

const StatsManager = () => {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const since = subDays(new Date(), 90).toISOString();
        const { data, error } = await supabase
          .from("orders")
          .select("id, user_id, guest_email, total_amount, total_flower_weight, delivery_type, payment_status, status, created_at, order_items(product_name, product_id, total_price, weight, quantity)")
          .eq("payment_status", "paid")
          .neq("status", "cancelled")
          .gte("created_at", since)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setOrders((data as any) || []);
      } catch (e) {
        console.error("Stats load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= b;

    const thisMonth = orders.filter((o) => inRange(new Date(o.created_at), monthStart, monthEnd));
    const lastMonth = orders.filter((o) => inRange(new Date(o.created_at), prevMonthStart, prevMonthEnd));

    const sum = (arr: OrderRow[]) => arr.reduce((s, o) => s + Number(o.total_amount), 0);
    const caTTC = sum(thisMonth);
    const caTTClast = sum(lastMonth);
    const caHT = caTTC / 1.2;
    const avg = thisMonth.length ? caTTC / thisMonth.length : 0;
    const avgLast = lastMonth.length ? caTTClast / lastMonth.length : 0;

    const delta = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

    // CA last 30 days
    const daily: { date: string; ca: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, "yyyy-MM-dd");
      const dayOrders = orders.filter((o) => o.created_at.startsWith(dayStr));
      daily.push({
        date: format(day, "dd/MM", { locale: fr }),
        ca: Math.round(sum(dayOrders) * 100) / 100,
        count: dayOrders.length,
      });
    }

    // Top products (by grams + CA) — flowers/resin only
    const productMap: Record<string, { name: string; grams: number; ca: number }> = {};
    thisMonth.forEach((o) => {
      o.order_items?.forEach((it) => {
        if (!it.weight) return;
        if (!productMap[it.product_id]) productMap[it.product_id] = { name: it.product_name, grams: 0, ca: 0 };
        productMap[it.product_id].grams += Number(it.weight);
        productMap[it.product_id].ca += Number(it.total_price);
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.ca - a.ca)
      .slice(0, 5)
      .map((p) => ({ name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name, grams: Math.round(p.grams * 10) / 10, ca: Math.round(p.ca * 100) / 100 }));

    // Delivery breakdown
    const deliveryMap: Record<string, number> = { postal: 0, relay: 0, personal: 0 };
    thisMonth.forEach((o) => {
      deliveryMap[o.delivery_type] = (deliveryMap[o.delivery_type] || 0) + 1;
    });
    const deliveryData = [
      { name: "Postal", value: deliveryMap.postal },
      { name: "Point Relais", value: deliveryMap.relay },
      { name: "Main propre", value: deliveryMap.personal },
    ].filter((d) => d.value > 0);

    // Top clients (90 days)
    const clientMap: Record<string, { key: string; total: number; count: number }> = {};
    orders.forEach((o) => {
      const key = o.user_id || o.guest_email || "anon";
      if (!clientMap[key]) clientMap[key] = { key, total: 0, count: 0 };
      clientMap[key].total += Number(o.total_amount);
      clientMap[key].count += 1;
    });
    const topClients = Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // New vs returning (this month)
    const seenBefore = new Set(
      orders
        .filter((o) => new Date(o.created_at) < monthStart)
        .map((o) => o.user_id || o.guest_email || "anon")
    );
    let newClients = 0;
    let returning = 0;
    const monthSeen = new Set<string>();
    thisMonth.forEach((o) => {
      const k = o.user_id || o.guest_email || "anon";
      if (monthSeen.has(k)) return;
      monthSeen.add(k);
      if (seenBefore.has(k)) returning++;
      else newClients++;
    });

    return {
      caTTC,
      caHT,
      caTTClast,
      avg,
      avgLast,
      ordersCount: thisMonth.length,
      ordersCountLast: lastMonth.length,
      deltaCA: delta(caTTC, caTTClast),
      deltaOrders: delta(thisMonth.length, lastMonth.length),
      deltaAvg: delta(avg, avgLast),
      daily,
      topProducts,
      deliveryData,
      topClients,
      newClients,
      returning,
    };
  }, [orders]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const DeltaBadge = ({ value }: { value: number }) => {
    const positive = value >= 0;
    return (
      <Badge variant="outline" className={positive ? "text-green-500 border-green-500/30" : "text-destructive border-destructive/30"}>
        {positive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {value > 0 ? "+" : ""}{value.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" />
            Statistiques — {format(new Date(), "MMMM yyyy", { locale: fr })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center justify-between mb-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <DeltaBadge value={stats.deltaCA} />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">CA TTC</p>
              <p className="text-2xl font-bold text-gold">{stats.caTTC.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground mt-1">HT: {stats.caHT.toFixed(2)}€</p>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <DeltaBadge value={stats.deltaOrders} />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Commandes</p>
              <p className="text-2xl font-bold text-primary">{stats.ordersCount}</p>
              <p className="text-xs text-muted-foreground mt-1">M-1: {stats.ordersCountLast}</p>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <DeltaBadge value={stats.deltaAvg} />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Panier moyen</p>
              <p className="text-2xl font-bold text-primary">{stats.avg.toFixed(2)}€</p>
              <p className="text-xs text-muted-foreground mt-1">M-1: {stats.avgLast.toFixed(2)}€</p>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-card">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Clients</p>
              <p className="text-2xl font-bold text-primary">{stats.newClients + stats.returning}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+{stats.newClients} nouveaux</span> · {stats.returning} récurrents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CA quotidien — 30 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => [`${v.toFixed(2)}€`, "CA"]}
                />
                <Line type="monotone" dataKey="ca" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 produits (mois en cours)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune vente ce mois-ci</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number, n: string) => [n === "ca" ? `${v.toFixed(2)}€` : `${v}g`, n === "ca" ? "CA" : "Grammes"]}
                  />
                  <Bar dataKey="ca" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modes de livraison (mois en cours)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.deliveryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">—</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={stats.deliveryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {stats.deliveryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 clients — 90 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">—</p>
            ) : (
              <div className="space-y-2">
                {stats.topClients.map((c, i) => (
                  <div key={c.key} className="flex items-center justify-between p-2 rounded border border-border/30 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground w-6">#{i + 1}</span>
                      <span className="truncate">{c.key.includes("@") ? c.key : c.key.slice(0, 8) + "…"}</span>
                      <Badge variant="outline" className="text-xs">{c.count} cmd</Badge>
                    </div>
                    <span className="font-semibold text-gold whitespace-nowrap">{c.total.toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default StatsManager;
