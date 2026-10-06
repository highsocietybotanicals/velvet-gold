import InventoryManager from "@/components/admin/InventoryManager";

const InventoryPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Inventaire</h1>
    <p className="adm-note mb-6 text-sm text-muted-foreground">
      Saisissez le stock réel de chaque variété en grammes. Chaque commande payée déduit
      automatiquement les grammes vendus, échantillons et cadeaux compris. Une variété à zéro passe
      en rupture sur le site.
    </p>
    <InventoryManager />
  </div>
);

export default InventoryPage;
