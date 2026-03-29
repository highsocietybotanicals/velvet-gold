import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, CreditCard, UserPlus, FileText, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { calculateItemPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [customerAddress, setCustomerAddress] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ productId: "", weight: 1 }]);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError("");
    setPromoDiscount(null);
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setPromoError("Code invalide ou inactif");
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError("Code expiré");
        return;
      }
      if (data.max_uses && data.current_uses >= data.max_uses) {
        setPromoError("Code épuisé (utilisations max atteintes)");
        return;
      }
      setPromoDiscount(data.discount_percent);
      toast({ title: "Code promo validé ✅", description: `-${data.discount_percent}% appliqué` });
    } catch {
      setPromoError("Erreur de validation");
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const clearPromo = () => {
    setPromoCode("");
    setPromoDiscount(null);
    setPromoError("");
  };

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

  const subtotal = lines.reduce((sum, l) => sum + calculateLineTotal(l), 0);
  const discountAmount = promoDiscount ? subtotal * (promoDiscount / 100) : 0;
  const totalAmount = subtotal - discountAmount;
  const totalFlowerWeight = lines.reduce((sum, l) => {
    const product = allProducts.find(p => p.id === l.productId);
    if (!product || product.category !== "fleur") return sum;
    return sum + l.weight;
  }, 0);

  const buildInvoiceHtml = (orderData: any, items: any[]) => {
    const orderNum = orderData.display_order_number || `#${orderData.order_number?.toString().padStart(4, "0") || "0000"}`;
    const date = new Date(orderData.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const itemsHtml = items.map(item => {
      const qty = item.weight ? `${item.weight}g` : `x${item.quantity}`;
      return `<tr>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt">${esc(item.product_name)}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt;text-align:center">${qty}</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt;text-align:right">${item.unit_price.toFixed(2)}€</td>
        <td style="padding:3mm 2mm;border-bottom:0.5px solid #333;font-size:9pt;text-align:right;font-weight:600">${item.total_price.toFixed(2)}€</td>
      </tr>`;
    }).join("");

    return `<!DOCTYPE html><html><head>
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
        .client .cname { font-weight: bold; font-size: 10pt; color: #e0d5c0; }
        .client .label { color: #888; font-size: 7pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 4mm; }
        thead th { font-size: 7pt; text-transform: uppercase; color: #b8860b; border-bottom: 1px solid #b8860b; padding: 2mm; text-align: left; }
        thead th:nth-child(2) { text-align: center; }
        thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
        .total { border-top: 2px solid #b8860b; padding-top: 3mm; display: flex; justify-content: space-between; font-size: 12pt; font-weight: bold; }
        .total .amount { color: #b8860b; font-size: 14pt; }
        .badge { display: inline-block; background: #b8860b22; color: #b8860b; padding: 1mm 3mm; border-radius: 3px; font-size: 8pt; font-weight: 600; margin-top: 3mm; }
        .footer { margin-top: auto; text-align: center; font-size: 7pt; color: #666; border-top: 0.5px solid #333; padding-top: 3mm; margin-top: 6mm; }
        .footer .thanks { font-size: 9pt; color: #b8860b; font-weight: 600; margin-bottom: 1mm; }
      </style>
    </head><body>
      <div class="header">
        <div class="brand">HIGH SOCIETY BOTANICALS</div>
        <div class="sub">FACTURE — highsocietybotanicals.com</div>
      </div>
      <div class="info">
        <div><span class="num">${esc(orderNum)}</span></div>
        <div>${date}</div>
      </div>
      <div class="client">
        <div class="cname">${esc(orderData.guest_name || "Client")}</div>
        ${orderData.guest_phone ? `<div><span class="label">Tél :</span> ${esc(orderData.guest_phone)}</div>` : ""}
        ${orderData.guest_email ? `<div><span class="label">Email :</span> ${esc(orderData.guest_email)}</div>` : ""}
        <div><span class="label">Mode :</span> Remise en main propre</div>
      </div>
      <table>
        <thead><tr><th>Produit</th><th>Qté</th><th>P.U.</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="total">
        <span>TOTAL TTC</span>
        <span class="amount">${orderData.total_amount.toFixed(2)}€</span>
      </div>
      <div class="badge">✅ PAYÉ — Remise en main propre</div>
      <div class="footer">
        <div class="thanks">Merci pour votre confiance ! 🌿</div>
        <div>High Society Botanicals — France</div>
      </div>
    </body></html>`;
  };

  const downloadInvoice = (orderData: any, items: any[]) => {
    const html = buildInvoiceHtml(orderData, items);
    const w = window.open("", "_blank", "width=500,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

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
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          delivery_type: "personal",
          total_amount: totalAmount,
          total_flower_weight: totalFlowerWeight,
          payment_status: "unpaid",
          status: "preparing",
          guest_name: customerName.trim(),
          guest_email: customerEmail.trim() || null,
          guest_phone: customerPhone.trim() || null,
        })
        .select("id, display_order_number, order_number, created_at, total_amount, guest_name, guest_email, guest_phone")
        .single();

      if (orderError) throw orderError;

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

      setLastCreatedOrder({ ...order, items });
      toast({ title: "Commande créée ✅", description: `${order.display_order_number} — En préparation, en attente de paiement` });
      queryClient.invalidateQueries({ queryKey: ["admin"] });

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setLines([{ productId: "", weight: 1 }]);
      clearPromo();
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

          {/* Promo code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-gold" /> Code promo (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <Input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); setPromoDiscount(null); }}
                placeholder="Ex: WELCOME10"
                className="w-48 uppercase"
                disabled={promoDiscount !== null}
              />
              {promoDiscount === null ? (
                <Button variant="outline" size="sm" onClick={validatePromoCode} disabled={!promoCode.trim() || isValidatingPromo}>
                  {isValidatingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={clearPromo} className="text-destructive">
                  Retirer
                </Button>
              )}
            </div>
            {promoError && <p className="text-xs text-destructive">{promoError}</p>}
            {promoDiscount !== null && (
              <p className="text-xs text-green-500">✅ -{promoDiscount}% appliqué (-{discountAmount.toFixed(2)}€)</p>
            )}
          </div>

          {/* Total & submit */}
          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            <div>
              {promoDiscount !== null && (
                <div className="text-sm text-muted-foreground line-through">{subtotal.toFixed(2)}€</div>
              )}
              <span className="text-sm text-muted-foreground">Total : </span>
              <span className="text-2xl font-bold text-primary">{totalAmount.toFixed(2)}€</span>
            </div>
            <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Créer la commande
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 La commande sera créée en statut "En préparation" et "Non payée". Passez-la en "Payée" dans le tableau des commandes pour générer la facture et l'envoyer au client.
          </p>

          {/* Last created order - download invoice */}
          {lastCreatedOrder && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-primary">
                  Dernière commande : {lastCreatedOrder.display_order_number}
                </span>
                <p className="text-xs text-muted-foreground">En attente de paiement</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadInvoice(lastCreatedOrder, lastCreatedOrder.items)}
                className="gap-2 border-primary/30 text-primary"
              >
                <FileText className="h-4 w-4" />
                Aperçu facture
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default ManualOrderCreator;
