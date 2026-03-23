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
  MessageSquare
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
  isUpdating
}: { 
  order: AdminOrder; 
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}) => {
  const status = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
  
  return (
    <TableRow>
      <TableCell className="font-mono font-semibold">
        {order.display_order_number || `#${order.order_number.toString().padStart(4, '0')}`}
      </TableCell>
      <TableCell>
        <div>
          <p className="text-sm">{order.user_email}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
          </p>
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
          <Badge variant="outline" className="capitalize">
            {order.delivery_type === "personal" ? "Remise en main propre" : "Envoi postal"}
          </Badge>
          <OrderSummaryPrint order={order} />
          <ShippingLabel order={order} />
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={order.status}
          onValueChange={(value) => { try { onStatusChange(value); } catch (e) { console.error("Status change error:", e); } }}
          disabled={isUpdating}
        >
          <SelectTrigger className={`w-[160px] ${status.color}`}>
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
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allOrders.map((order) => (
                          <OrderRow
                            key={order.id}
                            order={order}
                            onStatusChange={(status) => updateOrderStatus(order.id, status)}
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
