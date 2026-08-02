import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_products",
  title: "Lister le catalogue",
  description:
    "Liste les fleurs, résines et accessoires actifs du catalogue High Society Botanicals avec prix au gramme, taux de CBD et gamme.",
  inputSchema: {
    category: z
      .string()
      .trim()
      .optional()
      .describe("Filtre optionnel sur la catégorie (ex. fleur, resine, accessoire)."),
    limit: z.number().int().min(1).max(50).optional().describe("Nombre maximum de produits (défaut 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit }) => {
    const supabase = supabaseAnon();
    let query = supabase
      .from("products")
      .select(
        "id, name, subtitle, category, price, price_group, cbd_percentage, is_force_noire, is_nectar_divin, mood, terpenes",
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(limit ?? 20);
    if (category) query = query.ilike("category", `%${category}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
