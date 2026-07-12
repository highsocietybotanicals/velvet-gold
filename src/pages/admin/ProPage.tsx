import ProRequestsSection from "@/components/admin/ProRequestsSection";
import ProInvoicingManager from "@/components/admin/ProInvoicingManager";

const ProPage = () => (
  <div className="space-y-8">
    <h1 className="text-2xl font-bold gold-text">Pro & Facturation</h1>
    <ProRequestsSection />
    <ProInvoicingManager />
  </div>
);

export default ProPage;
