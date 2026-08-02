import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProductsTool from "./tools/list-products";
import listMyOrdersTool from "./tools/list-my-orders";
import getOrderDetailsTool from "./tools/get-order-details";
import getMyAccountTool from "./tools/get-my-account";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "high-society-botanicals",
  title: "High society botanicals",
  version: "0.1.0",
  instructions:
    "Outils de la boutique High Society Botanicals. `list_products` expose le catalogue public (fleurs, résines, accessoires). `get_my_account`, `list_my_orders` et `get_order_details` agissent au nom du client connecté et ne renvoient que ses propres données.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProductsTool, getMyAccountTool, listMyOrdersTool, getOrderDetailsTool],
});
