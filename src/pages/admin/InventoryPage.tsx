import InventoryManager from "@/components/admin/InventoryManager";

const InventoryPage = () => (
  <div>
    <h1 className="text-2xl font-bold gold-text mb-6">Inventaire</h1>
    <p className="text-sm text-muted-foreground mb-6">
      Saisissez le stock réel de chaque variété en grammes. Chaque commande payée déduit
      automatiquement les grammes vendus, échantillons et cadeaux compris. Une variété à zéro passe
      en rupture sur le site.
    </p>
    <InventoryManager />
  </div>
);

export default InventoryPage;
