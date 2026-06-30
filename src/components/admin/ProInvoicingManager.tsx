import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Receipt, Plus, Trash2, FileText, Download, CheckCircle2, Building2, RefreshCw } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

interface Partner {
  id: string;
  name: string;
  siret: string | null;
  vat_number: string | null;
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  commission_percent: number;
  notes: string | null;
  is_active: boolean;
}

interface Deposit {
  id: string;
  partner_id: string;
  product_name: string;
  weight_grams: number | null;
  quantity: number;
  retail_price_ttc: number;
  sold_at: string;
  invoice_id: string | null;
  notes: string | null;
}

interface ProInvoice {
  id: string;
  partner_id: string;
  invoice_number: string;
  issued_at: string;
  due_date: string | null;
  status: string;
  commission_percent: number;
  total_retail_ttc: number;
  total_invoiced_ht: number;
  total_vat: number;
  total_invoiced_ttc: number;
  pdf_path: string | null;
  paid_at: string | null;
}

const emptyPartner = {
  name: "", siret: "", vat_number: "", address_line1: "", postal_code: "", city: "",
  email: "", phone: "", commission_percent: 30, notes: "", is_active: true,
};

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-500",
  paid: "bg-green-500/20 text-green-500",
  cancelled: "bg-destructive/20 text-destructive",
};

export default function ProInvoicingManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { prices: productList } = useProducts();
  const [tab, setTab] = useState("partners");
  const [editingPartner, setEditingPartner] = useState<Partial<Partner> | null>(null);
  const [partnerOpen, setPartnerOpen] = useState(false);

  // ---- queries
  const { data: partners = [] } = useQuery({
    queryKey: ["pro_partners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pro_partners").select("*").order("name");
      if (error) throw error;
      return data as Partner[];
    },
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ["pro_deposits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pro_deposits").select("*").order("sold_at", { ascending: false });
      if (error) throw error;
      return data as Deposit[];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["pro_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pro_invoices").select("*").order("issued_at", { ascending: false });
      if (error) throw error;
      return data as ProInvoice[];
    },
  });

  // ---- partner mutations
  const savePartner = useMutation({
    mutationFn: async (p: Partial<Partner>) => {
      if (p.id) {
        const { error } = await supabase.from("pro_partners").update(p).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pro_partners").insert(p as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_partners"] });
      setPartnerOpen(false);
      setEditingPartner(null);
      toast({ title: "Partenaire enregistré" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deletePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pro_partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_partners"] });
      toast({ title: "Partenaire supprimé" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // ---- deposit form
  const [newDeposit, setNewDeposit] = useState({
    partner_id: "", product_name: "", weight_grams: "", quantity: "1",
    retail_price_ttc: "", sold_at: new Date().toISOString().slice(0, 10), notes: "",
  });

  const addDeposit = useMutation({
    mutationFn: async () => {
      if (!newDeposit.partner_id || !newDeposit.product_name || !newDeposit.retail_price_ttc) {
        throw new Error("Partenaire, produit et prix TTC sont requis");
      }
      const payload: any = {
        partner_id: newDeposit.partner_id,
        product_name: newDeposit.product_name,
        weight_grams: newDeposit.weight_grams ? Number(newDeposit.weight_grams) : null,
        quantity: Number(newDeposit.quantity || 1),
        retail_price_ttc: Number(newDeposit.retail_price_ttc),
        sold_at: newDeposit.sold_at,
        notes: newDeposit.notes || null,
      };
      const { error } = await supabase.from("pro_deposits").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_deposits"] });
      setNewDeposit({ ...newDeposit, product_name: "", weight_grams: "", retail_price_ttc: "", notes: "" });
      toast({ title: "Vente ajoutée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteDeposit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pro_deposits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_deposits"] });
      toast({ title: "Ligne supprimée" });
    },
  });

  // ---- invoice generation
  const [selectedDeposits, setSelectedDeposits] = useState<Set<string>>(new Set());
  const [filterPartner, setFilterPartner] = useState<string>("all");

  const filteredDeposits = useMemo(() => {
    return deposits.filter(d => filterPartner === "all" || d.partner_id === filterPartner);
  }, [deposits, filterPartner]);

  const unbilledDeposits = filteredDeposits.filter(d => !d.invoice_id);

  const generateInvoice = useMutation({
    mutationFn: async () => {
      if (selectedDeposits.size === 0) throw new Error("Sélectionne au moins une ligne");
      const lines = deposits.filter(d => selectedDeposits.has(d.id));
      const partnerIds = new Set(lines.map(l => l.partner_id));
      if (partnerIds.size > 1) throw new Error("Toutes les lignes doivent appartenir au même partenaire");
      const partnerId = lines[0].partner_id;
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) throw new Error("Partenaire introuvable");

      // create invoice
      const { data: inv, error: invErr } = await supabase
        .from("pro_invoices")
        .insert({
          partner_id: partnerId,
          commission_percent: partner.commission_percent,
          status: "draft",
        } as any)
        .select()
        .single();
      if (invErr) throw invErr;

      // attach deposits
      const { error: updErr } = await supabase
        .from("pro_deposits")
        .update({ invoice_id: inv.id })
        .in("id", Array.from(selectedDeposits));
      if (updErr) throw updErr;

      // call edge function to generate PDF + totals
      const { data, error } = await supabase.functions.invoke("generate-pro-invoice", {
        body: { invoiceId: inv.id },
      });
      if (error) throw error;

      // open PDF
      if (data?.pdfBase64) {
        const blob = await (await fetch(`data:application/pdf;base64,${data.pdfBase64}`)).blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      }
      return inv;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_deposits"] });
      qc.invalidateQueries({ queryKey: ["pro_invoices"] });
      setSelectedDeposits(new Set());
      setTab("invoices");
      toast({ title: "Facture générée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const regeneratePdf = async (inv: ProInvoice, forceDirect = false) => {
    if (forceDirect && Number(inv.commission_percent) !== 0) {
      const { error: updateErr } = await supabase
        .from("pro_invoices")
        .update({ commission_percent: 0, pdf_path: null })
        .eq("id", inv.id);
      if (updateErr) {
        toast({ title: "Erreur", description: updateErr.message, variant: "destructive" });
        return;
      }
    }

    const { data, error } = await supabase.functions.invoke("generate-pro-invoice", {
      body: { invoiceId: inv.id },
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    if (data?.pdfBase64) {
      const blob = await (await fetch(`data:application/pdf;base64,${data.pdfBase64}`)).blob();
      window.open(URL.createObjectURL(blob), "_blank");
    }
    qc.invalidateQueries({ queryKey: ["pro_invoices"] });
  };

  const downloadPdf = async (inv: ProInvoice) => {
    if (!inv.pdf_path || Number(inv.commission_percent) === 0) {
      const { data, error } = await supabase.functions.invoke("generate-pro-invoice", {
        body: { invoiceId: inv.id },
      });
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      if (data?.pdfBase64) {
        const blob = await (await fetch(`data:application/pdf;base64,${data.pdfBase64}`)).blob();
        window.open(URL.createObjectURL(blob), "_blank");
      }
      qc.invalidateQueries({ queryKey: ["pro_invoices"] });
      return;
    }
    const { data, error } = await supabase.storage.from("invoices").createSignedUrl(inv.pdf_path, 300);
    if (error || !data) { toast({ title: "Erreur PDF", description: error?.message, variant: "destructive" }); return; }
    window.open(data.signedUrl, "_blank");
  };

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pro_invoices")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_invoices"] });
      toast({ title: "Facture marquée payée" });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      // detach deposits
      await supabase.from("pro_deposits").update({ invoice_id: null }).eq("invoice_id", id);
      const { error } = await supabase.from("pro_invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_invoices"] });
      qc.invalidateQueries({ queryKey: ["pro_deposits"] });
      toast({ title: "Facture supprimée" });
    },
  });

  // ---- direct (no-deposit) invoice
  const [directOpen, setDirectOpen] = useState(false);
  const [directPartner, setDirectPartner] = useState<string>("");
  const [directDue, setDirectDue] = useState<string>("");
  const [directLines, setDirectLines] = useState<Array<{
    product_name: string; weight_grams: string; quantity: string; price_ht_per_g: string; total_ttc: string;
  }>>([{ product_name: "", weight_grams: "", quantity: "1", price_ht_per_g: "", total_ttc: "" }]);

  const resetDirect = () => {
    setDirectPartner(""); setDirectDue("");
    setDirectLines([{ product_name: "", weight_grams: "", quantity: "1", price_ht_per_g: "", total_ttc: "" }]);
  };


  const createDirectInvoice = useMutation({
    mutationFn: async () => {
      if (!directPartner) throw new Error("Sélectionne un partenaire");
      const valid = directLines.filter(l => l.product_name && Number(l.total_ttc) > 0);
      if (valid.length === 0) throw new Error("Ajoute au moins une ligne valide");

      // Vente directe = 100% facturé (pas de commission/dépôt)
      const today = new Date().toISOString().slice(0, 10);
      const { data: inv, error: invErr } = await supabase
        .from("pro_invoices")
        .insert({
          partner_id: directPartner,
          commission_percent: 0,
          status: "draft",
          due_date: directDue || null,
        } as any)
        .select()
        .single();
      if (invErr) throw invErr;

      const payload = valid.map(l => ({
        partner_id: directPartner,
        product_name: l.product_name,
        weight_grams: l.weight_grams ? Number(l.weight_grams) : null,
        quantity: Number(l.quantity || 1),
        retail_price_ttc: Number(l.total_ttc),
        sold_at: today,
        invoice_id: inv.id,
      }));
      const { error: depErr } = await supabase.from("pro_deposits").insert(payload);
      if (depErr) throw depErr;

      const { data, error } = await supabase.functions.invoke("generate-pro-invoice", {
        body: { invoiceId: inv.id },
      });
      if (error) throw error;
      if (data?.pdfBase64) {
        const blob = await (await fetch(`data:application/pdf;base64,${data.pdfBase64}`)).blob();
        window.open(URL.createObjectURL(blob), "_blank");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pro_invoices"] });
      qc.invalidateQueries({ queryKey: ["pro_deposits"] });
      setDirectOpen(false);
      resetDirect();
      toast({ title: "Facture directe générée" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  // ---- KPIs per partner
  const kpisByPartner = useMemo(() => {
    return partners.map(p => {
      const pDeposits = deposits.filter(d => d.partner_id === p.id);
      const pInvoices = invoices.filter(i => i.partner_id === p.id);
      const unbilled = pDeposits.filter(d => !d.invoice_id);
      const sellerShare = (100 - p.commission_percent) / 100;
      const caTotal = pDeposits.reduce((s, d) => s + Number(d.retail_price_ttc), 0);
      const toBill = unbilled.reduce((s, d) => s + Number(d.retail_price_ttc) * sellerShare, 0);
      const billed = pInvoices.reduce((s, i) => s + Number(i.total_invoiced_ttc), 0);
      const paid = pInvoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total_invoiced_ttc), 0);
      return { partner: p, caTotal, toBill, billed, paid };
    });
  }, [partners, deposits, invoices]);

  const exportCSV = () => {
    const rows = [
      ["N° facture", "Partenaire", "Date", "Statut", "PV public TTC", "HT", "TVA", "TTC facturé", "Payée le"],
      ...invoices.map(i => {
        const p = partners.find(x => x.id === i.partner_id);
        return [
          i.invoice_number,
          p?.name || "",
          i.issued_at,
          i.status,
          Number(i.total_retail_ttc).toFixed(2),
          Number(i.total_invoiced_ht).toFixed(2),
          Number(i.total_vat).toFixed(2),
          Number(i.total_invoiced_ttc).toFixed(2),
          i.paid_at ? new Date(i.paid_at).toLocaleDateString("fr-FR") : "",
        ];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `factures-pro-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <Card className="border-gold/20 mb-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gold" />
          Facturation Pro / Dépôt-vente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="partners">Partenaires</TabsTrigger>
            <TabsTrigger value="deposits">Ventes en dépôt</TabsTrigger>
            <TabsTrigger value="invoices">Factures & Commissions</TabsTrigger>
          </TabsList>

          {/* ============== PARTNERS ============== */}
          <TabsContent value="partners" className="space-y-4 pt-4">
            <div className="flex justify-end">
              <Dialog open={partnerOpen} onOpenChange={setPartnerOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPartner(emptyPartner as any)} className="gap-2">
                    <Plus className="h-4 w-4" /> Ajouter un tabac
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingPartner?.id ? "Modifier" : "Nouveau"} partenaire</DialogTitle>
                  </DialogHeader>
                  {editingPartner && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>Nom *</Label>
                        <Input value={editingPartner.name || ""} onChange={e => setEditingPartner({ ...editingPartner, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>SIRET</Label>
                        <Input value={editingPartner.siret || ""} onChange={e => setEditingPartner({ ...editingPartner, siret: e.target.value })} />
                      </div>
                      <div>
                        <Label>N° TVA Intra</Label>
                        <Input value={editingPartner.vat_number || ""} onChange={e => setEditingPartner({ ...editingPartner, vat_number: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <Label>Adresse</Label>
                        <Input value={editingPartner.address_line1 || ""} onChange={e => setEditingPartner({ ...editingPartner, address_line1: e.target.value })} />
                      </div>
                      <div>
                        <Label>Code postal</Label>
                        <Input value={editingPartner.postal_code || ""} onChange={e => setEditingPartner({ ...editingPartner, postal_code: e.target.value })} />
                      </div>
                      <div>
                        <Label>Ville</Label>
                        <Input value={editingPartner.city || ""} onChange={e => setEditingPartner({ ...editingPartner, city: e.target.value })} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={editingPartner.email || ""} onChange={e => setEditingPartner({ ...editingPartner, email: e.target.value })} />
                      </div>
                      <div>
                        <Label>Téléphone</Label>
                        <Input value={editingPartner.phone || ""} onChange={e => setEditingPartner({ ...editingPartner, phone: e.target.value })} />
                      </div>
                      <div>
                        <Label>% Commission tabac</Label>
                        <Input type="number" step="0.5" value={editingPartner.commission_percent ?? 30} onChange={e => setEditingPartner({ ...editingPartner, commission_percent: Number(e.target.value) })} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Tu factureras {(100 - (editingPartner.commission_percent ?? 30))}% du PV public TTC
                        </p>
                      </div>
                      <div className="col-span-2">
                        <Label>Notes</Label>
                        <Textarea rows={2} value={editingPartner.notes || ""} onChange={e => setEditingPartner({ ...editingPartner, notes: e.target.value })} />
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPartnerOpen(false)}>Annuler</Button>
                    <Button onClick={() => editingPartner && savePartner.mutate(editingPartner)} disabled={savePartner.isPending}>
                      Enregistrer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {partners.map(p => {
                const kpi = kpisByPartner.find(k => k.partner.id === p.id);
                return (
                  <Card key={p.id} className="border-gold/10">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gold" /> {p.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {p.city} · Commission {p.commission_percent}% · Tu factures {100 - p.commission_percent}%
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setEditingPartner(p); setPartnerOpen(true); }}>
                            Modifier
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            if (confirm(`Supprimer ${p.name} ?`)) deletePartner.mutate(p.id);
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {kpi && (
                        <div className="grid grid-cols-3 gap-2 text-xs mt-3 pt-3 border-t border-border">
                          <div>
                            <div className="text-muted-foreground">À facturer</div>
                            <div className="font-semibold text-gold">{kpi.toBill.toFixed(2)} €</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Facturé</div>
                            <div className="font-semibold">{kpi.billed.toFixed(2)} €</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Payé</div>
                            <div className="font-semibold text-green-500">{kpi.paid.toFixed(2)} €</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {partners.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
                  Aucun partenaire. Ajoute ton premier tabac.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ============== DEPOSITS ============== */}
          <TabsContent value="deposits" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ajouter une vente en dépôt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Partenaire</Label>
                    <Select value={newDeposit.partner_id} onValueChange={v => setNewDeposit({ ...newDeposit, partner_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                      <SelectContent>
                        {partners.filter(p => p.is_active).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Produit</Label>
                    <Select
                      value={newDeposit.product_name}
                      onValueChange={(name) => {
                        const prod = productList.find(p => p.name === name);
                        const w = Number(newDeposit.weight_grams) || 0;
                        const q = Number(newDeposit.quantity) || 1;
                        const autoPrice = prod && w > 0 ? (prod.price * w * q).toFixed(2) : newDeposit.retail_price_ttc;
                        setNewDeposit({ ...newDeposit, product_name: name, retail_price_ttc: autoPrice });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Choisir un produit..." /></SelectTrigger>
                      <SelectContent>
                        {productList.filter(p => p.is_active).map(p => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name} — {p.price}€/g
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Poids (g)</Label>
                    <Input type="number" step="0.5" value={newDeposit.weight_grams} onChange={e => {
                      const w = Number(e.target.value) || 0;
                      const q = Number(newDeposit.quantity) || 1;
                      const prod = productList.find(p => p.name === newDeposit.product_name);
                      const autoPrice = prod && w > 0 ? (prod.price * w * q).toFixed(2) : newDeposit.retail_price_ttc;
                      setNewDeposit({ ...newDeposit, weight_grams: e.target.value, retail_price_ttc: autoPrice });
                    }} />
                  </div>
                  <div>
                    <Label className="text-xs">Qté</Label>
                    <Input type="number" value={newDeposit.quantity} onChange={e => {
                      const q = Number(e.target.value) || 1;
                      const w = Number(newDeposit.weight_grams) || 0;
                      const prod = productList.find(p => p.name === newDeposit.product_name);
                      const autoPrice = prod && w > 0 ? (prod.price * w * q).toFixed(2) : newDeposit.retail_price_ttc;
                      setNewDeposit({ ...newDeposit, quantity: e.target.value, retail_price_ttc: autoPrice });
                    }} />
                  </div>
                  <div>
                    <Label className="text-xs">PV public TTC (total)</Label>
                    <Input type="number" step="0.01" value={newDeposit.retail_price_ttc} onChange={e => setNewDeposit({ ...newDeposit, retail_price_ttc: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Date vente</Label>
                    <Input type="date" value={newDeposit.sold_at} onChange={e => setNewDeposit({ ...newDeposit, sold_at: e.target.value })} />
                  </div>
                  <div className="col-span-2 md:col-span-3">
                    <Label className="text-xs">Notes</Label>
                    <Input value={newDeposit.notes} onChange={e => setNewDeposit({ ...newDeposit, notes: e.target.value })} />
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-end">
                    <Button className="w-full gap-2" onClick={() => addDeposit.mutate()} disabled={addDeposit.isPending}>
                      <Plus className="h-4 w-4" /> Ajouter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Select value={filterPartner} onValueChange={setFilterPartner}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les partenaires</SelectItem>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                disabled={selectedDeposits.size === 0 || generateInvoice.isPending}
                onClick={() => generateInvoice.mutate()}
                className="gap-2"
              >
                <FileText className="h-4 w-4" /> Générer facture ({selectedDeposits.size})
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Qté</TableHead>
                  <TableHead className="text-right">PV TTC</TableHead>
                  <TableHead className="text-right">À facturer</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map(d => {
                  const p = partners.find(x => x.id === d.partner_id);
                  const share = p ? (100 - p.commission_percent) / 100 : 0.7;
                  const toBill = Number(d.retail_price_ttc) * share;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        {!d.invoice_id && (
                          <Checkbox
                            checked={selectedDeposits.has(d.id)}
                            onCheckedChange={(c) => {
                              const s = new Set(selectedDeposits);
                              if (c) s.add(d.id); else s.delete(d.id);
                              setSelectedDeposits(s);
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(d.sold_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-xs">{p?.name || "—"}</TableCell>
                      <TableCell className="text-xs">{d.product_name}</TableCell>
                      <TableCell className="text-xs">{d.weight_grams ? `${d.weight_grams}g` : `x${d.quantity}`}</TableCell>
                      <TableCell className="text-right text-xs">{Number(d.retail_price_ttc).toFixed(2)} €</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-gold">{toBill.toFixed(2)} €</TableCell>
                      <TableCell>
                        {d.invoice_id ? (
                          <Badge className="bg-green-500/20 text-green-500 text-[10px]">Facturée</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">À facturer</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!d.invoice_id && (
                          <Button size="sm" variant="ghost" onClick={() => deleteDeposit.mutate(d.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDeposits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                      Aucune vente enregistrée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* ============== INVOICES ============== */}
          <TabsContent value="invoices" className="space-y-4 pt-4">
            <div className="flex justify-end gap-2">
              <Dialog open={directOpen} onOpenChange={(o) => { setDirectOpen(o); if (!o) resetDirect(); }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Nouvelle facture directe (B2B)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Facture pro directe — vente classique (100%)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Client professionnel *</Label>
                        <Select value={directPartner} onValueChange={setDirectPartner}>
                          <SelectTrigger><SelectValue placeholder="Choisir un partenaire" /></SelectTrigger>
                          <SelectContent>
                            {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Pas dans la liste ? Crée-le dans l'onglet "Partenaires".
                        </p>
                      </div>
                      <div>
                        <Label>Échéance</Label>
                        <Input type="date" value={directDue} onChange={e => setDirectDue(e.target.value)} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Lignes</Label>
                      {directLines.map((l, idx) => {
                        const recompute = (arr: typeof directLines, i: number) => {
                          const w = Number(arr[i].weight_grams || 0);
                          const q = Number(arr[i].quantity || 1);
                          const ht = Number(arr[i].price_ht_per_g || 0);
                          if (w > 0 && ht > 0) arr[i].total_ttc = (ht * 1.2 * w * q).toFixed(2);
                        };
                        return (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Select
                              value={l.product_name}
                              onValueChange={(v) => {
                                const arr = [...directLines];
                                arr[idx].product_name = v;
                                const prod = productList.find((p: any) => p.name === v);
                                if (prod && !arr[idx].price_ht_per_g) {
                                  arr[idx].price_ht_per_g = (prod.price / 1.2).toFixed(2);
                                }
                                recompute(arr, idx);
                                setDirectLines(arr);
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Produit" /></SelectTrigger>
                              <SelectContent>
                                {productList.map((p: any) => (
                                  <SelectItem key={p.id} value={p.name}>{p.name} ({p.price}€/g TTC)</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Poids g"
                              type="number" step="0.1"
                              value={l.weight_grams}
                              onChange={e => {
                                const arr = [...directLines];
                                arr[idx].weight_grams = e.target.value;
                                recompute(arr, idx);
                                setDirectLines(arr);
                              }}
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              placeholder="Qté"
                              type="number" min="1"
                              value={l.quantity}
                              onChange={e => {
                                const arr = [...directLines];
                                arr[idx].quantity = e.target.value;
                                recompute(arr, idx);
                                setDirectLines(arr);
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="PU HT €/g"
                              type="number" step="0.01"
                              value={l.price_ht_per_g}
                              onChange={e => {
                                const arr = [...directLines];
                                arr[idx].price_ht_per_g = e.target.value;
                                recompute(arr, idx);
                                setDirectLines(arr);
                              }}
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Total TTC €"
                              type="number" step="0.01"
                              value={l.total_ttc}
                              onChange={e => {
                                const arr = [...directLines];
                                arr[idx].total_ttc = e.target.value;
                                setDirectLines(arr);
                              }}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              size="icon" variant="ghost"
                              onClick={() => setDirectLines(directLines.filter((_, i) => i !== idx))}
                              disabled={directLines.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        );
                      })}
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setDirectLines([...directLines, { product_name: "", weight_grams: "", quantity: "1", price_ht_per_g: "", total_ttc: "" }])}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" /> Ajouter une ligne
                      </Button>

                    </div>

                    <div className="text-right text-sm border-t border-gold/20 pt-3 space-y-1">
                      {(() => {
                        const ttc = directLines.reduce((s, l) => s + Number(l.total_ttc || 0), 0);
                        const ht = ttc / 1.2;
                        const tva = ttc - ht;
                        return (
                          <>
                            <div><span className="text-muted-foreground mr-3">Total HT :</span><span className="font-medium">{ht.toFixed(2)} €</span></div>
                            <div><span className="text-muted-foreground mr-3">TVA 20% :</span><span className="font-medium">{tva.toFixed(2)} €</span></div>
                            <div><span className="text-muted-foreground mr-3">Total TTC :</span><span className="font-bold text-gold text-lg">{ttc.toFixed(2)} €</span></div>
                          </>
                        );
                      })()}
                    </div>

                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDirectOpen(false)}>Annuler</Button>
                    <Button onClick={() => createDirectInvoice.mutate()} disabled={createDirectInvoice.isPending}>
                      Générer la facture
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportCSV} className="gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">PV public TTC</TableHead>
                  <TableHead className="text-right">HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">TTC à régler</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map(i => {
                  const p = partners.find(x => x.id === i.partner_id);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                      <TableCell className="text-xs">{p?.name || "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(i.issued_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right text-xs">
                        <div>{Number(i.total_retail_ttc).toFixed(2)} €</div>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {Number(i.commission_percent) === 0 ? "B2B direct 100%" : `Dépôt ${100 - Number(i.commission_percent)}%`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">{Number(i.total_invoiced_ht).toFixed(2)} €</TableCell>
                      <TableCell className="text-right text-xs">{Number(i.total_vat).toFixed(2)} €</TableCell>
                      <TableCell className="text-right text-xs font-bold text-gold">{Number(i.total_invoiced_ttc).toFixed(2)} €</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_BADGE[i.status]} text-[10px]`}>{i.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" title="PDF" onClick={() => downloadPdf(i)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Régénérer le PDF" onClick={() => regeneratePdf(i)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          {Number(i.commission_percent) !== 0 && (
                            <Button size="sm" variant="ghost" title="Corriger en facture directe B2B 100%" onClick={() => regeneratePdf(i, true)}>
                              100%
                            </Button>
                          )}
                          {i.status !== "paid" && (
                            <Button size="sm" variant="ghost" title="Marquer payée" onClick={() => markPaid.mutate(i.id)}>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" title="Supprimer" onClick={() => {
                            if (confirm(`Supprimer la facture ${i.invoice_number} ?`)) deleteInvoice.mutate(i.id);
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-6">
                      Aucune facture émise
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
