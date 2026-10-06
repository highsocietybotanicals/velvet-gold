import ProductsManager from "@/components/admin/ProductsManager";

const ProductsPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Produits</h1>
    <p className="adm-note mb-6 text-sm text-muted-foreground">
      Ajoutez, modifiez ou désactivez les fleurs et résines de votre catalogue. Les prix modifiés ici sont synchronisés avec la page « Prix ».
    </p>
    <ProductsManager />
  </div>
);

export default ProductsPage;
