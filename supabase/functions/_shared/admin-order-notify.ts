import { sendRawEmail } from "./transactional-email-templates/send-raw-email.ts";

// Prévenir la gérante (tous les comptes admin) d'une commande :
//  - « paid » : commande payée en ligne (webhook Viva, retour client, vérification planifiée) ;
//  - « new »  : commande créée sans paiement en ligne (main propre, virement, commande pro) ;
//  - « paid_cancelled » : paiement confirmé par Viva sur une commande déjà annulée (à rembourser
//    ou à réactiver ; rien n'est modifié sur la commande).
// E-mail à chaque admin (user_roles.role = 'admin' → profiles.email), journalisé dans
// email_send_log (template_name « admin_new_order ») + Telegram si configuré.
// Jamais deux fois pour le même événement et le même destinataire : le journal est relu avant
// tout envoi, et un verrou (ligne « pending » dans le journal) départage deux envois simultanés.
// Paiement Viva dont la commande n'existe plus : notifyAdminsOfOrphanPayment (plus bas).

export type AdminOrderEvent = "paid" | "new" | "paid_cancelled";
export const ADMIN_ORDER_EVENTS: readonly AdminOrderEvent[] = ["paid", "new", "paid_cancelled"];

export const ADMIN_ORDER_TEMPLATE = "admin_new_order";
export const ADMIN_ORPHAN_TEMPLATE = "admin_orphan_payment";
const ADMIN_ORDERS_URL = "https://highsocietybotanicals.com/admin/commandes";
const MAX_EMAIL_ATTEMPTS = 3;
const CLAIM_RECIPIENT = "verrou-envoi"; // ligne de verrou (jamais un destinataire réel)
const CLAIM_TTL_MS = 5 * 60_000; // un verrou plus ancien (envoi interrompu) est ignoré
const NO_ADMIN_RECIPIENT = "aucun-admin";

export interface NotifyAdminsResult {
  sent: number;
  failed: number;
  skipped?: string;
  telegram?: string;
}

/** Appel serveur à serveur d'une autre fonction edge (clé service role), avec délai maximal. */
export async function callEdgeFunction(
  name: string,
  body: unknown,
  timeoutMs = 25_000,
): Promise<{ ok: boolean; status: number; text: string }> {
  const baseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!baseUrl || !serviceKey) {
    return { ok: false, status: 0, text: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY absent" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = (await res.text()).slice(0, 500);
    return { ok: res.ok, status: res.status, text };
  } catch (e) {
    return { ok: false, status: 0, text: String(e) };
  } finally {
    clearTimeout(timer);
  }
}

export async function getAdminEmails(supabase: any): Promise<string[]> {
  const { data: roles, error } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  if (error) {
    console.error("Notification admin : lecture des rôles impossible", error.message);
    return [];
  }
  const ids = [...new Set((roles ?? []).map((r: any) => r.user_id).filter(Boolean))];
  if (!ids.length) return [];
  const { data: profiles, error: pErr } = await supabase.from("profiles").select("email").in("id", ids);
  if (pErr) {
    console.error("Notification admin : lecture des profils impossible", pErr.message);
    return [];
  }
  return [
    ...new Set(
      (profiles ?? [])
        .map((p: any) => String(p.email ?? "").trim().toLowerCase())
        .filter((e: string) => e.includes("@")),
    ),
  ] as string[];
}

// ---------- mise en forme ----------

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string
  );
const oneLine = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();

export const formatEuros = (n: unknown) => `${(Number(n) || 0).toFixed(2).replace(".", ",")} €`;
export const formatGrams = (n: unknown) => `${String(Math.round((Number(n) || 0) * 100) / 100).replace(".", ",")} g`;

/** Grammage / quantité d'une ligne (les lignes pro portent le poids TOTAL et le nombre d'unités). */
export function formatItemQuantity(item: { weight?: unknown; quantity?: unknown }): string {
  const w = Number(item.weight);
  const q = Number(item.quantity);
  if (w > 0 && q > 1) return `${formatGrams(w)} au total (${q} unités)`;
  if (w > 0) return formatGrams(w);
  if (q > 0) return `× ${q}`;
  return "—";
}

export const DELIVERY_LABELS: Record<string, string> = {
  personal: "Remise en main propre",
  postal: "Envoi postal",
  relay: "Point relais",
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  online: "Carte bancaire en ligne (Viva)",
  physical: "Paiement sur place",
  transfer: "Virement",
};
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: "payée",
  unpaid: "à encaisser",
  refunded: "remboursée",
  cancelled: "annulée",
};

function parisDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function deliveryDay(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(`${String(d).slice(0, 10)}T12:00:00Z`).toLocaleDateString("fr-FR", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return String(d);
  }
}

export interface AdminOrderContext {
  order: any;
  items: any[];
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  company: string | null;
  orderNumber: string;
}

export async function loadAdminOrderContext(supabase: any, orderId: string): Promise<AdminOrderContext | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, display_order_number, order_number, created_at, total_amount, total_flower_weight, delivery_type, delivery_address, delivery_date, delivery_time, relay_point_id, relay_point_name, relay_point_address, contact_phone, guest_name, guest_email, guest_phone, user_id, payment_method, payment_status, status, order_channel, promo_code, promo_discount_amount",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error || !order) {
    if (error) console.error("Notification admin : commande illisible", orderId, error.message);
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, product_type, weight, quantity, total_price")
    .eq("order_id", orderId);
  if (itemsError) console.error("Notification admin : lignes illisibles", orderId, itemsError.message);

  let profile: any = null;
  if (order.user_id) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, phone, company_name")
      .eq("id", order.user_id)
      .maybeSingle();
    profile = data;
  }

  const clientEmail = order.guest_email || profile?.email || null;
  return {
    order,
    items: items ?? [],
    clientName: oneLine(profile?.full_name || order.guest_name || clientEmail || "Client"),
    clientEmail,
    clientPhone: order.contact_phone || order.guest_phone || profile?.phone || null,
    company: profile?.company_name || null,
    orderNumber:
      order.display_order_number || `HSB-${String(order.order_number ?? "").padStart(6, "0")}`,
  };
}

export function buildAdminOrderSubject(ctx: AdminOrderContext, eventType: AdminOrderEvent): string {
  const total = formatEuros(ctx.order.total_amount);
  if (eventType === "paid") {
    return oneLine(`💰 Commande payée ${ctx.orderNumber} — ${total} — ${ctx.clientName}`);
  }
  if (eventType === "paid_cancelled") {
    return oneLine(`⚠️ Paiement reçu sur une commande annulée ${ctx.orderNumber} — ${total} — ${ctx.clientName}`);
  }
  const pro = ctx.order.order_channel === "pro" ? " pro" : "";
  const toCollect = ctx.order.payment_status === "paid" ? "déjà encaissée" : "à encaisser";
  return oneLine(`🆕 Nouvelle commande${pro} ${ctx.orderNumber} — ${total} — ${ctx.clientName} — ${toCollect}`);
}

/** Lignes « Livraison » communes à l'e-mail et à Telegram. */
export function deliveryLines(order: any): string[] {
  const lines: string[] = [DELIVERY_LABELS[order.delivery_type] ?? String(order.delivery_type ?? "—")];
  if (order.delivery_type === "relay") {
    if (order.relay_point_name) lines.push(oneLine(order.relay_point_name));
    if (order.relay_point_address) lines.push(oneLine(order.relay_point_address));
    if (order.relay_point_id) lines.push(`Identifiant relais : ${oneLine(order.relay_point_id)}`);
  } else if (order.delivery_address) {
    lines.push(oneLine(order.delivery_address));
  } else if (order.delivery_type === "personal") {
    lines.push("Adresse non renseignée (à convenir avec le client)");
  }
  const day = deliveryDay(order.delivery_date);
  if (day) lines.push(`Date souhaitée : ${day}`);
  if (order.delivery_time) lines.push(`Créneau : ${oneLine(order.delivery_time)}`);
  return lines;
}

function buildEmailBodies(ctx: AdminOrderContext, eventType: AdminOrderEvent): { html: string; text: string } {
  const { order } = ctx;
  const billed = ctx.items.filter((i) => i.product_type !== "sample" && i.product_type !== "gift");
  const samples = ctx.items.filter((i) => i.product_type === "sample");
  const gifts = ctx.items.filter((i) => i.product_type === "gift");

  const headline =
    eventType === "paid"
      ? "Nouvelle commande payée en ligne"
      : eventType === "paid_cancelled"
        ? "Paiement reçu sur une commande annulée"
        : order.payment_status === "paid"
          ? "Nouvelle commande (déjà encaissée)"
          : "Nouvelle commande à encaisser";
  const paymentLine = `${PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method ?? "—"} — ${
    eventType === "paid_cancelled"
      ? "payée chez Viva, non enregistrée sur le site (commande annulée)"
      : PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status ?? "—"
  }`;
  const notice =
    eventType === "paid_cancelled"
      ? "La cliente a payé par carte alors que la commande était déjà annulée. Le site n'a rien modifié : la commande reste annulée, aucun e-mail n'a été envoyé à la cliente et le stock n'a pas bougé. À vous de choisir : rembourser le paiement dans votre espace Viva, ou réactiver la commande dans l'administration (statut « en préparation », paiement « payée »)."
      : "";
  const delivery = deliveryLines(order);
  const created = parisDateTime(order.created_at);

  const clientLines = [
    ctx.clientName,
    ctx.company && ctx.company !== ctx.clientName ? ctx.company : "",
    ctx.clientEmail ?? "",
    ctx.clientPhone ? `Tél. ${ctx.clientPhone}` : "Téléphone non renseigné",
    order.user_id ? "Client avec compte" : "Commande sans compte",
  ].filter(Boolean);

  const td = 'style="padding:8px 10px;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:14px;"';
  const tdR = 'style="padding:8px 10px;border-bottom:1px solid #2a2a2a;color:#e8e8e8;font-size:14px;text-align:right;white-space:nowrap;"';
  const itemRows = billed.length
    ? billed
        .map(
          (i) =>
            `<tr><td ${td}>${esc(i.product_name)}</td><td ${tdR}>${esc(formatItemQuantity(i))}</td><td ${tdR}>${esc(formatEuros(i.total_price))}</td></tr>`,
        )
        .join("")
    : `<tr><td ${td} colspan="3">Aucune ligne enregistrée — vérifiez la commande dans l'administration.</td></tr>`;

  const extraBlock = (title: string, list: any[]) =>
    list.length
      ? `<p style="margin:16px 0 6px;color:#d4af37;font-size:13px;text-transform:uppercase;letter-spacing:1px;">${esc(title)}</p>` +
        list.map((i) => `<p style="margin:0 0 4px;color:#e8e8e8;font-size:14px;">• ${esc(i.product_name)} — ${esc(formatItemQuantity(i))}</p>`).join("")
      : "";

  const section = (title: string, lines: string[]) =>
    `<p style="margin:20px 0 6px;color:#d4af37;font-size:13px;text-transform:uppercase;letter-spacing:1px;">${esc(title)}</p>` +
    lines.map((l, k) => `<p style="margin:0 0 4px;color:${k === 0 ? "#ffffff" : "#c8c8c8"};font-size:14px;">${esc(l)}</p>`).join("");

  const totalLines = [
    `Total : ${formatEuros(order.total_amount)}`,
    Number(order.total_flower_weight) > 0 ? `Poids fleurs/résines : ${formatGrams(order.total_flower_weight)}` : "",
    order.promo_code
      ? `Code promo ${order.promo_code}${order.promo_discount_amount ? ` (−${formatEuros(order.promo_discount_amount)})` : ""}`
      : "",
  ].filter(Boolean);

  const html = [
    '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
    '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,Helvetica,Arial,sans-serif;">',
    '<div style="max-width:620px;margin:0 auto;background:#111111;padding:28px 22px;">',
    `<p style="margin:0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">High Society Botanicals — administration</p>`,
    `<h1 style="margin:8px 0 4px;color:#d4af37;font-size:22px;font-weight:600;">${esc(headline)}</h1>`,
    `<p style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">${esc(ctx.orderNumber)} — ${esc(formatEuros(order.total_amount))}</p>`,
    created ? `<p style="margin:4px 0 0;color:#999;font-size:13px;">Passée le ${esc(created)}</p>` : "",
    notice
      ? `<p style="margin:16px 0 0;padding:12px 14px;border:1px solid #d4af37;border-radius:6px;color:#ffffff;font-size:14px;line-height:1.5;">${esc(notice)}</p>`
      : "",
    section("Client", clientLines),
    section("Paiement", [paymentLine]),
    section("Livraison", delivery),
    `<p style="margin:20px 0 6px;color:#d4af37;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Articles</p>`,
    `<table style="width:100%;border-collapse:collapse;">${itemRows}</table>`,
    extraBlock("Échantillons offerts", samples),
    extraBlock("Cadeaux", gifts),
    section("Montant", totalLines),
    `<p style="margin:28px 0 8px;text-align:center;"><a href="${ADMIN_ORDERS_URL}" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:12px 26px;border-radius:6px;font-weight:600;font-size:15px;">Ouvrir les commandes</a></p>`,
    `<p style="margin:16px 0 0;color:#666;font-size:12px;text-align:center;">E-mail automatique envoyé aux comptes administrateurs du site.</p>`,
    "</div></body></html>",
  ].join("");

  const text = [
    `${headline} : ${ctx.orderNumber} — ${formatEuros(order.total_amount)}`,
    created ? `Passée le ${created}` : "",
    ...(notice ? ["", notice] : []),
    "",
    "CLIENT",
    ...clientLines,
    "",
    "PAIEMENT",
    paymentLine,
    "",
    "LIVRAISON",
    ...delivery,
    "",
    "ARTICLES",
    ...(billed.length
      ? billed.map((i) => `- ${oneLine(i.product_name)} : ${formatItemQuantity(i)} — ${formatEuros(i.total_price)}`)
      : ["Aucune ligne enregistrée — vérifiez la commande dans l'administration."]),
    ...(samples.length ? ["", "ÉCHANTILLONS OFFERTS", ...samples.map((i) => `- ${oneLine(i.product_name)} : ${formatItemQuantity(i)}`)] : []),
    ...(gifts.length ? ["", "CADEAUX", ...gifts.map((i) => `- ${oneLine(i.product_name)} : ${formatItemQuantity(i)}`)] : []),
    "",
    ...totalLines,
    "",
    `Administration : ${ADMIN_ORDERS_URL}`,
  ].join("\n");

  return { html, text };
}

async function logAdminEmail(
  supabase: any,
  row: {
    template?: string;
    recipient: string;
    status: "sent" | "suppressed" | "failed";
    error?: string;
    metadata: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("email_send_log").insert({
    template_name: row.template ?? ADMIN_ORDER_TEMPLATE,
    recipient_email: row.recipient,
    status: row.status,
    error_message: row.error ?? null,
    metadata: row.metadata,
  });
  if (error) console.error("Notification admin : journal email_send_log impossible", error.message);
}

// ---------- journal et verrou ----------

interface NotifyLogState {
  /** au moins une tentative déjà journalisée (envoyée, supprimée ou en échec) */
  any: boolean;
  /** destinataires déjà servis (sent / suppressed) */
  done: Set<string>;
  /** nombre d'échecs par destinataire */
  failures: Map<string, number>;
}

async function readNotifyLog(
  supabase: any,
  orderId: string,
  eventType: AdminOrderEvent,
): Promise<{ state: NotifyLogState | null; error?: string }> {
  const { data, error } = await supabase
    .from("email_send_log")
    .select("status, recipient_email")
    .eq("template_name", ADMIN_ORDER_TEMPLATE)
    .eq("metadata->>order_id", orderId)
    .eq("metadata->>event_type", eventType);
  if (error) return { state: null, error: error.message };
  const state: NotifyLogState = { any: false, done: new Set(), failures: new Map() };
  for (const r of data ?? []) {
    const to = String(r.recipient_email ?? "").trim().toLowerCase();
    if (to === CLAIM_RECIPIENT) continue;
    state.any = true;
    if (r.status === "sent" || r.status === "suppressed") state.done.add(to);
    else if (r.status === "failed") state.failures.set(to, (state.failures.get(to) ?? 0) + 1);
  }
  return { state };
}

/** Destinataires encore à servir : pas déjà servis, moins de 3 échecs. */
function pendingRecipients(state: NotifyLogState, admins: string[]): string[] {
  return admins.filter((a) => !state.done.has(a) && (state.failures.get(a) ?? 0) < MAX_EMAIL_ATTEMPTS);
}

/** Raison de ne rien envoyer, ou null s'il reste quelque chose à faire. */
function skipReason(state: NotifyLogState, admins: string[]): string | null {
  if (!admins.length) {
    if (state.done.size) return "déjà notifiée";
    if ((state.failures.get(NO_ADMIN_RECIPIENT) ?? 0) >= MAX_EMAIL_ATTEMPTS) return "abandon après 3 échecs";
    return null;
  }
  if (pendingRecipients(state, admins).length) return null;
  return state.done.size ? "déjà notifiée" : "abandon après 3 échecs";
}

async function releaseClaim(supabase: any, claimId: string) {
  const { error } = await supabase.from("email_send_log").delete().eq("id", claimId);
  if (error) console.warn("Notification admin : verrou non retiré (ignoré après 5 min)", error.message);
}

const byClaimOrder = (a: any, b: any) => {
  const ca = String(a.created_at ?? "");
  const cb = String(b.created_at ?? "");
  if (ca !== cb) return ca < cb ? -1 : 1;
  const ia = String(a.id);
  const ib = String(b.id);
  return ia < ib ? -1 : ia > ib ? 1 : 0;
};

/**
 * Verrou d'envoi sans SQL supplémentaire : chaque candidat insère une ligne « pending » puis relit
 * les verrous récents de la même commande et du même événement ; le plus ancien gagne, les
 * autres retirent leur ligne et n'envoient rien.
 */
async function claimNotification(
  supabase: any,
  orderId: string,
  eventType: AdminOrderEvent,
): Promise<{ status: "won"; id: string } | { status: "busy" } | { status: "error"; error: string }> {
  const { data, error } = await supabase
    .from("email_send_log")
    .insert({
      template_name: ADMIN_ORDER_TEMPLATE,
      recipient_email: CLAIM_RECIPIENT,
      status: "pending",
      metadata: { order_id: orderId, event_type: eventType, claim: true },
    })
    .select("id, created_at");
  if (error || !data?.length) return { status: "error", error: error?.message ?? "verrou non créé" };
  const mine = data[0];

  const since = new Date(Date.now() - CLAIM_TTL_MS).toISOString();
  const { data: claims, error: readError } = await supabase
    .from("email_send_log")
    .select("id, created_at")
    .eq("template_name", ADMIN_ORDER_TEMPLATE)
    .eq("recipient_email", CLAIM_RECIPIENT)
    .eq("status", "pending")
    .eq("metadata->>order_id", orderId)
    .eq("metadata->>event_type", eventType)
    .gte("created_at", since);
  if (readError) {
    await releaseClaim(supabase, mine.id);
    return { status: "error", error: readError.message };
  }
  const all: any[] = [...(claims ?? [])];
  if (!all.some((c) => c.id === mine.id)) all.push(mine);
  const winner = all.sort(byClaimOrder)[0];
  if (winner.id !== mine.id) {
    await releaseClaim(supabase, mine.id);
    return { status: "busy" };
  }
  return { status: "won", id: mine.id };
}

/**
 * Envoie la notification admin d'une commande, au plus une fois par événement et par destinataire.
 * Ne lève jamais d'exception : tout est journalisé (console + email_send_log).
 */
export async function notifyAdminsOfOrder(
  supabase: any,
  orderId: string,
  eventType: AdminOrderEvent,
  opts: { telegram?: boolean; source?: string } = {},
): Promise<NotifyAdminsResult> {
  const result: NotifyAdminsResult = { sent: 0, failed: 0 };
  let claimId: string | null = null;
  try {
    // 1) Qui a déjà reçu cette alerte ?
    let log = await readNotifyLog(supabase, orderId, eventType);
    if (log.error) {
      console.error("Notification admin : journal illisible", orderId, log.error);
      // Sans journal, impossible de garantir l'absence de doublon pour un envoi répété par la
      // tâche planifiée : on s'abstient (« new »). Pour « paid » / « paid_cancelled », l'appelant
      // ne passe ici qu'après une confirmation Viva : mieux vaut un doublon qu'un silence.
      if (eventType === "new") return { ...result, skipped: "journal illisible" };
    }
    const admins = await getAdminEmails(supabase);
    if (log.state) {
      const skip = skipReason(log.state, admins);
      if (skip) return { ...result, skipped: skip };
    }

    // 2) Verrou : un seul envoi à la fois pour cette commande et cet événement.
    const claim = await claimNotification(supabase, orderId, eventType);
    if (claim.status === "busy") return { ...result, skipped: "envoi déjà en cours" };
    if (claim.status === "error") {
      console.error("Notification admin : verrou impossible", orderId, claim.error);
      if (eventType === "new") return { ...result, skipped: "verrou impossible" };
    } else {
      claimId = claim.id;
      // Relecture : un envoi concurrent a pu se terminer juste avant notre verrou.
      log = await readNotifyLog(supabase, orderId, eventType);
      if (log.state) {
        const skip = skipReason(log.state, admins);
        if (skip) return { ...result, skipped: skip };
      }
    }
    const state: NotifyLogState = log.state ?? { any: false, done: new Set(), failures: new Map() };
    const firstAttempt = !state.any;

    // 3) Contenu
    const ctx = await loadAdminOrderContext(supabase, orderId);
    if (!ctx) return { ...result, skipped: "commande introuvable" };
    const subject = buildAdminOrderSubject(ctx, eventType);
    const { html, text } = buildEmailBodies(ctx, eventType);
    const metadataFor = (attempt: number) => ({
      order_id: orderId,
      event_type: eventType,
      order_number: ctx.orderNumber,
      source: opts.source ?? null,
      attempt,
    });

    // 4) E-mail à chaque admin pas encore servi
    if (!admins.length) {
      console.error("Notification admin : aucun compte admin avec e-mail", ctx.orderNumber);
      await logAdminEmail(supabase, {
        recipient: NO_ADMIN_RECIPIENT,
        status: "failed",
        error: "Aucun compte admin avec adresse e-mail (user_roles → profiles)",
        metadata: metadataFor((state.failures.get(NO_ADMIN_RECIPIENT) ?? 0) + 1),
      });
      result.failed++;
    }
    for (const to of pendingRecipients(state, admins)) {
      const attempt = (state.failures.get(to) ?? 0) + 1;
      try {
        const r = await sendRawEmail({
          to,
          subject,
          html,
          text,
          label: ADMIN_ORDER_TEMPLATE,
          idempotencyKey: `admin-order-${eventType}-${orderId}-${to}-${attempt}`,
        });
        await logAdminEmail(supabase, { recipient: to, status: r.sent ? "sent" : "suppressed", metadata: metadataFor(attempt) });
        if (r.sent) result.sent++;
      } catch (e) {
        console.error("Notification admin : envoi e-mail échoué", ctx.orderNumber, String(e));
        await logAdminEmail(supabase, {
          recipient: to,
          status: "failed",
          error: String(e).slice(0, 500),
          metadata: metadataFor(attempt),
        });
        result.failed++;
      }
    }

    // 5) Telegram, en plus, à la première tentative seulement (pas de journal Telegram)
    if (opts.telegram !== false && firstAttempt) {
      const tg = await callEdgeFunction("notify-admin-telegram", { orderId, eventType }, 15_000);
      result.telegram = tg.ok ? (tg.text.includes('"skipped"') ? "non configuré" : "envoyé") : `échec HTTP ${tg.status}`;
      if (!tg.ok) console.error("Notification admin : Telegram en échec", ctx.orderNumber, tg.status, tg.text);
    }

    console.log(
      `Notification admin ${eventType} ${ctx.orderNumber} : ${result.sent} e-mail(s), ${result.failed} échec(s), Telegram ${result.telegram ?? "non sollicité"}`,
    );
    return result;
  } catch (e) {
    console.error("Notification admin : erreur inattendue", orderId, e);
    return { ...result, skipped: "erreur inattendue" };
  } finally {
    if (claimId) await releaseClaim(supabase, claimId);
  }
}

// ---------- paiement Viva sans commande ----------

export interface OrphanPayment {
  /** MerchantTrns : id de la commande du site, introuvable en base */
  reference: string;
  vivaOrderCode: string | null;
  transactionId: string;
  amountCents: number;
  customerEmail: string | null;
  customerName: string | null;
}

/**
 * Paiement confirmé par Viva pour une commande du site qui n'existe plus (supprimée comme
 * « panier abandonné » avant l'arrivée du paiement) : alerte e-mail + Telegram aux admins,
 * une seule fois par transaction et par destinataire.
 */
export async function notifyAdminsOfOrphanPayment(supabase: any, p: OrphanPayment): Promise<NotifyAdminsResult> {
  const result: NotifyAdminsResult = { sent: 0, failed: 0 };
  try {
    const { data: logs, error: logError } = await supabase
      .from("email_send_log")
      .select("status, recipient_email")
      .eq("template_name", ADMIN_ORPHAN_TEMPLATE)
      .eq("metadata->>transaction_id", p.transactionId);
    if (logError) console.error("Alerte paiement sans commande : journal illisible", logError.message);
    const rows: any[] = logs ?? [];
    const done = new Set(
      rows
        .filter((r) => r.status === "sent" || r.status === "suppressed")
        .map((r) => String(r.recipient_email ?? "").trim().toLowerCase()),
    );
    const admins = await getAdminEmails(supabase);
    const targets = admins.filter((a) => !done.has(a));
    if (admins.length && !targets.length) return { ...result, skipped: "déjà notifiée" };

    const amount = formatEuros(p.amountCents / 100);
    const subject = `⚠️ Paiement Viva reçu sans commande sur le site — ${amount}`;
    const intro =
      "Viva a encaissé un paiement par carte pour une commande qui n'existe plus sur le site (probablement supprimée automatiquement comme « panier abandonné » avant l'arrivée du paiement). Contactez la cliente pour préparer sa commande, ou remboursez-la dans votre espace Viva.";
    const details = [
      `Montant : ${amount}`,
      `Cliente : ${oneLine(p.customerName) || "non communiqué"}`,
      `E-mail : ${oneLine(p.customerEmail) || "non communiqué"}`,
      `Code de commande Viva : ${p.vivaOrderCode ?? "—"}`,
      `Transaction Viva : ${p.transactionId}`,
      `Référence de la commande du site : ${p.reference}`,
    ];
    const html = [
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>',
      '<body style="margin:0;padding:0;background:#0a0a0a;font-family:Segoe UI,Helvetica,Arial,sans-serif;">',
      '<div style="max-width:620px;margin:0 auto;background:#111111;padding:28px 22px;">',
      `<p style="margin:0;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">High Society Botanicals — administration</p>`,
      `<h1 style="margin:8px 0 12px;color:#d4af37;font-size:22px;font-weight:600;">Paiement reçu sans commande sur le site</h1>`,
      `<p style="margin:0 0 16px;color:#ffffff;font-size:14px;line-height:1.5;">${esc(intro)}</p>`,
      details.map((l) => `<p style="margin:0 0 4px;color:#e8e8e8;font-size:14px;">${esc(l)}</p>`).join(""),
      `<p style="margin:16px 0 0;color:#666;font-size:12px;text-align:center;">E-mail automatique envoyé aux comptes administrateurs du site.</p>`,
      "</div></body></html>",
    ].join("");
    const text = [intro, "", ...details].join("\n");
    const metadata = {
      transaction_id: p.transactionId,
      viva_order_code: p.vivaOrderCode,
      reference: p.reference,
      amount_cents: p.amountCents,
    };

    if (!admins.length) {
      console.error("Alerte paiement sans commande : aucun compte admin avec e-mail", p.transactionId);
      await logAdminEmail(supabase, {
        template: ADMIN_ORPHAN_TEMPLATE,
        recipient: NO_ADMIN_RECIPIENT,
        status: "failed",
        error: "Aucun compte admin avec adresse e-mail (user_roles → profiles)",
        metadata,
      });
      result.failed++;
    }
    for (const to of targets) {
      try {
        const r = await sendRawEmail({
          to,
          subject,
          html,
          text,
          label: ADMIN_ORPHAN_TEMPLATE,
          idempotencyKey: `admin-orphan-${p.transactionId}-${to}`,
        });
        await logAdminEmail(supabase, {
          template: ADMIN_ORPHAN_TEMPLATE,
          recipient: to,
          status: r.sent ? "sent" : "suppressed",
          metadata,
        });
        if (r.sent) result.sent++;
      } catch (e) {
        console.error("Alerte paiement sans commande : envoi e-mail échoué", p.transactionId, String(e));
        await logAdminEmail(supabase, {
          template: ADMIN_ORPHAN_TEMPLATE,
          recipient: to,
          status: "failed",
          error: String(e).slice(0, 500),
          metadata,
        });
        result.failed++;
      }
    }

    if (!rows.length) {
      const tg = await callEdgeFunction(
        "notify-admin-telegram",
        {
          eventType: "orphan_payment",
          orphan: {
            amountCents: p.amountCents,
            vivaOrderCode: p.vivaOrderCode,
            transactionId: p.transactionId,
            customerName: p.customerName,
          },
        },
        15_000,
      );
      result.telegram = tg.ok ? (tg.text.includes('"skipped"') ? "non configuré" : "envoyé") : `échec HTTP ${tg.status}`;
      if (!tg.ok) console.error("Alerte paiement sans commande : Telegram en échec", tg.status, tg.text);
    }
    console.log(`Alerte paiement sans commande ${p.transactionId} : ${result.sent} e-mail(s), ${result.failed} échec(s)`);
    return result;
  } catch (e) {
    console.error("Alerte paiement sans commande : erreur inattendue", p.transactionId, e);
    return { ...result, skipped: "erreur inattendue" };
  }
}
