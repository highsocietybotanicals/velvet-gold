import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin, ProRequest, AdminOrder, VatRequest, PendingReview } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceManagement from "@/components/admin/PriceManagement";
import OrderSummaryPrint from "@/components/admin/OrderSummaryPrint";
import ShippingLabel from "@/components/admin/ShippingLabel";
import SocialMediaManager from "@/components/admin/SocialMediaManager";
import ManualOrderCreator from "@/components/admin/ManualOrderCreator";
import { MolecularLabel } from "@/components/admin/MolecularLabel";
import PromoCodeManager from "@/components/admin/PromoCodeManager";
import MileageManager from "@/components/admin/MileageManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Package, 
  Users, 
  Loader2,
  Building,
  Clock,
  FileText,
  Receipt,
  Star,
  MessageSquare,
  DollarSign,
  Download,
  RefreshCw,
  Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ORDER_STATUSES = [
  { value: "pending", label: "En attente", color: "bg-muted text-muted-foreground" },
  { value: "preparing", label: "En préparation", color: "bg-amber-500/20 text-amber-500" },
  { value: "shipped", label: "Expédiée", color: "bg-blue-500/20 text-blue-500" },
  { value: "in_delivery", label: "En livraison", color: "bg-purple-500/20 text-purple-500" },
  { value: "delivered", label: "Livrée", color: "bg-green-500/20 text-green-500" },
  { value: "cancelled", label: "Annulée", color: "bg-destructive/20 text-destructive" },
];

const ProRequestCard = ({ 
  request, 
  onValidate, 
  onReject,
  isValidating,
  isRejecting
}: { 
  request: ProRequest; 
  onValidate: () => void; 
  onReject: () => void;
  isValidating: boolean;
  isRejecting: boolean;
}) => (
  <Card className="border-gold/20 bg-card/50 backdrop-blur">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{request.company_name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{request.email}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              SIRET: <span className="font-mono text-foreground">{request.siret}</span>
            </span>
            {request.vat_number && (
              <span className="text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                TVA: <span className="font-mono text-foreground">{request.vat_number}</span>
              </span>
            )}
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(request.created_at), "dd MMM yyyy", { locale: fr })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isRejecting || isValidating}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onValidate}
            disabled={isValidating || isRejecting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Valider Pro
              </>
            )}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const VatRequestCard = ({ 
  request, 
  onValidate, 
  onReject,
  isValidating,
  isRejecting
}: { 
  request: VatRequest; 
  onValidate: () => void; 
  onReject: () => void;
  isValidating: boolean;
  isRejecting: boolean;
}) => (
  <Card className="border-primary/20 bg-card/50 backdrop-blur">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">{request.company_name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{request.email}</p>
          <div className="flex items-center gap-2 text-sm">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              TVA: <span className="font-mono text-primary font-semibold">{request.vat_number}</span>
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            disabled={isRejecting || isValidating}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Refuser
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onValidate}
            disabled={isValidating || isRejecting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Valider TVA
              </>
            )}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const OrderRow = ({ 
  order, 
  onStatusChange,
  onPaymentStatusChange,
  onDelete,
  isUpdating,
  isDeleting
}: { 
  order: AdminOrder; 
  onStatusChange: (status: string) => void;
  onPaymentStatusChange: (status: string) => void;
  onDelete: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) => {
  const status = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
  const isManual = order.delivery_type === "personal" && !order.user_id;
  const isPaid = order.payment_status === "paid";
  
  const handleDownloadInvoice = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const orderNum = esc(order.display_order_number || `#${order.order_number.toString().padStart(4, "0")}`);
    const invoiceNum = `FA-${orderNum.replace("HSB-", "")}`;
    const date = new Date(order.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    const name = esc(order.guest_name || "Client");
    const delivery = order.delivery_type === "personal" ? "Remise en main propre" : order.delivery_type === "relay" ? "Point Relais" : "Envoi postal";
    const address = order.delivery_address ? esc(order.delivery_address) : "";

    const TVA_RATE = 20; // 20% TVA
    const totalTTC = order.total_amount;
    const totalHT = totalTTC / (1 + TVA_RATE / 100);
    const totalTVA = totalTTC - totalHT;

    const itemsHtml = (order.order_items || []).map(item => {
      const qty = item.weight ? `${item.weight}g` : `x${item.quantity}`;
      const unitHT = item.unit_price / (1 + TVA_RATE / 100);
      const totalItemHT = item.total_price / (1 + TVA_RATE / 100);
      return `<tr>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt">${esc(item.product_name)}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:center">${qty}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right">${unitHT.toFixed(2)} €</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right">${TVA_RATE}%</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #ddd;font-size:9pt;text-align:right;font-weight:600">${totalItemHT.toFixed(2)} €</td>
      </tr>`;
    }).join("");

    const w = window.open("", "_blank", "width=700,height=900");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Facture ${invoiceNum}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; background: #fff; padding: 15mm; font-size: 10pt; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; padding-bottom: 5mm; border-bottom: 3px solid #b8860b; }
        .brand { font-size: 16pt; font-weight: bold; color: #b8860b; letter-spacing: 1px; }
        .brand-sub { font-size: 8pt; color: #666; margin-top: 1mm; }
        .company-info { font-size: 8pt; color: #555; text-align: right; line-height: 1.6; }
        .company-info strong { color: #333; }
        .invoice-title { font-size: 18pt; font-weight: bold; color: #b8860b; text-align: center; margin: 6mm 0; letter-spacing: 2px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 8mm; }
        .meta-box { background: #f9f7f3; border: 1px solid #e8e0d0; border-radius: 4px; padding: 4mm; width: 48%; }
        .meta-box h3 { font-size: 7pt; text-transform: uppercase; color: #b8860b; margin-bottom: 2mm; letter-spacing: 1px; }
        .meta-box p { font-size: 9pt; line-height: 1.5; color: #333; }
        .meta-box .highlight { font-weight: bold; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
        thead th { font-size: 7pt; text-transform: uppercase; color: #fff; background: #b8860b; padding: 2.5mm 2mm; text-align: left; }
        thead th:nth-child(2) { text-align: center; }
        thead th:nth-child(3), thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
        .totals { margin-top: 3mm; border-top: 2px solid #b8860b; padding-top: 4mm; }
        .totals-row { display: flex; justify-content: flex-end; gap: 10mm; font-size: 10pt; padding: 1mm 0; }
        .totals-row.grand { font-size: 14pt; font-weight: bold; color: #b8860b; border-top: 1px solid #b8860b; padding-top: 3mm; margin-top: 2mm; }
        .totals-row .label { min-width: 40mm; text-align: right; }
        .totals-row .value { min-width: 25mm; text-align: right; }
        .payment-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2mm 4mm; border-radius: 4px; font-size: 9pt; font-weight: 600; margin-top: 4mm; }
        .footer { text-align: center; font-size: 7pt; color: #999; border-top: 1px solid #ddd; padding-top: 4mm; margin-top: 10mm; line-height: 1.6; }
        .footer .thanks { font-size: 10pt; color: #b8860b; font-weight: 600; margin-bottom: 2mm; }
        .legal { font-size: 7pt; color: #888; margin-top: 4mm; text-align: center; line-height: 1.5; }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="brand">HIGH SOCIETY BOTANICALS</div>
          <div class="brand-sub">highsocietybotanicals.com</div>
        </div>
        <div class="company-info">
          <strong>High Society Botanicals</strong><br/>
          SIRET : 994 621 910 00011<br/>
          TVA Intra. : FR 48 994 621 910<br/>
          France
        </div>
      </div>

      <div class="invoice-title">FACTURE</div>

      <div class="meta-row">
        <div class="meta-box">
          <h3>Informations facture</h3>
          <p>
            <span class="highlight">${invoiceNum}</span><br/>
            Commande : ${orderNum}<br/>
            Date : ${date}<br/>
            Mode : ${delivery}
          </p>
        </div>
        <div class="meta-box">
          <h3>Client</h3>
          <p>
            <span class="highlight">${name}</span><br/>
            ${order.guest_email || order.user_email ? `${esc(order.guest_email || order.user_email || "")}<br/>` : ""}
            ${order.guest_phone || order.contact_phone ? `Tél : ${esc(order.guest_phone || order.contact_phone || "")}<br/>` : ""}
            ${address ? `${address}` : ""}
          </p>
        </div>
      </div>

      <table>
        <thead><tr><th>Désignation</th><th>Quantité</th><th>Prix unit. HT</th><th>TVA</th><th>Total HT</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div class="totals">
        <div class="totals-row"><span class="label">Total HT :</span><span class="value">${totalHT.toFixed(2)} €</span></div>
        <div class="totals-row"><span class="label">TVA (${TVA_RATE}%) :</span><span class="value">${totalTVA.toFixed(2)} €</span></div>
        ${order.promo_code ? `<div class="totals-row" style="color:#b8860b;font-weight:600;"><span class="label">Code promo ${esc(order.promo_code)} (-${order.promo_discount_percent}%) :</span><span class="value">-${(order.promo_discount_amount || 0).toFixed(2)} €</span></div>` : ""}
        <div class="totals-row grand"><span class="label">TOTAL TTC :</span><span class="value">${totalTTC.toFixed(2)} €</span></div>
      </div>

      <div class="payment-badge">✅ PAYÉ</div>

      <div class="legal">
        High Society Botanicals — SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910
      </div>

      <div class="footer">
        <div class="thanks">Merci pour votre confiance ! 🌿</div>
        <div>High Society Botanicals — France — highsocietybotanicals.com</div>
      </div>
    </body></html>`);
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
      {/* Payment status */}
      <TableCell>
        <div className="flex items-center gap-2">
          {isPaid ? (
            <Badge className="bg-green-600/20 text-green-500 border-green-600/30">Payé</Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaymentStatusChange("paid")}
              className="gap-1 border-green-600/50 text-green-500 hover:bg-green-600/10 text-xs"
            >
              <DollarSign className="h-3 w-3" />
              Marquer payé
            </Button>
          )}
          {isPaid && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadInvoice}
              className="text-primary"
              title="Télécharger la facture"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={order.status}
          onValueChange={(value) => { try { onStatusChange(value); } catch (e) { console.error("Status change error:", e); } }}
          disabled={isUpdating}
        >
          <SelectTrigger className={`w-[150px] ${status.color}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  );
};

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { 
    proRequests, 
    vatRequests,
    allOrders, 
    pendingReviews,
    loadingProRequests,
    loadingVatRequests, 
    loadingOrders,
    loadingPendingReviews,
    validatePro,
    rejectPro,
    validateVat,
    rejectVat,
    updateOrderStatus,
    updatePaymentStatus,
    approveReview,
    deleteReview,
    isValidating,
    isRejecting,
    isValidatingVat,
    isRejectingVat,
    isUpdatingOrder,
    isApprovingReview,
    isDeletingReview
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
      console.error("Tracking sync error:", err);
      toast({
        title: "Erreur",
        description: "Impossible de synchroniser le suivi Colissimo.",
        variant: "destructive",
      });
    } finally {
      setTrackingSyncing(false);
    }
  };

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading || loadingProRequests || loadingVatRequests || loadingOrders || loadingPendingReviews) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-gold" />
              <h1 className="text-3xl font-bold gold-text">Administration</h1>
            </div>
            <p className="text-muted-foreground">
              Gérez les demandes Pro et les commandes
            </p>
          </motion.div>

          {/* Section Gestion des Prix */}
          <PriceManagement />

          {/* Section Codes Promo */}
          <PromoCodeManager />

          {/* Section Commande Manuelle */}
          <ManualOrderCreator />

          {/* Section Frais Kilométriques */}
          <MileageManager />

          {/* Section Demandes Pro */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gold" />
                  Demandes Pro en attente
                  {proRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {proRequests.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune demande Pro en attente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {proRequests.map((request) => (
                      <ProRequestCard
                        key={request.id}
                        request={request}
                        onValidate={() => validatePro(request.id)}
                        onReject={() => rejectPro(request.id)}
                        isValidating={isValidating}
                        isRejecting={isRejecting}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Section Validation TVA */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  TVA à valider
                  {vatRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                      {vatRequests.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vatRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune demande TVA en attente
                  </p>
                ) : (
                  <div className="space-y-4">
                    {vatRequests.map((request) => (
                      <VatRequestCard
                        key={request.id}
                        request={request}
                        onValidate={() => validateVat(request.id)}
                        onReject={() => rejectVat(request.id)}
                        isValidating={isValidatingVat}
                        isRejecting={isRejectingVat}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
          {/* Section Avis en attente */}
          {pendingReviews.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mb-12"
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Avis en attente de modération
                    <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                      {pendingReviews.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingReviews.map((review) => (
                      <Card key={review.id} className="border-border/50 bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-foreground">{review.author_name}</span>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-4 h-4 ${s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">Produit: {review.product_id}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{review.comment}</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteReview(review.id)}
                                disabled={isDeletingReview}
                                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rejeter
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => approveReview(review.id)}
                                disabled={isApprovingReview}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-gold/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gold" />
                  Toutes les commandes
                  <Badge variant="secondary" className="ml-2">
                    {allOrders.length}
                  </Badge>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTrackingSync}
                  disabled={trackingSyncing}
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  {trackingSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Sync Colissimo
                </Button>
              </CardHeader>
              <CardContent>
                {allOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune commande pour le moment
                  </p>
                ) : (
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allOrders.map((order) => (
                          <OrderRow
                            key={order.id}
                            order={order}
                            onStatusChange={(status) => updateOrderStatus(order.id, status)}
                            onPaymentStatusChange={(ps) => updatePaymentStatus(order.id, ps)}
                            isUpdating={isUpdatingOrder}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>

          {/* Section Social Media */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SocialMediaManager />
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
