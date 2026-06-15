import { useState } from "react";
import { motion } from "framer-motion";
import { Euro, Leaf, Package, Loader2, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { useAdminProducts, ProductPrice } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EditableRowProps {
  product: ProductPrice;
  initialProPrice: number | null;
  onSave: (productId: string, price: number, proPrice: number | null) => void;
  onToggle: (productId: string, isActive: boolean) => void;
  isUpdating: boolean;
  isToggling: boolean;
}

const EditableRow = ({ product, initialProPrice, onSave, onToggle, isUpdating, isToggling }: EditableRowProps) => {
  const [price, setPrice] = useState(product.price.toString());
  const [proPrice, setProPrice] = useState(initialProPrice?.toString() || "");
  const [hasChanges, setHasChanges] = useState(false);

  const handlePriceChange = (value: string) => {
    setPrice(value);
    setHasChanges(true);
  };

  const handleProPriceChange = (value: string) => {
    setProPrice(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    const numPrice = parseFloat(price);
    const numProPrice = proPrice ? parseFloat(proPrice) : null;
    
    if (isNaN(numPrice) || numPrice <= 0) return;
    if (proPrice && (isNaN(numProPrice!) || numProPrice! <= 0)) return;
    
    onSave(product.id, numPrice, numProPrice);
    setHasChanges(false);
  };

  return (
    <TableRow className={!product.is_active ? "opacity-50" : ""}>
      <TableCell>
        <div className="flex items-center gap-2">
          {product.category === "fleur" ? (
            <Leaf className="h-4 w-4 text-primary" />
          ) : (
            <Package className="h-4 w-4 text-primary" />
          )}
          <span className="font-medium">{product.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {product.category === "fleur" ? "Fleur" : "Résine"}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="w-24 h-8 text-sm"
          />
          <span className="text-muted-foreground text-sm">€/g</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={proPrice}
            onChange={(e) => handleProPriceChange(e.target.value)}
            placeholder="—"
            className="w-24 h-8 text-sm"
          />
          <span className="text-muted-foreground text-sm">€ HT</span>
        </div>
      </TableCell>
      <TableCell>
        <button
          onClick={() => onToggle(product.id, !product.is_active)}
          disabled={isToggling}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {product.is_active ? (
            <ToggleRight className="h-6 w-6 text-primary" />
          ) : (
            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
          )}
        </button>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant={hasChanges ? "default" : "ghost"}
          onClick={handleSave}
          disabled={isUpdating || !hasChanges}
          className={hasChanges ? "bg-primary" : ""}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
};

const PriceManagement = () => {
  const { products, proPrices, isLoading, updatePrice, toggleProduct, isUpdating, isToggling } = useAdminProducts();

  const flowers = products.filter((p) => p.category === "fleur");
  const resins = products.filter((p) => p.category === "resine");

  if (isLoading) {
    return (
      <Card className="border-gold/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mb-12"
    >
      <Card className="border-gold/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-gold" />
            Gestion des Prix
            <Badge variant="secondary" className="ml-2">
              {products.length} produits
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Fleurs */}
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
              <Leaf className="h-5 w-5 text-primary" />
              Fleurs
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix TTC</TableHead>
                    <TableHead>Prix Pro HT</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flowers.map((product) => (
                    <EditableRow
                      key={product.id}
                      product={product}
                      initialProPrice={proPrices[product.id] ?? null}
                      onSave={updatePrice}
                      onToggle={toggleProduct}
                      isUpdating={isUpdating}
                      isToggling={isToggling}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Résines */}
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-primary" />
              Résines
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix TTC</TableHead>
                    <TableHead>Prix Pro HT</TableHead>
                    <TableHead>Actif</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resins.map((product) => (
                    <EditableRow
                      key={product.id}
                      product={product}
                      initialProPrice={proPrices[product.id] ?? null}
                      onSave={updatePrice}
                      onToggle={toggleProduct}
                      isUpdating={isUpdating}
                      isToggling={isToggling}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Le "Prix Pro HT" s'applique uniquement aux clients Pro avec un numéro de TVA valide.
            Les autres clients voient le prix TTC avec les remises par palier.
          </p>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default PriceManagement;
