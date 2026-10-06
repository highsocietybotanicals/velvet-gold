import SalesRepsManager from "@/components/admin/SalesRepsManager";

const CommerciauxPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Commerciaux</h1>
    <SalesRepsManager />
  </div>
);

export default CommerciauxPage;
