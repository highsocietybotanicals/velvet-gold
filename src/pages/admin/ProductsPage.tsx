import ProductsManager from "@/components/admin/ProductsManager";

const ProductsPage = () => (
  <div>
    <h1 className="text-2xl font-bold gold-text mb-6">Produits</h1>
    <p className="text-sm text-muted-foreground mb-6">
      Ajoutez, modifiez ou désactivez les fleurs et résines de votre catalogue. Les prix modifiés ici sont synchronisés avec la page "Prix".
    </p>
    <ProductsManager />
  </div>
);

export default ProductsPage;
