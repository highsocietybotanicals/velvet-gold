import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_order_details",
  title: "Détail d'une commande",
  description:
    "Retourne le détail d'une commande du client connecté (produits, poids, prix) à partir de son numéro de commande (ex. HSB-123456).",
  inputSchema: {
    order_number: z.string().trim().min(3).describe("Numéro de commande, ex. HSB-123456."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, display_order_number, order_number, status, payment_status, total_amount, total_flower_weight, delivery_type, delivery_address, delivery_date, tracking_number, tracking_url, created_at",
      )
      .eq("user_id", ctx.getUserId()!)
      .or(`display_order_number.eq.${order_number},order_number.eq.${order_number}`)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!order) {
      return { content: [{ type: "text", text: `Commande ${order_number} introuvable.` }], isError: true };
    }

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("product_name, product_type, weight, quantity, unit_price, total_price")
      .eq("order_id", order.id);
    if (itemsError) return { content: [{ type: "text", text: itemsError.message }], isError: true };

    const result = { order, items: items ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});
