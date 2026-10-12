import { callEdgeFunction, notifyAdminsOfOrder } from "./admin-order-notify.ts";

// UN SEUL chemin « commande payée », utilisé par viva-webhook, verify-payment et
// reconcile-viva-payments. Le paiement doit avoir été vérifié auprès de Viva AVANT l'appel.
//
// Idempotence : la mise à jour est conditionnelle (payment_status = 'unpaid'). Si deux appels
// arrivent en même temps (webhook + retour client), Postgres n'en laisse passer qu'un ; seul
// celui qui a réellement modifié la ligne déclenche les suites (e-mail client, kilométrage,
// notification admin). Les autres répondent « déjà payée » sans rien renvoyer.

export type MarkPaidOutcome = "marked_paid" | "already_paid" | "not_payable" | "error";

export interface MarkPaidResult {
  outcome: MarkPaidOutcome;
  detail?: string;
  /** Paiement confirmé par Viva sur une commande déjà annulée : rien n'est modifié, la gérante est alertée. */
  paidOnCancelled?: boolean;
}

export async function markOrderPaid(supabase: any, orderId: string, source: string): Promise<MarkPaidResult> {
  // a) Cas normal : commande en attente → payée et en préparation (même mise à jour qu'avant).
  const first = await supabase
    .from("orders")
    .update({ payment_status: "paid", status: "preparing" })
    .eq("id", orderId)
    .eq("payment_status", "unpaid")
    .eq("status", "pending")
    .select("id");
  if (first.error) {
    console.error(`[${source}] Mise à jour « payée » impossible`, orderId, first.error.message);
    return { outcome: "error", detail: first.error.message };
  }
  if (first.data?.length) {
    console.log(`[${source}] Commande ${orderId} marquée payée ✅ (statut → preparing)`);
    return { outcome: "marked_paid" };
  }

  // b) Statut déjà avancé à la main (ex. « en préparation ») mais paiement pas encore noté :
  //    on note le paiement sans faire reculer le statut. Jamais pour une commande annulée
  //    (sinon : confirmation envoyée à la cliente et stock retiré pour une commande annulée).
  const second = await supabase
    .from("orders")
    .update({ payment_status: "paid" })
    .eq("id", orderId)
    .eq("payment_status", "unpaid")
    .neq("status", "cancelled")
    .select("id, status");
  if (second.error) {
    console.error(`[${source}] Mise à jour « payée » impossible`, orderId, second.error.message);
    return { outcome: "error", detail: second.error.message };
  }
  if (second.data?.length) {
    console.log(`[${source}] Commande ${orderId} marquée payée ✅ (statut conservé : ${second.data[0].status})`);
    return { outcome: "marked_paid" };
  }

  // c) Rien n'a bougé : déjà payée, commande annulée, ou statut de paiement non modifiable (remboursée…).
  const { data: current, error } = await supabase
    .from("orders")
    .select("payment_status, status")
    .eq("id", orderId)
    .maybeSingle();
  if (error) return { outcome: "error", detail: error.message };
  if (!current) return { outcome: "error", detail: "commande introuvable" };
  if (current.payment_status === "paid") return { outcome: "already_paid" };
  if (current.payment_status === "unpaid" && current.status === "cancelled") {
    console.warn(`[${source}] Paiement confirmé par Viva sur la commande ANNULÉE ${orderId} : non enregistré, alerte admin`);
    return { outcome: "not_payable", detail: "commande annulée", paidOnCancelled: true };
  }
  console.warn(`[${source}] Commande ${orderId} non modifiée : payment_status = ${current.payment_status}`);
  return { outcome: "not_payable", detail: `payment_status = ${current.payment_status}` };
}

/** Suites d'un paiement confirmé : e-mail client, kilométrage, notification admin (e-mail + Telegram). */
export async function runPaidFollowUps(supabase: any, orderId: string, source: string): Promise<void> {
  const [confirmation, mileage, admin] = await Promise.allSettled([
    callEdgeFunction("send-order-confirmation", { orderId }, 45_000),
    callEdgeFunction("compute-mileage", { orderId }, 30_000),
    notifyAdminsOfOrder(supabase, orderId, "paid", { telegram: true, source }),
  ]);
  if (confirmation.status === "rejected" || (confirmation.status === "fulfilled" && !confirmation.value.ok)) {
    console.error(
      `[${source}] E-mail de confirmation client en échec`,
      orderId,
      confirmation.status === "fulfilled" ? `${confirmation.value.status} ${confirmation.value.text}` : confirmation.reason,
    );
  }
  if (mileage.status === "rejected" || (mileage.status === "fulfilled" && !mileage.value.ok)) {
    console.error(
      `[${source}] Calcul kilométrique en échec`,
      orderId,
      mileage.status === "fulfilled" ? `${mileage.value.status} ${mileage.value.text}` : mileage.reason,
    );
  }
  if (admin.status === "rejected") console.error(`[${source}] Notification admin en échec`, orderId, admin.reason);
}

/** Exécute une tâche après la réponse HTTP si le runtime le permet (EdgeRuntime.waitUntil), sinon l'attend. */
export async function runAfterResponse(task: Promise<unknown>, label: string): Promise<void> {
  const guarded = task.catch((e) => console.error(`${label} :`, e));
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime && typeof runtime.waitUntil === "function") {
    try {
      runtime.waitUntil(guarded);
      return;
    } catch (e) {
      console.warn("EdgeRuntime.waitUntil indisponible, exécution immédiate", e);
    }
  }
  await guarded;
}

/**
 * Marque la commande payée puis, si CET appel l'a réellement modifiée, lance les suites.
 * background = true : les suites continuent après la réponse (webhook, page de retour client).
 */
export async function confirmOrderPayment(
  supabase: any,
  orderId: string,
  source: string,
  opts: { background?: boolean } = {},
): Promise<MarkPaidResult> {
  const result = await markOrderPaid(supabase, orderId, source);
  let followUps: Promise<unknown> | null = null;
  if (result.outcome === "marked_paid") {
    followUps = runPaidFollowUps(supabase, orderId, source);
  } else if (result.paidOnCancelled) {
    // Aucun e-mail client, aucune mise à jour : seulement l'alerte « à rembourser ou réactiver »
    // (une seule fois, même si webhook, retour client et vérification planifiée repassent).
    followUps = notifyAdminsOfOrder(supabase, orderId, "paid_cancelled", { telegram: true, source });
  }
  if (followUps) {
    if (opts.background) await runAfterResponse(followUps, `[${source}] suites du paiement ${orderId}`);
    else await followUps.catch((e) => console.error(`[${source}] suites du paiement ${orderId} :`, e));
  }
  return result;
}
