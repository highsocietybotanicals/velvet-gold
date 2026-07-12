import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DbProduct } from "@/hooks/useDbProducts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X } from "lucide-react";

const INTENTIONS = ["detente", "creativite", "sommeil", "energie"];
const TASTES = ["boise", "fruite", "floral"];

const slugify = (s: string) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product?: DbProduct | null;
  initialProPrice?: number | null;
}

const emptyProduct: Partial<DbProduct> = {
  name: "",
  category: "fleur",
  subtitle: "",
  badge: "",
  description: "",
  price: 12,
  cbd_percentage: "",
  image_url: "",
  price_group: "A",
  is_force_noire: false,
  mood: "",
  intention_match: [],
  taste_match: [],
  terpenes: { boise: 50, fruite: 50, epice: 50, terreux: 50 },
  is_active: true,
  display_order: 0,
};

const ProductForm = ({ open, onOpenChange, product, initialProPrice }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!product;
  const [form, setForm] = useState<Partial<DbProduct>>(emptyProduct);
  const [proPrice, setProPrice] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm(product);
      setId(product.id);
      setProPrice(initialProPrice != null ? String(initialProPrice) : "");
    } else {
      setForm(emptyProduct);
      setId("");
      setProPrice("");
    }
  }, [product, initialProPrice, open]);

  const update = <K extends keyof DbProduct>(k: K, v: DbProduct[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleArray = (key: "intention_match" | "taste_match", val: string) => {
    const cur = (form[key] as string[]) || [];
    update(key, cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val]);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${id || slugify(form.name || "product")}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600", upsert: true, contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      update("image_url", data.publicUrl);
      toast({ title: "Image chargée" });
    } catch (e: any) {
      toast({ title: "Erreur upload", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast({ title: "Le nom est obligatoire", variant: "destructive" });
      return;
    }
    const finalId = isEdit ? id : slugify(form.name);
    if (!finalId) {
      toast({ title: "ID invalide", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: finalId,
        name: form.name,
        category: form.category || "fleur",
        subtitle: form.subtitle || null,
        badge: form.badge || null,
        description: form.description || null,
        price: Number(form.price) || 0,
        cbd_percentage: form.cbd_percentage || null,
        image_url: form.image_url || null,
        price_group: form.price_group || "A",
        is_force_noire: !!form.is_force_noire,
        mood: form.mood || null,
        intention_match: form.intention_match || [],
        taste_match: form.taste_match || [],
        terpenes: form.terpenes || { boise: 50, fruite: 50, epice: 50, terreux: 50 },
        is_active: form.is_active !== false,
        display_order: Number(form.display_order) || 0,
      };
      const { error } = await supabase.from("products").upsert(payload as any, { onConflict: "id" });
      if (error) throw error;

      // Pro price
      const parsedPro = proPrice ? parseFloat(proPrice) : null;
      if (parsedPro && parsedPro > 0) {
        const { error: err2 } = await supabase.from("pro_prices").upsert(
          { product_id: finalId, pro_price: parsedPro }, { onConflict: "product_id" }
        );
        if (err2) throw err2;
      } else {
        await supabase.from("pro_prices").delete().eq("product_id", finalId);
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "db-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "pro-prices"] });
      queryClient.invalidateQueries({ queryKey: ["products-prices"] });
      queryClient.invalidateQueries({ queryKey: ["pro-prices"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-db-extras"] });
      toast({ title: isEdit ? "Produit mis à jour" : "Produit créé ✅" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const terpenes = form.terpenes || { boise: 50, fruite: 50, epice: 50, terreux: 50 };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="md:col-span-2">
            <Label>Nom *</Label>
            <Input value={form.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="Ex : Amnesia Signature" />
            {!isEdit && form.name && (
              <p className="text-xs text-muted-foreground mt-1">ID auto : <code>{slugify(form.name)}</code></p>
            )}
          </div>
          <div>
            <Label>Sous-titre</Label>
            <Input value={form.subtitle || ""} onChange={(e) => update("subtitle", e.target.value)} placeholder="Sativa Dominant" />
          </div>
          <div>
            <Label>Badge</Label>
            <Input value={form.badge || ""} onChange={(e) => update("badge", e.target.value)} placeholder="Artiste Edition" />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Catégorie</Label>
            <Select value={form.category} onValueChange={(v) => update("category", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fleur">Fleur</SelectItem>
                <SelectItem value="resine">Résine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Groupe de prix</Label>
            <Select value={form.price_group} onValueChange={(v) => update("price_group", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Groupe A (standard, jusqu'à -50%)</SelectItem>
                <SelectItem value="B">Groupe B (premium, jusqu'à -35%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prix TTC / g (€)</Label>
            <Input type="number" step="0.01" value={form.price ?? ""} onChange={(e) => update("price", parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Prix Pro HT / g (€) <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
            <Input type="number" step="0.01" value={proPrice} onChange={(e) => setProPrice(e.target.value)} placeholder="—" />
          </div>
          <div>
            <Label>% CBD</Label>
            <Input value={form.cbd_percentage || ""} onChange={(e) => update("cbd_percentage", e.target.value)} placeholder="20%" />
          </div>
          <div>
            <Label>Mood</Label>
            <Input value={form.mood || ""} onChange={(e) => update("mood", e.target.value)} placeholder="Relaxation" />
          </div>
          <div className="md:col-span-2">
            <Label>Image</Label>
            <div className="flex items-center gap-3">
              {form.image_url && (
                <div className="relative">
                  <img src={form.image_url} alt="" className="w-20 h-20 object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => update("image_url", "")}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded cursor-pointer hover:bg-muted">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-sm">Choisir une image</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Intentions (quiz Sommelier)</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {INTENTIONS.map((i) => (
                <Badge key={i} variant={form.intention_match?.includes(i) ? "default" : "outline"}
                  className="cursor-pointer capitalize" onClick={() => toggleArray("intention_match", i)}>
                  {i}
                </Badge>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Goûts</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {TASTES.map((t) => (
                <Badge key={t} variant={form.taste_match?.includes(t) ? "default" : "outline"}
                  className="cursor-pointer capitalize" onClick={() => toggleArray("taste_match", t)}>
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 space-y-3">
            <Label>Profil terpènes</Label>
            {(["boise", "fruite", "epice", "terreux"] as const).map((k) => (
              <div key={k}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{k}</span>
                  <span className="text-muted-foreground">{terpenes[k]}</span>
                </div>
                <Slider value={[terpenes[k]]} min={0} max={100} step={1}
                  onValueChange={(v) => update("terpenes", { ...terpenes, [k]: v[0] })} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={!!form.is_force_noire} onCheckedChange={(v) => update("is_force_noire", v)} />
            <Label>Produit Force Noire (Élixir Noir)</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active !== false} onCheckedChange={(v) => update("is_active", v)} />
            <Label>Actif (visible sur le site)</Label>
          </div>
          <div>
            <Label>Ordre d'affichage</Label>
            <Input type="number" value={form.display_order ?? 0} onChange={(e) => update("display_order", parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le produit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
