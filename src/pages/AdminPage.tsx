import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin, ProRequest, AdminOrder, VatRequest, PendingReview } from "@/hooks/useAdmin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PriceManagement from "@/components/admin/PriceManagement";
import OrderSummaryPrint from "@/components/admin/OrderSummaryPrint";
import ShippingLabel from "@/components/admin/ShippingLabel";
import SocialMediaManager from "@/components/admin/SocialMediaManager";
import ManualOrderCreator from "@/components/admin/ManualOrderCreator";
import PromoCodeManager from "@/components/admin/PromoCodeManager";
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
  Download
} from "lucide-react";
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
  isUpdating
}: { 
  order: AdminOrder; 
  onStatusChange: (status: string) => void;
  onPaymentStatusChange: (status: string) => void;
  isUpdating: boolean;
}) => {
  const status = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
  const isManual = order.delivery_type === "personal" && !order.user_id;
  const isPaid = order.payment_status === "paid";
  
  const handleDownloadInvoice = () => {
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const orderNum = esc(order.display_order_number || `#${order.order_number.toString().padStart(4, "0")}`);
    const date = new Date(order.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const name = esc(order.guest_name || "Client");
    const delivery = order.delivery_type === "personal" ? "Remise en main propre" : order.delivery_type === "relay" ? "Point Relais" : "Envoi postal";

    const itemsHtml = (order.order_items || []).map(item => {
      const qty = item.weight ? `${item.weight}g` : `x${item.quantity}`;
      return `<tr>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt">${esc(item.product_name)}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt;text-align:center">${qty}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt;text-align:right">${item.unit_price.toFixed(2)}€</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt;text-align:right;font-weight:600">${item.total_price.toFixed(2)}€</td>
      </tr>`;
    }).join("");

    const w = window.open("", "_blank", "width=500,height=700");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>Facture ${orderNum}</title>
      <style>
        @page { size: A5; margin: 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #e0d5c0; background: #0a0a0a; padding: 8mm; }
        .header { text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 4mm; margin-bottom: 4mm; }
        .header .brand { font-size: 14pt; font-weight: bold; color: #b8860b; letter-spacing: 1px; }
        .header .sub { font-size: 8pt; color: #888; margin-top: 1mm; }
        .info { display: flex; justify-content: space-between; font-size: 8pt; color: #999; margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 0.5px solid #333; }
        .info .num { font-weight: bold; font-size: 10pt; color: #b8860b; font-family: monospace; }
        .client { font-size: 9pt; margin-bottom: 4mm; padding-bottom: 3mm; border-bottom: 0.5px solid #333; }
        .client .cname { font-weight: bold; font-size: 10pt; }
        .client .label { color: #888; font-size: 7pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
        thead th { font-size: 7pt; text-transform: uppercase; color: #b8860b; border-bottom: 1px solid #b8860b; padding: 2mm; text-align: left; }
        thead th:nth-child(2) { text-align: center; }
        thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
        .total { border-top: 2px solid #b8860b; padding-top: 3mm; display: flex; justify-content: space-between; font-size: 12pt; font-weight: bold; }
        .total .amount { color: #b8860b; font-size: 14pt; }
        .badge { display: inline-block; background: #b8860b22; color: #b8860b; padding: 1mm 3mm; border-radius: 3px; font-size: 8pt; font-weight: 600; margin-top: 3mm; }
        .footer { text-align: center; font-size: 7pt; color: #666; border-top: 0.5px solid #333; padding-top: 3mm; margin-top: 6mm; }
        .footer .thanks { font-size: 9pt; color: #b8860b; font-weight: 600; margin-bottom: 1mm; }
      </style>
    </head><body>
      <div class="header"><div class="brand">HIGH SOCIETY BOTANICALS</div><div class="sub">FACTURE — highsocietybotanicals.com</div></div>
      <div class="info"><div><span class="num">${orderNum}</span></div><div>${date}</div></div>
      <div class="client">
        <div class="cname">${name}</div>
        ${order.guest_phone || order.contact_phone ? `<div><span class="label">Tél :</span> ${esc(order.guest_phone || order.contact_phone || "")}</div>` : ""}
        ${order.guest_email || order.user_email ? `<div><span class="label">Email :</span> ${esc(order.guest_email || order.user_email || "")}</div>` : ""}
        <div><span class="label">Mode :</span> ${delivery}</div>
      </div>
      <table><thead><tr><th>Produit</th><th>Qté</th><th>P.U.</th><th>Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      ${order.promo_code ? `<div style="font-size:8pt;margin-bottom:3mm;"><div style="display:flex;justify-content:space-between;margin-bottom:1mm;"><span>Sous-total</span><span>${(order.total_amount + (order.promo_discount_amount || 0)).toFixed(2)}€</span></div><div style="display:flex;justify-content:space-between;color:#b8860b;font-weight:600;"><span>Code ${esc(order.promo_code)} (-${order.promo_discount_percent}%)</span><span>-${(order.promo_discount_amount || 0).toFixed(2)}€</span></div></div>` : ""}
      <div class="total"><span>TOTAL TTC</span><span class="amount">${order.total_amount.toFixed(2)}€</span></div>
      <div class="badge">✅ PAYÉ</div>
      <div class="footer"><div class="thanks">Merci pour votre confiance ! 🌿</div><div>High Society Botanicals — France</div></div>
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
            <div key={idx} className="text-muted-foreground">
              {item.product_name} {item.weight ? `(${item.weight}g)` : `x${item.quantity}`}
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gold" />
                  Toutes les commandes
                  <Badge variant="secondary" className="ml-2">
                    {allOrders.length}
                  </Badge>
                </CardTitle>
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
