import OrdersSection from "@/components/admin/OrdersSection";

const OrdersPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Commandes</h1>
    <OrdersSection />
  </div>
);

export default OrdersPage;
