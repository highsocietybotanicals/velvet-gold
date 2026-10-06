import ManualOrderCreator from "@/components/admin/ManualOrderCreator";
import MileageManager from "@/components/admin/MileageManager";
import PromoCodeManager from "@/components/admin/PromoCodeManager";

const LogisticsPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Logistique</h1>
    <div className="space-y-8">
      <ManualOrderCreator />
      <PromoCodeManager />
      <MileageManager />
    </div>
  </div>
);

export default LogisticsPage;
