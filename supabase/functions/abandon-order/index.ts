// PROPOSITION — remplace supabase/functions/abandon-order/index.ts (fichier hors du chantier
// « paiement » : à appliquer par la personne qui en a la charge, en même temps que la publication).
//
// Défauts corrigés :
//  - l'ancienne version lisait vivaOrder.PaymentAmount, champ absent de la réponse Viva
//    (GET /api/orders/{code} renvoie StateId / RequestAmount) : une commande PAYÉE était donc
//    supprimée dès que la cliente revenait sur le site par une autre page que /payment-success ;
//  - si Viva ne répondait pas, l'erreur était ignorée et la commande supprimée quand même ;
//  - aucune vérification du statut : une commande avancée à la main pouvait être supprimée.
// Désormais : vérification par le module partagé (état de la commande Viva + transactions),
// suppression UNIQUEMENT si Viva a répondu, ne voit aucun paiement, et que la commande est encore
// « en attente ». Si Viva confirme le paiement, la commande est enregistrée payée par le chemin
// commun (e-mails client et admin une seule fois).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkVivaOrderPaid } from "../_shared/viva-api.ts";
import { confirmOrderPayment } from "../_shared/order-paid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_CODE_RE = /^\d{6,24}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Paramètres invalides" }, 400);
    }
    const orderId = typeof payload?.orderId === "string" ? payload.orderId.trim() : "";
    const vivaOrderCode = payload?.vivaOrderCode != null ? String(payload.vivaOrderCode).trim() : "";
    if (!UUID_RE.test(orderId) || !ORDER_CODE_RE.test(vivaOrderCode)) {
      return json({ error: "Paramètres invalides" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: readError } = await supabase
      .from("orders")
      .select("id, total_amount, payment_status, status, viva_order_code")
      .eq("id", orderId)
      .maybeSingle();
    if (readError) {
      console.error("abandon-order : lecture impossible", readError.message);
      return json({ deleted: false, reason: "read_error" });
    }
    if (!order) return json({ deleted: false, reason: "not_found" });

    // Sécurité : le code Viva doit correspondre à celui enregistré
    if (order.viva_order_code !== vivaOrderCode) return json({ deleted: false, reason: "code_mismatch" });
    if (order.payment_status !== "unpaid") return json({ deleted: false, reason: "already_paid" });
    if (order.status !== "pending") return json({ deleted: false, reason: "not_pending" });

    // Viva fait foi : on ne supprime jamais sans réponse claire « non payée ».
    const check = await checkVivaOrderPaid({
      orderId: order.id,
      orderCode: vivaOrderCode,
      expectedCents: Math.round(Number(order.total_amount) * 100),
    });
    if (check.paid) {
      console.log("abandon-order : commande payée chez Viva, enregistrée au lieu d'être supprimée", orderId);
      await confirmOrderPayment(supabase, order.id, "abandon-order", { background: true });
      return json({ deleted: false, reason: "paid_on_viva" });
    }
    if (!check.reachable) {
      console.error("abandon-order : Viva injoignable, commande conservée", orderId, check.detail);
      return json({ deleted: false, reason: "viva_unreachable" });
    }

    // Nettoyage des dépendances puis de la commande (encore en attente et non payée).
    await supabase.from("order_items").delete().eq("order_id", orderId);
    await supabase.from("order_status_history").delete().eq("order_id", orderId);
    await supabase.from("delivery_mileage").delete().eq("order_id", orderId);
    await supabase.from("promo_code_usage").delete().eq("order_id", orderId);

    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)
      .eq("payment_status", "unpaid")
      .eq("status", "pending");
    if (deleteError) {
      console.error("Abandon delete error:", deleteError);
      return json({ error: "Suppression impossible" }, 500);
    }

    console.log("Abandoned order deleted:", orderId);
    return json({ deleted: true });
  } catch (error) {
    console.error("abandon-order error:", error);
    return json({ error: "Internal error" }, 500);
  }
});
