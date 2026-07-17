import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Calculator, Download, FileText, Loader2, FileSpreadsheet } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from "date-fns";
import { fr } from "date-fns/locale";
import { generateAccountingPdf, generateAccountingCsv, summarize, AccountingLine } from "@/lib/accountingPdf";

type TypeFilter = "all" | "site" | "pro" | "mileage";
type StatusFilter = "billable" | "paid" | "all";

const statusMeta = (l: AccountingLine) => {
  if (l.type === "mileage") {
    if (l.status === "computed") return { label: "Calculé", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" };
    if (l.status === "failed") return { label: "Échec", cls: "bg-red-500/15 text-red-500 border-red-500/40" };
    return { label: l.status || "—", cls: "" };
  }
  if (l.status === "cancelled") return { label: "Annulée", cls: "bg-red-500/15 text-red-500 border-red-500/40" };
  if (l.type === "site") {
    if (l.paymentStatus === "paid") return { label: "Payée", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" };
    if (l.paymentStatus === "unpaid") return { label: "Impayée", cls: "bg-orange-500/15 text-orange-500 border-orange-500/40" };
    return { label: l.paymentStatus || l.status || "—", cls: "" };
  }
  if (l.status === "paid") return { label: "Payée", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" };
  if (l.status === "pending") return { label: "En attente", cls: "bg-muted text-muted-foreground" };
  if (l.status === "issued") return { label: "Émise", cls: "bg-blue-500/15 text-blue-500 border-blue-500/40" };
  return { label: l.status || "—", cls: "" };
};

const AccountingManager = () => {
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("billable");

  const applyPreset = (preset: string) => {
    const now = new Date();
    let f = now, t = now;
    if (preset === "this-month") { f = startOfMonth(now); t = endOfMonth(now); }
    else if (preset === "last-month") { const p = subMonths(now, 1); f = startOfMonth(p); t = endOfMonth(p); }
    else if (preset === "quarter") { f = startOfQuarter(now); t = endOfQuarter(now); }
    else if (preset === "year") { f = startOfYear(now); t = endOfYear(now); }
    setFrom(format(f, "yyyy-MM-dd"));
    setTo(format(t, "yyyy-MM-dd"));
  };

  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");

  const { data, isLoading } = useQuery({
    queryKey: ["accounting", from, to],
    queryFn: async () => {
      const [ordersRes, invoicesRes, mileageRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, display_order_number, order_number, created_at, total_amount, payment_status, status, guest_name, guest_email, user_id")
          .gte("created_at", fromDate.toISOString())
          .lte("created_at", toDate.toISOString())
          .order("created_at", { ascending: true }),
        supabase
          .from("pro_invoices")
          .select("id, invoice_number, issued_at, total_invoiced_ht, total_invoiced_ttc, status, partner_id")
          .gte("issued_at", from)
          .lte("issued_at", to)
          .order("issued_at", { ascending: true }),
        supabase
          .from("delivery_mileage")
          .select("id, order_id, computed_at, status, cost_euros, distance_km_round_trip, rate_per_km, arrival_address")
          .gte("computed_at", fromDate.toISOString())
          .lte("computed_at", toDate.toISOString())
          .order("computed_at", { ascending: true }),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (mileageRes.error) throw mileageRes.error;

      const partnerIds = Array.from(new Set((invoicesRes.data || []).map((i: any) => i.partner_id).filter(Boolean)));
      let partners: Record<string, string> = {};
      if (partnerIds.length > 0) {
        const { data: pData } = await supabase.from("pro_partners").select("id, name").in("id", partnerIds);
        (pData || []).forEach((p: any) => { partners[p.id] = p.name; });
      }

      const userIds = Array.from(new Set((ordersRes.data || []).map((o: any) => o.user_id).filter(Boolean)));
      let userEmails: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: pf } = await supabase.from("profiles").select("id, email, full_name").in("id", userIds);
        (pf || []).forEach((p: any) => { userEmails[p.id] = p.full_name || p.email || ""; });
      }

      const orderNumberById: Record<string, string> = {};
      (ordersRes.data || []).forEach((o: any) => {
        orderNumberById[o.id] = o.display_order_number || `HSB-${String(o.order_number).padStart(6, "0")}`;
      });

      const orderLines: AccountingLine[] = (ordersRes.data || []).map((o: any) => {
        const ttc = Number(o.total_amount) || 0;
        const ht = ttc / 1.2;
        return {
          id: `o-${o.id}`,
          invoiceNumber: `FA-${(o.display_order_number || `HSB-${String(o.order_number).padStart(6, "0")}`).replace("HSB-", "")}`,
          date: o.created_at,
          type: "site",
          client: o.guest_name || (o.user_id ? userEmails[o.user_id] : "") || o.guest_email || "Client",
          ht,
          tva: ttc - ht,
          ttc,
          status: o.status,
          paymentStatus: o.payment_status,
        };
      });

      const proLines: AccountingLine[] = (invoicesRes.data || []).map((i: any) => {
        const ttc = Number(i.total_invoiced_ttc) || 0;
        const ht = Number(i.total_invoiced_ht) || ttc / 1.2;
        return {
          id: `p-${i.id}`,
          invoiceNumber: i.invoice_number || "—",
          date: i.issued_at,
          type: "pro",
          client: partners[i.partner_id] || "Client Pro",
          ht,
          tva: ttc - ht,
          ttc,
          status: i.status,
        };
      });

      const mileageLines: AccountingLine[] = (mileageRes.data || []).map((m: any) => {
        const cost = Number(m.cost_euros) || 0;
        const orderNum = orderNumberById[m.order_id] || "HSB-??????";
        return {
          id: `m-${m.id}`,
          invoiceNumber: `KM-${orderNum.replace("HSB-", "")}`,
          date: m.computed_at,
          type: "mileage",
          client: `Livraison ${orderNum}`,
          ht: cost,
          tva: 0,
          ttc: cost,
          status: m.status,
          details: `${m.distance_km_round_trip || 0} km × ${m.rate_per_km || 0} €/km`,
        };
      });

      return [...orderLines, ...proLines, ...mileageLines].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
  });

  const lines = useMemo(() => {
    if (!data) return [];
    let out = data;
    if (typeFilter !== "all") out = out.filter((l) => l.type === typeFilter);
    if (statusFilter === "billable") {
      out = out.filter((l) => {
        if (l.status === "cancelled") return false;
        if (l.type === "site") return l.paymentStatus === "paid";
        if (l.type === "mileage") return l.status === "computed";
        return l.status !== "cancelled";
      });
    } else if (statusFilter === "paid") {
      out = out.filter((l) => {
        if (l.status === "cancelled") return false;
        if (l.type === "site") return l.paymentStatus === "paid";
        if (l.type === "mileage") return l.status === "computed";
        return l.status === "paid";
      });
    }
    return out;
  }, [data, typeFilter, statusFilter]);

  const invoiceLines = useMemo(() => lines.filter((l) => l.type !== "mileage"), [lines]);
  const mileageLines = useMemo(() => lines.filter((l) => l.type === "mileage"), [lines]);
  const mileageTotals = useMemo(() => summarize(mileageLines), [mileageLines]);

  const totals = useMemo(() => summarize(lines), [lines]);
  const fmtEur = (n: number) => n.toFixed(2).replace(".", ",") + " €";

  const spanMonths = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()) + 1;

  const rowsWithGroups = useMemo(() => {
    if (spanMonths <= 1) return lines.map((l) => ({ kind: "line" as const, line: l }));
    const grouped = new Map<string, AccountingLine[]>();
    lines.forEach((l) => {
      const k = format(new Date(l.date), "yyyy-MM");
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(l);
    });
    const rows: any[] = [];
    Array.from(grouped.keys()).sort().forEach((k) => {
      rows.push({ kind: "header", month: k });
      grouped.get(k)!.forEach((line) => rows.push({ kind: "line", line }));
      const s = summarize(grouped.get(k)!);
      rows.push({ kind: "subtotal", month: k, summary: s });
    });
    return rows;
  }, [lines, spanMonths]);

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-gold" />
            Export comptable — factures & TVA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Du</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">Au</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="site">Site (orders)</SelectItem>
                  <SelectItem value="pro">Pro (factures)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Statut</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="billable">Facturable (CA net)</SelectItem>
                  <SelectItem value="paid">Payées uniquement</SelectItem>
                  <SelectItem value="all">Toutes (audit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => applyPreset("this-month")}>Ce mois</Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("last-month")}>Mois dernier</Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("quarter")}>Trimestre</Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset("year")}>Année</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/50"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Nb factures (hors annulées)</p>
              <p className="text-2xl font-bold">{totals.count}</p>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total HT</p>
              <p className="text-2xl font-bold">{fmtEur(totals.totalHT)}</p>
            </CardContent></Card>
            <Card className="border-border/50"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">TVA (20%)</p>
              <p className="text-2xl font-bold text-primary">{fmtEur(totals.totalTVA)}</p>
            </CardContent></Card>
            <Card className="border-gold/40"><CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total TTC</p>
              <p className="text-2xl font-bold text-gold">{fmtEur(totals.totalTTC)}</p>
            </CardContent></Card>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => generateAccountingPdf(lines, fromDate, toDate)} disabled={lines.length === 0} className="gap-2">
              <FileText className="w-4 h-4" />Télécharger PDF
            </Button>
            <Button variant="outline" onClick={() => generateAccountingCsv(lines, fromDate, toDate)} disabled={lines.length === 0} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />Exporter CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
          ) : lines.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">Aucune facture sur cette période</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Facture</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rowsWithGroups.map((r, idx) => {
                    if (r.kind === "header") {
                      return (
                        <TableRow key={`h-${idx}`} className="bg-muted/40">
                          <TableCell colSpan={8} className="font-semibold uppercase text-primary text-xs tracking-wider">
                            {format(new Date(r.month + "-01"), "MMMM yyyy", { locale: fr })}
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (r.kind === "subtotal") {
                      return (
                        <TableRow key={`s-${idx}`} className="bg-muted/20 italic">
                          <TableCell colSpan={5} className="text-right">
                            Sous-total {format(new Date(r.month + "-01"), "MMMM yyyy", { locale: fr })} ({r.summary.count})
                          </TableCell>
                          <TableCell className="text-right">{fmtEur(r.summary.totalHT)}</TableCell>
                          <TableCell className="text-right">{fmtEur(r.summary.totalTVA)}</TableCell>
                          <TableCell className="text-right font-bold">{fmtEur(r.summary.totalTTC)}</TableCell>
                        </TableRow>
                      );
                    }
                    const l: AccountingLine = r.line;
                    const meta = statusMeta(l);
                    const cancelled = l.status === "cancelled";
                    return (
                      <TableRow key={l.id} className={cancelled ? "opacity-60 line-through" : ""}>
                        <TableCell className="font-mono text-xs">{l.invoiceNumber}</TableCell>
                        <TableCell>{format(new Date(l.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={l.type === "pro" ? "border-primary/50 text-primary" : ""}>
                            {l.type === "site" ? "Site" : "Pro"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{l.client}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.cls}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{fmtEur(l.ht)}</TableCell>
                        <TableCell className="text-right">{fmtEur(l.tva)}</TableCell>
                        <TableCell className="text-right font-semibold text-gold">{fmtEur(l.ttc)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-gold/10 border-t-2 border-gold">
                    <TableCell colSpan={5} className="font-bold text-right">TOTAL hors annulées ({totals.count})</TableCell>
                    <TableCell className="text-right font-bold">{fmtEur(totals.totalHT)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{fmtEur(totals.totalTVA)}</TableCell>
                    <TableCell className="text-right font-bold text-gold text-lg">{fmtEur(totals.totalTTC)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default AccountingManager;
