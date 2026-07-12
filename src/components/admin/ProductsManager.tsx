import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Package, Leaf, Zap, ImageOff } from "lucide-react";
import { useDbProducts, DbProduct } from "@/hooks/useDbProducts";
import { useAdminProducts } from "@/hooks/useProducts";
import ProductForm from "./ProductForm";
import { useToast } from "@/hooks/use-toast";

const ProductsManager = () => {
  const { products, isLoading, deleteProduct } = useDbProducts();
  const { proPrices } = useAdminProducts();
  const { toast } = useToast();
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [open, setOpen] = useState(false);

  const handleNew = () => { setEditing(null); setOpen(true); };
  const handleEdit = (p: DbProduct) => { setEditing(p); setOpen(true); };
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Produit supprimé" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-gold/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" />
            Catalogue produits
            <Badge variant="secondary" className="ml-2">{products.length}</Badge>
          </CardTitle>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" />Nouveau produit
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun produit</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Groupe</TableHead>
                    <TableHead>Prix TTC</TableHead>
                    <TableHead>Prix Pro HT</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                            <ImageOff className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {p.is_force_noire && <Zap className="w-3.5 h-3.5 text-red-500" />}
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {p.category === "fleur" ? <><Leaf className="w-3 h-3 mr-1" />Fleur</> : <><Package className="w-3 h-3 mr-1" />Résine</>}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">{p.price_group}</Badge></TableCell>
                      <TableCell className="font-semibold">{Number(p.price).toFixed(2)}€/g</TableCell>
                      <TableCell>{proPrices[p.id] != null ? `${Number(proPrices[p.id]).toFixed(2)}€` : "—"}</TableCell>
                      <TableCell>
                        {p.is_active ? <Badge className="bg-green-500/20 text-green-500">Actif</Badge> : <Badge variant="outline">Inactif</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer {p.name} ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irréversible. Les commandes historiques référençant ce produit resteront intactes mais ne pourront plus l'afficher.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <ProductForm open={open} onOpenChange={setOpen} product={editing} initialProPrice={editing ? proPrices[editing.id] ?? null : null} />
    </motion.section>
  );
};

export default ProductsManager;
