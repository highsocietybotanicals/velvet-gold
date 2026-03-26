import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, CreditCard, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { calculateItemPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderLine {
  productId: string;
  weight: number;
}

const ManualOrderCreator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { prices } = useProducts();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ productId: "", weight: 1 }]);
  const [isCreating, setIsCreating] = useState(false);

  const addLine = () => setLines([...lines, { productId: "", weight: 1 }]);
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: keyof OrderLine, value: string | number) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const getProductPrice = (productId: string) => {
    const dbP = prices.find(p => p.id === productId);
    const staticP = allProducts.find(p => p.id === productId);
    return dbP?.price ?? staticP?.price ?? 0;
  };

  const getProductGroup = (productId: string) => {
    const staticP = allProducts.find(p => p.id === productId);
    return staticP?.priceGroup || "A";
  };

  const calculateLineTotal = (line: OrderLine) => {
    if (!line.productId || line.weight <= 0) return 0;
    const base = getProductPrice(line.productId);
    const group = getProductGroup(line.productId);
    return calculateItemPrice(base, line.weight, group).finalPrice;
  };

  const totalAmount = lines.reduce((sum, l) => sum + calculateLineTotal(l), 0);
  const totalFlowerWeight = lines.reduce((sum, l) => {
    const product = allProducts.find(p => p.id === l.productId);
    if (!product || product.category !== "fleur") return sum;
    return sum + l.weight;
  }, 0);

  const handleCreate = async () => {
    const validLines = lines.filter(l => l.productId && l.weight > 0);
    if (validLines.length === 0) {
      toast({ title: "Erreur", description: "Ajoutez au moins un produit.", variant: "destructive" });
      return;
    }
    if (!customerName.trim()) {
      toast({ title: "Erreur", description: "Renseignez le nom du client.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          delivery_type: "personal",
          total_amount: totalAmount,
          total_flower_weight: totalFlowerWeight,
          payment_status: "paid",
          status: "delivered",
          guest_name: customerName.trim(),
          guest_email: customerEmail.trim() || null,
          guest_phone: customerPhone.trim() || null,
        })
        .select("id")
        .single();

      if (orderError) throw orderError;

      // Create order items
      const items = validLines.map(l => {
        const product = allProducts.find(p => p.id === l.productId)!;
        const lineTotal = calculateLineTotal(l);
        return {
          order_id: order.id,
          product_id: l.productId,
          product_name: product.name,
          product_type: product.category,
          weight: l.weight,
          unit_price: getProductPrice(l.productId),
          total_price: lineTotal,
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      toast({ title: "Commande créée ✅", description: `Commande de ${totalAmount.toFixed(2)}€ pour ${customerName}` });
      queryClient.invalidateQueries({ queryKey: ["admin"] });

      // Reset form
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setLines([{ productId: "", weight: 1 }]);
    } catch (error) {
      console.error("Error creating manual order:", error);
      toast({ title: "Erreur", description: "Impossible de créer la commande.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="mb-12"
    >
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gold" />
            Commande manuelle (paiement physique)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nom du client *</label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nom complet" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email (optionnel)</label>
              <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@exemple.com" type="email" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Téléphone (optionnel)</label>
              <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="06 ..." />
            </div>
          </div>

          {/* Order lines */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Produits</label>
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Select value={line.productId} onValueChange={v => updateLine(idx, "productId", v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choisir un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {allProducts.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.category === "fleur" ? "Fleur" : "Résine"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={line.weight}
                    onChange={e => updateLine(idx, "weight", parseFloat(e.target.value) || 0)}
                    className="w-20 h-9 text-sm"
                  />
                  <span className="text-sm text-muted-foreground">g</span>
                </div>
                <span className="text-sm font-medium text-primary w-20 text-right">
                  {calculateLineTotal(line).toFixed(2)}€
                </span>
                {lines.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeLine(idx)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addLine} className="gap-1">
              <Plus className="h-4 w-4" /> Ajouter un produit
            </Button>
          </div>

          {/* Total & submit */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div>
              <span className="text-sm text-muted-foreground">Total : </span>
              <span className="text-2xl font-bold text-primary">{totalAmount.toFixed(2)}€</span>
            </div>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Créer la commande
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Cette commande sera marquée comme "payée" et "livrée" immédiatement (paiement par terminal Viva en physique).
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default ManualOrderCreator;
