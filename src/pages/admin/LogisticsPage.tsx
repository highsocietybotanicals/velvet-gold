import ManualOrderCreator from "@/components/admin/ManualOrderCreator";
import MileageManager from "@/components/admin/MileageManager";

const LogisticsPage = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold gold-text">Logistique</h1>
    <ManualOrderCreator />
    <MileageManager />
  </div>
);

export default LogisticsPage;
