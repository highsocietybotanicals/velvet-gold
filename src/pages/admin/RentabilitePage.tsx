import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CostsManager from "@/components/admin/CostsManager";
import MarginSimulator from "@/components/admin/MarginSimulator";
import OrderMarginTable from "@/components/admin/OrderMarginTable";

const RentabilitePage = () => (
  <div>
    {/* titre visible dans le bandeau gravé de la salle de contrôle */}
    <h1 className="sr-only">Rentabilité</h1>
    <p className="adm-note mb-6 text-sm text-muted-foreground">
      Saisissez vos coûts, simulez vos marges et voyez le bénéfice réel de chaque commande.
    </p>
    <Tabs defaultValue="costs" className="w-full">
      <TabsList className="adm-switch">
        <TabsTrigger value="costs">Coûts</TabsTrigger>
        <TabsTrigger value="simulator">Simulateur</TabsTrigger>
        <TabsTrigger value="orders">Marge / commande</TabsTrigger>
      </TabsList>
      <TabsContent value="costs" className="mt-6">
        <CostsManager />
      </TabsContent>
      <TabsContent value="simulator" className="mt-6">
        <MarginSimulator />
      </TabsContent>
      <TabsContent value="orders" className="mt-6">
        <OrderMarginTable />
      </TabsContent>
    </Tabs>
  </div>
);

export default RentabilitePage;
