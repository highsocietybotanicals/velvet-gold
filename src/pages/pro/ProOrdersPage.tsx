import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const eur = (n: number) => `${Number(n || 0).toFixed(2)} €`;
const dt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");


const quoteStatusLabel: Record<string, string> = {
  pending: "En attente",
  sent: "Proforma envoyée",
  accepted: "Acceptée",
  refused: "Refusée",
};

const orderStatusLabel: Record<string, string> = {
  pending: "Enregistrée",
  preparing: "En préparation",
  shipped: "Expédiée",
  in_delivery: "En livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const ProOrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loadingInvoice, setLoadingInvoice] = useState<string | null>(null);

  const openInvoice = async (orderId: string) => {
    setLoadingInvoice(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("get-pro-invoice", {
        body: { orderId },
      });
      const url = (data as any)?.url;
      if (url) {
        window.open(url, "_blank", "noopener");
        return;
      }
      const notGenerated =
        (data as any)?.code === "not_generated" || !!error;
      toast({
        title: notGenerated ? "Facture en préparation" : "Facture indisponible",
        description: notGenerated
          ? "La facture de cette commande n'a pas encore été émise. Elle sera disponible ici dès son envoi."
          : ((data as any)?.error ?? error?.message ?? "Erreur inconnue"),
        variant: notGenerated ? "default" : "destructive",
      });
    } catch (e) {
      toast({
        title: "Facture indisponible",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingInvoice(null);
    }
  };




  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["pro-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(
          "id, display_order_number, created_at, status, payment_status, payment_method, total_amount, total_flower_weight"
        )
        .eq("user_id", user!.id)
        .eq("order_channel", "pro")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];

    },
  });

  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ["pro-quotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pro_quotes")
        .select("id, created_at, status, total_weight_g, total_ht, total_ttc")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold gold-text">Mes commandes & devis</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commandes professionnelles</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {ordersLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : !orders?.length ? (
            <p className="p-6 text-sm text-muted-foreground">Aucune commande pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Poids</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead className="text-right">Facture</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.display_order_number}</TableCell>
                    <TableCell>{dt(o.created_at)}</TableCell>
                    <TableCell>{o.total_flower_weight} g</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {orderStatusLabel[o.status] ?? o.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.payment_status === "paid" ? "default" : "outline"}>
                        {o.payment_status === "paid"
                          ? "Payée"
                          : o.payment_method === "physical"
                          ? "TPE à la remise — à valider par HSB"
                          : `Virement — libellé ${o.display_order_number}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{eur(o.total_amount)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openInvoice(o.id)}
                        disabled={loadingInvoice === o.id}
                      >
                        {loadingInvoice === o.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        <span className="ml-2 hidden sm:inline">PDF</span>
                      </Button>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Demandes de devis</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {quotesLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : !quotes?.length ? (
            <p className="p-6 text-sm text-muted-foreground">Aucun devis en cours.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Poids</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell>{dt(q.created_at)}</TableCell>
                    <TableCell>{q.total_weight_g} g</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {quoteStatusLabel[q.status] ?? q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{eur(q.total_ht)}</TableCell>
                    <TableCell className="text-right">{eur(q.total_ttc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProOrdersPage;
