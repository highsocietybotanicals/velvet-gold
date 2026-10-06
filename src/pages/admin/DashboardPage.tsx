import StatsManager from "@/components/admin/StatsManager";

const DashboardPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Tableau de bord</h1>
    <StatsManager />
  </div>
);

export default DashboardPage;
