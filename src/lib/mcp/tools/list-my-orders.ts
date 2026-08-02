import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "Mes commandes",
  description:
    "Liste les commandes du client connecté (numéro, statut, montant, mode de livraison, date).",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Nombre maximum de commandes (défaut 10)."),
    status: z.string().trim().optional().describe("Filtre optionnel sur le statut de commande."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Non authentifié." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("orders")
      .select(
        "id, display_order_number, order_number, status, payment_status, total_amount, total_flower_weight, delivery_type, delivery_date, tracking_number, tracking_url, created_at",
      )
      .eq("user_id", ctx.getUserId()!)
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { orders: data ?? [] },
    };
  },
});
