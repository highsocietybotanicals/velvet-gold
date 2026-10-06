import PriceManagement from "@/components/admin/PriceManagement";

const PricesPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Gestion des prix</h1>
    <PriceManagement />
  </div>
);

export default PricesPage;
