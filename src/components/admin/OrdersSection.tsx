import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin, AdminOrder } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, Loader2, DollarSign, Download, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import OrderSummaryPrint from "@/components/admin/OrderSummaryPrint";
import ShippingLabel from "@/components/admin/ShippingLabel";
import { MolecularLabel } from "@/components/admin/MolecularLabel";

const ORDER_STATUSES = [
  { value: "pending", label: "En attente", color: "bg-muted text-muted-foreground" },
  { value: "preparing", label: "En préparation", color: "bg-amber-500/20 text-amber-500" },
  { value: "shipped", label: "Expédiée", color: "bg-blue-500/20 text-blue-500" },
  { value: "in_delivery", label: "En livraison", color: "bg-purple-500/20 text-purple-500" },
  { value: "delivered", label: "Livrée", color: "bg-green-500/20 text-green-500" },
  { value: "cancelled", label: "Annulée", color: "bg-destructive/20 text-destructive" },
];

const OrderRow = ({
  order, onStatusChange, onPaymentStatusChange, onDelete, isUpdating, isDeleting,
}: {
  order: AdminOrder;
  onStatusChange: (s: string) => void;
  onPaymentStatusChange: (s: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) => {
  const status = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
  const isPaid = order.payment_status === "paid";

  const handleDownloadInvoice = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const orderNum = esc(order.display_order_number || `#${order.order_number.toString().padStart(4, "0")}`);
    const invoiceNum = `FA-${orderNum.replace("HSB-", "")}`;
    const date = new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const name = esc(order.guest_name || "Client");
    const delivery = order.delivery_type === "personal" ? "Remise en main propre" : order.delivery_type === "relay" ? "Point Relais" : "Envoi postal";
    const address = order.delivery_address ? esc(order.delivery_address) : "";
    const TVA_RATE = 20;
    const totalTTC = order.total_amount;
    const totalHT = totalTTC / 1.2;
    const totalTVA = totalTTC - totalHT;
    const itemsHtml = (order.order_items || []).map(item => {
      const qty = item.weight ? `${item.weight}g` : `x${item.quantity}`;
      const unitHT = item.unit_price / 1.2;
      const totalItemHT = item.total_price / 1.2;
      return `<tr><td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt">${esc(item.product_name)}</td><td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:center">${qty}</td><td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right">${unitHT.toFixed(2)} €</td><td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right">${TVA_RATE}%</td><td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right;font-weight:600">${totalItemHT.toFixed(2)} €</td></tr>`;
    }).join("");
    const w = window.open("", "_blank", "width=700,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Facture ${invoiceNum}</title><style>@page{size:A4;margin:15mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#222;background:#fff;padding:15mm;font-size:10pt}.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8mm;padding-bottom:5mm;border-bottom:3px solid #b8860b}.brand{font-size:16pt;font-weight:bold;color:#b8860b}.company-info{font-size:8pt;color:#555;text-align:right;line-height:1.6}.invoice-title{font-size:18pt;font-weight:bold;color:#b8860b;text-align:center;margin:6mm 0;letter-spacing:2px}.meta-row{display:flex;justify-content:space-between;margin-bottom:8mm}.meta-box{background:#f9f7f3;border:1px solid #e8e0d0;border-radius:4px;padding:4mm;width:48%}.meta-box h3{font-size:7pt;text-transform:uppercase;color:#b8860b;margin-bottom:2mm}.meta-box p{font-size:9pt;line-height:1.5}table{width:100%;border-collapse:collapse;margin-bottom:5mm}thead th{font-size:7pt;text-transform:uppercase;color:#fff;background:#b8860b;padding:2.5mm 2mm;text-align:left}thead th:nth-child(2){text-align:center}thead th:nth-child(3),thead th:nth-child(4),thead th:nth-child(5){text-align:right}.totals{margin-top:3mm;border-top:2px solid #b8860b;padding-top:4mm}.totals-row{display:flex;justify-content:flex-end;gap:10mm;font-size:10pt;padding:1mm 0}.totals-row.grand{font-size:14pt;font-weight:bold;color:#b8860b;border-top:1px solid #b8860b;padding-top:3mm}.totals-row .label{min-width:40mm;text-align:right}.totals-row .value{min-width:25mm;text-align:right}.payment-badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:2mm 4mm;border-radius:4px;font-size:9pt;font-weight:600;margin-top:4mm}.legal{font-size:7pt;color:#888;margin-top:4mm;text-align:center}</style></head><body><div class="header"><div><div class="brand">HIGH SOCIETY BOTANICALS</div><div style="font-size:8pt;color:#666">highsocietybotanicals.com</div></div><div class="company-info"><strong>High Society Botanicals</strong><br/>SIRET : 994 621 910 00011<br/>TVA Intra. : FR 48 994 621 910<br/>France</div></div><div class="invoice-title">FACTURE</div><div class="meta-row"><div class="meta-box"><h3>Informations facture</h3><p><strong>${invoiceNum}</strong><br/>Commande : ${orderNum}<br/>Date : ${date}<br/>Mode : ${delivery}</p></div><div class="meta-box"><h3>Client</h3><p><strong>${name}</strong><br/>${order.guest_email || order.user_email ? `${esc(order.guest_email || order.user_email || "")}<br/>` : ""}${order.guest_phone || order.contact_phone ? `Tél : ${esc(order.guest_phone || order.contact_phone || "")}<br/>` : ""}${address ? `${address}` : ""}</p></div></div><table><thead><tr><th>Désignation</th><th>Quantité</th><th>Prix unit. HT</th><th>TVA</th><th>Total HT</th></tr></thead><tbody>${itemsHtml}</tbody></table><div class="totals"><div class="totals-row"><span class="label">Total HT :</span><span class="value">${totalHT.toFixed(2)} €</span></div><div class="totals-row"><span class="label">TVA (${TVA_RATE}%) :</span><span class="value">${totalTVA.toFixed(2)} €</span></div><div class="totals-row grand"><span class="label">TOTAL TTC :</span><span class="value">${totalTTC.toFixed(2)} €</span></div></div><div class="payment-badge">✅ PAYÉ</div><div class="legal">High Society Botanicals — SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  return (
    <TableRow>
      <TableCell className="font-mono font-semibold">
        {order.display_order_number || `#${order.order_number.toString().padStart(4, '0')}`}
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm">{order.guest_name || order.user_email}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
          </p>
          {order.guest_email && <p className="text-xs text-muted-foreground">{order.guest_email}</p>}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {order.order_items?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1 text-muted-foreground">
              <span>{item.product_name} {item.weight ? `(${item.weight}g)` : `x${item.quantity}`}</span>
              <MolecularLabel productId={item.product_id} productName={item.product_name} weight={item.weight} />
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="font-semibold text-gold">
        {order.total_amount.toFixed(2)}€
        <div className="mt-1 flex flex-wrap gap-1">
          {order.order_channel === "pro" && (
            <Badge variant="outline" className="text-[10px] border-gold/40 text-gold">PRO</Badge>
          )}
          <Badge variant="secondary" className="text-[10px]">
            {order.payment_method === "transfer"
              ? "Virement"
              : order.payment_method === "physical"
              ? "Paiement physique"
              : "Carte en ligne"}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {order.delivery_type === "personal" ? "Main propre" : order.delivery_type === "relay" ? "Relais" : "Postal"}
          </Badge>
          <OrderSummaryPrint order={order} />
          {order.delivery_type !== "personal" && <ShippingLabel order={order} />}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {isPaid ? (
            <Badge className="bg-green-600/20 text-green-500 border-green-600/30">Payé</Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onPaymentStatusChange("paid")}
              className="gap-1 border-green-600/50 text-green-500 hover:bg-green-600/10 text-xs">
              <DollarSign className="h-3 w-3" />Marquer payé
            </Button>
          )}
          {isPaid && (
            <Button variant="ghost" size="sm" onClick={handleDownloadInvoice} className="text-primary" title="Télécharger la facture">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Select value={order.status}
          onValueChange={(value) => { try { onStatusChange(value); } catch (e) { console.error(e); } }}
          disabled={isUpdating}>
          <SelectTrigger className={`w-[150px] ${status.color}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Supprimer">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement cette commande ?</AlertDialogTitle>
              <AlertDialogDescription>Action irréversible.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
};

const OrdersSection = () => {
  const {
    allOrders, updateOrderStatus, updatePaymentStatus, deleteOrder,
    isUpdatingOrder, isDeletingOrder,
  } = useAdmin();
  const { toast } = useToast();
  const [trackingSyncing, setTrackingSyncing] = useState(false);

  const handleTrackingSync = async () => {
    setTrackingSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-colissimo-status");
      if (error) throw error;
      toast({
        title: `Suivi mis à jour`,
        description: data?.updated > 0
          ? `${data.updated} commande(s) mise(s) à jour sur ${data.checked} vérifiée(s).`
          : `${data.checked} commande(s) vérifiée(s), aucune mise à jour.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erreur", description: "Impossible de synchroniser Colissimo.", variant: "destructive" });
    } finally {
      setTrackingSyncing(false);
    }
  };

  const isAbandoned = (o: AdminOrder) =>
    o.payment_status !== "paid" && (o.payment_method ?? "online") === "online";

  const activeOrders = allOrders.filter((o) => !isAbandoned(o));
  const abandonedOrders = allOrders.filter(isAbandoned);

  const purgeAbandoned = () => {
    abandonedOrders.forEach((o) => deleteOrder(o.id));
  };

  const renderTable = (list: AdminOrder[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N°</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Livraison</TableHead>
            <TableHead>Paiement</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onStatusChange={(status) => updateOrderStatus(order.id, status)}
              onPaymentStatusChange={(ps) => updatePaymentStatus(order.id, ps)}
              onDelete={() => deleteOrder(order.id)}
              isUpdating={isUpdatingOrder}
              isDeleting={isDeletingOrder}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gold/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" />
            Commandes
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleTrackingSync} disabled={trackingSyncing}
            className="border-primary/30 text-primary hover:bg-primary/10">
            {trackingSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Sync Colissimo
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-2">
                Commandes
                <Badge variant="secondary">{activeOrders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="abandoned" className="gap-2">
                Paniers abandonnés
                <Badge variant="secondary">{abandonedOrders.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucune commande</p>
              ) : (
                renderTable(activeOrders)
              )}
            </TabsContent>

            <TabsContent value="abandoned">
              <p className="text-xs text-muted-foreground mb-3">
                Tentatives de paiement carte non finalisées — aucun montant débité. Ces lignes ne
                sont pas des commandes réelles et sont purgées automatiquement après 48 h.
              </p>
              {abandonedOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Aucun panier abandonné</p>
              ) : (
                <>
                  <div className="mb-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1">
                          <Trash2 className="h-4 w-4" />
                          Purger ({abandonedOrders.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer tous les paniers abandonnés ?</AlertDialogTitle>
                          <AlertDialogDescription>Action irréversible.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={purgeAbandoned}
                            className="bg-destructive hover:bg-destructive/90">Purger</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {renderTable(abandonedOrders)}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default OrdersSection;
