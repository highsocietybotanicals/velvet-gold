import ManualOrderCreator from "@/components/admin/ManualOrderCreator";
import MileageManager from "@/components/admin/MileageManager";
import PromoCodeManager from "@/components/admin/PromoCodeManager";

const LogisticsPage = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold gold-text">Logistique</h1>
    <ManualOrderCreator />
    <PromoCodeManager />
    <MileageManager />
  </div>
);

export default LogisticsPage;
