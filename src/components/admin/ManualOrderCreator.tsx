import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, CreditCard, UserPlus, FileText, Tag, Gift, Users, Check, ChevronsUpDown, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allProducts } from "@/data/products";
import { accessories } from "@/data/accessories";
import { useProducts } from "@/hooks/useProducts";
import { calculateCumulativeItemPrice } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderLine {
  productId: string;
  weight: number;
  /** Prix TTC forcé pour la ligne (null = tarif automatique) */
  priceOverride: number | null;
}

interface SampleLine {
  productId: string;
}

const ManualOrderCreator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { prices } = useProducts();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [settlement, setSettlement] = useState<"physical" | "transfer" | "paid">("physical");

  const [lines, setLines] = useState<OrderLine[]>([{ productId: "", weight: 1, priceOverride: null }]);
  const [sampleLines, setSampleLines] = useState<SampleLine[]>([]);
  const [includeGifts, setIncludeGifts] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoError, setPromoError] = useState("");
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<any>(null);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);

  type KnownCustomer = {
    key: string;
    name: string;
    email: string;
    phone: string;
    address: string;
  };

  const { data: knownCustomers = [], isLoading: isLoadingCustomers } = useQuery<KnownCustomer[]>({
    queryKey: ["admin", "known-customers"],
    enabled: customerPickerOpen,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name,email,phone,address_line1,city,postal_code"),
        supabase
          .from("orders")
          .select("guest_name,guest_email,guest_phone,delivery_address,created_at")
          .not("guest_name", "is", null)
          .order("created_at", { ascending: false })
          .limit(500),
      ]);

      const map = new Map<string, KnownCustomer>();
      const norm = (s?: string | null) => (s || "").trim();
      const keyFor = (email: string, phone: string, name: string) =>
        (email.toLowerCase() || phone.replace(/\s+/g, "") || name.toLowerCase()).trim();

      for (const p of profilesRes.data || []) {
        const name = norm(p.full_name);
        const email = norm(p.email);
        const phone = norm(p.phone);
        const addr = [norm(p.address_line1), norm(p.postal_code), norm(p.city)]
          .filter(Boolean)
          .join(", ");
        if (!name && !email && !phone) continue;
        const k = keyFor(email, phone, name);
        if (!k) continue;
        if (!map.has(k)) {
          map.set(k, { key: k, name: name || email || phone, email, phone, address: addr });
        }
      }

      for (const o of ordersRes.data || []) {
        const name = norm(o.guest_name);
        const email = norm(o.guest_email);
        const phone = norm(o.guest_phone);
        const addr = norm(o.delivery_address);
        if (!name && !email && !phone) continue;
        const k = keyFor(email, phone, name);
        if (!k) continue;
        if (!map.has(k)) {
          map.set(k, { key: k, name: name || email || phone, email, phone, address: addr });
        } else {
          // enrich missing fields with most recent order data
          const existing = map.get(k)!;
          if (!existing.address && addr) existing.address = addr;
          if (!existing.phone && phone) existing.phone = phone;
          if (!existing.email && email) existing.email = email;
        }
      }

      return Array.from(map.values()).sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      );
    },
  });

  const selectCustomer = (c: KnownCustomer) => {
    setCustomerName(c.name);
    setCustomerEmail(c.email);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address);
    setCustomerPickerOpen(false);
  };

  const clearCustomer = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
  };

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

  const addLine = () => setLines([...lines, { productId: "", weight: 1, priceOverride: null }]);
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: keyof OrderLine, value: string | number | null) => {
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

  /** Accessoire (briquet, feuilles, pochons) : facturé à l'unité */
  const getAccessory = (productId: string) => accessories.find(a => a.id === productId);
  const isAccessory = (productId: string) => !!getAccessory(productId);

  /** Poids cumulé par groupe de prix (fleurs + résines, hors accessoires) */
  const groupWeights = lines.reduce<Record<string, number>>((acc, l) => {
    if (!l.productId || l.weight <= 0) return acc;
    if (isAccessory(l.productId)) return acc;
    const g = getProductGroup(l.productId);
    acc[g] = (acc[g] || 0) + l.weight;
    return acc;
  }, {});

  /** Tarif automatique (grille dégressive cumulée par groupe, ou prix unitaire accessoire) */
  const autoLineTotal = (line: OrderLine) => {
    if (!line.productId || line.weight <= 0) return 0;
    const acc = getAccessory(line.productId);
    if (acc) return acc.price * line.weight;
    const base = getProductPrice(line.productId);
    const group = getProductGroup(line.productId);
    const cumul = groupWeights[group] || line.weight;
    return calculateCumulativeItemPrice(base, line.weight, cumul, group, line.productId).finalPrice;
  };


  const calculateLineTotal = (line: OrderLine) => {
    if (!line.productId || line.weight <= 0) return 0;
    if (line.priceOverride != null && line.priceOverride >= 0) return line.priceOverride;
    return autoLineTotal(line);
  };

  const linePricePerGram = (line: OrderLine) =>
    line.weight > 0 ? calculateLineTotal(line) / line.weight : 0;

  /** Changement de produit : on repart sur le tarif automatique */
  const changeLineProduct = (idx: number, productId: string) => {
    setLines(lines.map((l, i) => i === idx ? { ...l, productId, priceOverride: null } : l));
  };

  /** Changement de poids : si prix forcé, on conserve le €/g saisi */
  const changeLineWeight = (idx: number, weight: number) => {
    setLines(lines.map((l, i) => {
      if (i !== idx) return l;
      if (l.priceOverride != null && l.weight > 0) {
        const perGram = l.priceOverride / l.weight;
        return { ...l, weight, priceOverride: Number((perGram * weight).toFixed(2)) };
      }
      return { ...l, weight };
    }));
  };


  const subtotal = lines.reduce((sum, l) => sum + calculateLineTotal(l), 0);
  const discountAmount = promoDiscount ? subtotal * (promoDiscount / 100) : 0;
  const totalAmount = subtotal - discountAmount;
  const totalFlowerWeight = lines.reduce((sum, l) => {
    const product = allProducts.find(p => p.id === l.productId);
    if (!product || product.category !== "fleur") return sum;
    return sum + l.weight;
  }, 0);

  // Nombre d'échantillons autorisés (1 par tranche de 10g de fleurs)
  const allowedSamples = Math.floor(totalFlowerWeight / 10);
  // Nombre de kits cadeaux (feuilles + briquet par tranche de 10g)
  const giftKitsCount = includeGifts ? Math.floor(totalFlowerWeight / 10) : 0;

  // Auto-trim samples if flower weight decreases
  const effectiveSamples = sampleLines.slice(0, allowedSamples);
  if (effectiveSamples.length !== sampleLines.length) {
    // Will be trimmed on next render via the UI
  }

  const addSample = () => {
    if (effectiveSamples.length >= allowedSamples) return;
    setSampleLines(prev => [...prev, { productId: "" }]);
  };

  const removeSample = (idx: number) => {
    setSampleLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSample = (idx: number, productId: string) => {
    setSampleLines(prev => prev.map((s, i) => i === idx ? { productId } : s));
  };

  const buildInvoiceHtml = (orderData: any, items: any[]) => {
    const orderNum = orderData.display_order_number || `#${orderData.order_number?.toString().padStart(4, "0") || "0000"}`;
    const invoiceNum = `FA-${orderNum.replace("HSB-", "")}`;
    const date = new Date(orderData.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const TVA_RATE = 20;
    const totalTTC = orderData.total_amount;
    const totalHT = totalTTC / (1 + TVA_RATE / 100);
    const totalTVA = totalTTC - totalHT;

    const itemsHtml = items.map(item => {
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

    const hasPromo = promoDiscount !== null && promoDiscount > 0;

    return `<!DOCTYPE html><html><head>
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
        .payment-badge { display: inline-block; background: #fff3cd; color: #856404; padding: 2mm 4mm; border-radius: 4px; font-size: 9pt; font-weight: 600; margin-top: 4mm; }
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
            <span class="highlight">${esc(invoiceNum)}</span><br/>
            Commande : ${esc(orderNum)}<br/>
            Date : ${date}<br/>
            Mode : Remise en main propre
          </p>
        </div>
        <div class="meta-box">
          <h3>Client</h3>
          <p>
            <span class="highlight">${esc(orderData.guest_name || "Client")}</span><br/>
            ${orderData.guest_email ? `${esc(orderData.guest_email)}<br/>` : ""}
            ${orderData.guest_phone ? `Tél : ${esc(orderData.guest_phone)}<br/>` : ""}
            ${orderData.delivery_address ? `${esc(orderData.delivery_address)}` : ""}
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
        ${hasPromo ? `<div class="totals-row" style="color:#b8860b;font-weight:600;"><span class="label">Code promo ${esc(promoCode)} (-${promoDiscount}%) :</span><span class="value">-${discountAmount.toFixed(2)} €</span></div>` : ""}
        <div class="totals-row grand"><span class="label">TOTAL TTC :</span><span class="value">${totalTTC.toFixed(2)} €</span></div>
      </div>

      <div class="payment-badge">⏳ EN ATTENTE DE PAIEMENT — Remise en main propre</div>

      <div class="legal">
        High Society Botanicals — SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910
      </div>

      <div class="footer">
        <div class="thanks">Merci pour votre confiance ! 🌿</div>
        <div>High Society Botanicals — France — highsocietybotanicals.com</div>
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
          payment_status: settlement === "paid" ? "paid" : "unpaid",
          payment_method: settlement === "transfer" ? "transfer" : "physical",
          status: "preparing",

          guest_name: customerName.trim(),
          guest_email: customerEmail.trim() || null,
          guest_phone: customerPhone.trim() || null,
          delivery_address: customerAddress.trim() || null,
          promo_code: promoDiscount !== null ? promoCode : null,
          promo_discount_percent: promoDiscount ?? null,
          promo_discount_amount: promoDiscount !== null ? discountAmount : null,
        })
        .select("id, display_order_number, order_number, created_at, total_amount, guest_name, guest_email, guest_phone, delivery_address, promo_code, promo_discount_percent, promo_discount_amount")
        .single();

      if (orderError) throw orderError;

      const items: Array<{
        order_id: string;
        product_id: string;
        product_name: string;
        product_type: string;
        weight?: number | null;
        quantity?: number | null;
        unit_price: number;
        total_price: number;
      }> = validLines.map(l => {
        const lineTotal = calculateLineTotal(l);
        const acc = getAccessory(l.productId);
        if (acc) {
          return {
            order_id: order.id,
            product_id: l.productId,
            product_name: lineTotal === 0 ? `${acc.name} (Offert)` : acc.name,
            product_type: "accessory",
            weight: null,
            quantity: l.weight,
            unit_price: l.weight > 0 ? Number((lineTotal / l.weight).toFixed(4)) : 0,
            total_price: lineTotal,
          };
        }
        const product = allProducts.find(p => p.id === l.productId)!;
        return {
          order_id: order.id,
          product_id: l.productId,
          product_name: product.name,
          product_type: product.category,
          weight: l.weight,
          // Prix au gramme réellement pratiqué (prix forcé inclus)
          unit_price: l.weight > 0 ? Number((lineTotal / l.weight).toFixed(4)) : 0,
          total_price: lineTotal,
        };
      });

      // Add sample items (1g gratuit par tranche de 10g)
      const validSamples = effectiveSamples.filter(s => s.productId);
      validSamples.forEach(s => {
        const product = allProducts.find(p => p.id === s.productId);
        if (product) {
          items.push({
            order_id: order.id,
            product_id: s.productId,
            product_name: `${product.name} (Échantillon)`,
            product_type: "sample",
            weight: 1,
            unit_price: 0,
            total_price: 0,
          });
        }
      });

      // Add gift kits (feuilles + briquet par tranche de 10g)
      if (giftKitsCount > 0) {
        items.push({
          order_id: order.id,
          product_id: "gift-feuilles",
          product_name: "Feuilles Slim RAW (Cadeau)",
          product_type: "gift",
          weight: null,
          quantity: giftKitsCount,
          unit_price: 0,
          total_price: 0,
        });
        items.push({
          order_id: order.id,
          product_id: "gift-briquet",
          product_name: "Briquet BIC (Cadeau)",
          product_type: "gift",
          weight: null,
          quantity: giftKitsCount,
          unit_price: 0,
          total_price: 0,
        });
      }

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) throw itemsError;

      setLastCreatedOrder({ ...order, items });
      toast({ title: "Commande créée ✅", description: `${order.display_order_number} — En préparation, en attente de paiement` });
      queryClient.invalidateQueries({ queryKey: ["admin"] });

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
      setLines([{ productId: "", weight: 1, priceOverride: null }]);
      setSampleLines([]);
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
          {/* Customer picker */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gold" /> Client existant (optionnel)
              </label>
              <Popover open={customerPickerOpen} onOpenChange={setCustomerPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {customerName
                        ? `${customerName}${customerEmail ? ` — ${customerEmail}` : customerPhone ? ` — ${customerPhone}` : ""}`
                        : "Rechercher un client (nom ou email)..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command
                    filter={(value, search) =>
                      value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
                    }
                  >
                    <CommandInput placeholder="Tapez nom, email ou téléphone..." />
                    <CommandList>
                      {isLoadingCustomers ? (
                        <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
                        </div>
                      ) : (
                        <>
                          <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                          <CommandGroup>
                            {knownCustomers.map((c) => (
                              <CommandItem
                                key={c.key}
                                value={`${c.name} ${c.email} ${c.phone}`}
                                onSelect={() => selectCustomer(c)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    customerName === c.name && customerEmail === c.email
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{c.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {[c.email, c.phone].filter(Boolean).join(" • ") || "—"}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {(customerName || customerEmail || customerPhone || customerAddress) && (
              <Button variant="ghost" size="sm" onClick={clearCustomer} className="gap-1 text-destructive">
                <X className="h-4 w-4" /> Effacer
              </Button>
            )}
          </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-muted-foreground mb-1 block">Adresse (optionnel)</label>
              <Input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Adresse complète du client" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Règlement</label>
              <Select value={settlement} onValueChange={(v: any) => setSettlement(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical">Physique (espèces / TPE)</SelectItem>
                  <SelectItem value="transfer">Virement</SelectItem>
                  <SelectItem value="paid">Déjà payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          {/* Order lines */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Produits</label>
            {lines.map((line, idx) => {
              const auto = autoLineTotal(line);
              const total = calculateLineTotal(line);
              const forced = line.priceOverride != null;
              const acc = getAccessory(line.productId);
              const isFree = !!line.productId && line.weight > 0 && total === 0;
              return (
              <div key={idx} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 p-2">
                <Select value={line.productId} onValueChange={v => changeLineProduct(idx, v)}>
                  <SelectTrigger className="flex-1 min-w-[180px]">
                    <SelectValue placeholder="Choisir un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fleurs</SelectLabel>
                      {allProducts.filter(p => p.category === "fleur").map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Résines</SelectLabel>
                      {allProducts.filter(p => p.category === "resine").map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Accessoires</SelectLabel>
                      {accessories.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} — {a.price.toFixed(2)} €
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={acc ? "1" : "0.5"}
                    step={acc ? "1" : "0.5"}
                    value={line.weight}
                    onChange={e => changeLineWeight(idx, parseFloat(e.target.value) || 0)}
                    className="w-20 h-9 text-sm"
                    aria-label={acc ? "Quantité" : "Grammage"}
                  />
                  <span className="text-sm text-muted-foreground">{acc ? "u." : "g"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={total ? Number(total.toFixed(2)) : 0}
                    onChange={e => {
                      const v = e.target.value;
                      updateLine(idx, "priceOverride", v === "" ? null : parseFloat(v) || 0);
                    }}
                    className="w-24 h-9 text-sm"
                    aria-label="Prix TTC de la ligne"
                  />
                  <span className="text-sm text-muted-foreground">€ TTC</span>
                </div>
                <div className="flex flex-col leading-tight min-w-[130px]">
                  <span className="text-sm font-medium text-primary">
                    {isFree ? "Offert" : `${linePricePerGram(line).toFixed(2)} €/${acc ? "u." : "g"}`}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {forced ? (
                      <>Prix forcé · tarif auto {auto.toFixed(2)}€ ({total - auto >= 0 ? "+" : ""}{(total - auto).toFixed(2)}€)</>
                    ) : (
                      <>Tarif automatique</>
                    )}
                  </span>
                </div>
                {forced && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateLine(idx, "priceOverride", null)}
                    className="h-8 px-2 text-xs"
                    title="Revenir au tarif automatique"
                  >
                    ↺
                  </Button>
                )}

                {lines.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeLine(idx)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              );
            })}
            <Button variant="outline" size="sm" onClick={addLine} className="gap-1">
              <Plus className="h-4 w-4" /> Ajouter un produit
            </Button>
          </div>

          {/* Échantillons & cadeaux */}
          {allowedSamples > 0 && (
            <div className="space-y-3 rounded-lg border border-gold/20 bg-gold/5 p-4">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-gold" /> Cadeaux ({Math.floor(totalFlowerWeight / 10)} tranche{Math.floor(totalFlowerWeight / 10) > 1 ? "s" : ""} de 10g)
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeGifts}
                  onChange={e => setIncludeGifts(e.target.checked)}
                  className="accent-gold"
                  id="include-gifts"
                />
                <label htmlFor="include-gifts" className="text-sm text-muted-foreground">
                  Inclure {giftKitsCount > 0 ? `${giftKitsCount}x` : ""} Feuilles Slim RAW + Briquet BIC (offerts)
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Échantillons 1g offerts : {effectiveSamples.length}/{allowedSamples} utilisé{effectiveSamples.length > 1 ? "s" : ""}
                </p>
                {effectiveSamples.map((sample, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select value={sample.productId} onValueChange={v => updateSample(idx, v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choisir un échantillon (1g)" />
                      </SelectTrigger>
                      <SelectContent>
                        {allProducts.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.category === "fleur" ? "Fleur" : "Résine"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">1g</span>
                    <span className="text-xs font-medium text-green-500">OFFERT</span>
                    <Button variant="ghost" size="sm" onClick={() => removeSample(idx)} className="text-destructive h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {effectiveSamples.length < allowedSamples && (
                  <Button variant="outline" size="sm" onClick={addSample} className="gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Ajouter un échantillon
                  </Button>
                )}
              </div>
            </div>
          )}

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
