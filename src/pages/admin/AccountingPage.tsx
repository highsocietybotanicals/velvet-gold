import AccountingManager from "@/components/admin/AccountingManager";

const AccountingPage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Comptabilité</h1>
    <AccountingManager />
  </div>
);

export default AccountingPage;
