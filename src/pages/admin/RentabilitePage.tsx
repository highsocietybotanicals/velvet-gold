import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CostsManager from "@/components/admin/CostsManager";
import MarginSimulator from "@/components/admin/MarginSimulator";
import OrderMarginTable from "@/components/admin/OrderMarginTable";

const RentabilitePage = () => (
  <div>
    <h1 className="text-2xl font-bold gold-text mb-2">Rentabilité</h1>
    <p className="text-sm text-muted-foreground mb-6">
      Saisis tes coûts, simule tes marges et vois le bénéfice réel de chaque commande.
    </p>
    <Tabs defaultValue="costs" className="w-full">
      <TabsList>
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
