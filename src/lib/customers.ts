/**
 * Pure customer (CRM) logic: identification, clustering and metrics.
 * No React, no Supabase — only plain data in, plain data out.
 */

export interface RawOrder {
  id: string;
  created_at: string;
  total_amount: number | null;
  total_flower_weight: number | null;
  delivery_type: string | null;
  payment_method: string | null;
  payment_status: string | null;
  status: string | null;
  order_channel: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  contact_phone: string | null;
  guest_email: string | null;
  user_id: string | null;
}

export interface RawItem {
  order_id: string;
  product_name: string;
  product_type: string | null;
  quantity: number | null;
  weight: number | null;
  total_price: number | null;
}

export interface RawProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

export interface MergeRow {
  source_key: string;
  target_key: string;
  created_at?: string;
}

export type CustomerStatus = "Endormi" | "Nouveau" | "À relancer" | "À l'heure" | "Bientôt";

export interface CustomerOrder {
  id: string;
  date: Date;
  amount: number;
  grams: number;
  deliveryType: string;
  paymentMethod: string;
  products: { name: string; quantity: number }[];
}

export interface Customer {
  key: string;
  allKeys: string[];
  identified: boolean;
  name: string;
  phones: string[];
  emails: string[];
  orders: CustomerOrder[]; // ascending by date
  ordersCount: number;
  totalSpent: number;
  avgBasket: number;
  firstOrderDate: Date;
  lastOrderDate: Date;
  daysSinceLast: number;
  avgIntervalDays: number | null;
  predictedNextDate: Date | null;
  overdueDays: number;
  typicalGrams: number;
  deliveryHabit: string;
  paymentHabit: string;
  shareOfRevenue: number;
  productOfTheMoment: string | null;
  favoriteProduct: string | null;
  tastesByMonth: { month: string; product: string }[];
  status: CustomerStatus;
  isReseller: boolean;
  merges: MergeRow[];
}

export interface DuplicatePair {
  a: Customer;
  b: Customer;
  id: string;
}

/* ---------------- Normalisation ---------------- */

/** Normalise a French phone number; returns null if unusable (< 9 digits). */
export const normalizePhone = (raw?: string | null): string | null => {
  if (!raw) return null;
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0033")) d = "0" + d.slice(4);
  else if (d.startsWith("33") && d.length === 11) d = "0" + d.slice(2);
  else if (d.length === 9 && /^[67]/.test(d)) d = "0" + d;
  return d.length < 9 ? null : d;
};

export const normalizeEmail = (raw?: string | null): string | null => {
  const e = (raw || "").trim().toLowerCase();
  return e || null;
};

/** Name used for duplicate detection: lowercase, no accents, collapsed spaces. */
export const normalizeName = (raw?: string | null): string =>
  (raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const titleCase = (s: string): string =>
  s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((p) => (p.trim() && p !== "-" ? p.charAt(0).toUpperCase() + p.slice(1) : p))
    .join("");

export const initials = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "?") + (parts[1]?.[0] || "")).toUpperCase();
};

/** An order counts only when paid and not cancelled. */
export const isCountedOrder = (o: RawOrder) => o.payment_status === "paid" && o.status !== "cancelled";

/** A paid product line (excludes free gifts). */
export const isPaidItem = (it: RawItem) =>
  Number(it.total_price) > 0 && !(it.product_name || "").toLowerCase().startsWith("gift-");

/* ---------------- Dates (Europe/Paris) ---------------- */

const parisDayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
/** Calendar day number in Paris time (days since epoch). */
export const parisDay = (d: Date): number => {
  const [y, m, day] = parisDayFmt.format(d).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, day) / 86400000);
};
export const parisMonthKey = (d: Date): string => parisDayFmt.format(d).slice(0, 7);
export const daysBetween = (a: Date, b: Date) => parisDay(b) - parisDay(a);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

export const fmtDate = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });
export const fmtShortDate = (d: Date) => d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "2-digit" });
export const fmtMonth = (key: string) =>
  new Date(`${key}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
export const fmtEuro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: n % 1 ? 2 : 0 });

/* ---------------- Labels ---------------- */

export const paymentLabel = (m?: string | null) =>
  ({ online: "en ligne", physical: "sur place", transfer: "virement" } as Record<string, string>)[m || ""] || m || "—";

export const deliveryLabel = (d?: string | null) => {
  const v = (d || "").toLowerCase();
  if (v.includes("relais")) return "Point relais";
  if (v.includes("personal") || v.includes("perso")) return "Livraison en main propre";
  if (v.includes("postal") || v.includes("domicile") || v.includes("colissimo")) return "Colissimo domicile";
  if (v.includes("pickup") || v.includes("retrait")) return "Retrait";
  return d || "—";
};

/* ---------------- Helpers ---------------- */

const mode = <T,>(arr: T[]): T | null => {
  const m = new Map<T, number>();
  let best: T | null = null;
  let bestN = 0;
  for (const v of arr) {
    const n = (m.get(v) || 0) + 1;
    m.set(v, n);
    if (n > bestN) { best = v; bestN = n; }
  }
  return best;
};

const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Top product by quantity among a list of items. */
const topProduct = (items: { name: string; quantity: number }[]): string | null => {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.name, (m.get(it.name) || 0) + it.quantity);
  let best: string | null = null;
  let n = 0;
  m.forEach((v, k) => { if (v > n) { n = v; best = k; } });
  return best;
};

/** Clean product name: drop the " — 10 g x2" suffix of pro lines. */
const cleanProductName = (n: string) => n.split(" — ")[0].trim();

class UnionFind {
  parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p !== x) { p = this.find(p); this.parent.set(x, p); }
    return p;
  }
  union(a: string, b: string) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

/** Identifier keys of an order, ordered tel: → mail: → user:. */
export const orderIdentifiers = (o: RawOrder, profile?: RawProfile): string[] => {
  const tel = [o.guest_phone, o.contact_phone, o.user_id ? profile?.phone : null].map(normalizePhone).filter(Boolean) as string[];
  const mail = [o.guest_email, o.user_id ? profile?.email : null].map(normalizeEmail).filter(Boolean) as string[];
  const keys = [...new Set(tel)].map((t) => `tel:${t}`);
  keys.push(...[...new Set(mail)].map((m) => `mail:${m}`));
  if (o.user_id) keys.push(`user:${o.user_id}`);
  return keys;
};

/* ---------------- Main builder ---------------- */

export const buildCustomers = (
  rawOrders: RawOrder[],
  rawItems: RawItem[],
  profiles: RawProfile[],
  merges: MergeRow[],
  now: Date = new Date()
): Customer[] => {
  const orders = rawOrders.filter(isCountedOrder).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const itemsByOrder = new Map<string, RawItem[]>();
  for (const it of rawItems) {
    const l = itemsByOrder.get(it.order_id) || [];
    l.push(it);
    itemsByOrder.set(it.order_id, l);
  }

  // 1. Union-find on identifiers (each order is a node "o:<id>")
  const uf = new UnionFind();
  const idsByOrder = new Map<string, string[]>();
  for (const o of orders) {
    const ids = orderIdentifiers(o, o.user_id ? profileById.get(o.user_id) : undefined);
    idsByOrder.set(o.id, ids);
    uf.find(`o:${o.id}`);
    for (const k of ids) uf.union(`o:${o.id}`, k);
  }
  // 2. Manual merges
  for (const m of merges) uf.union(m.source_key, m.target_key);

  // 3. Group orders by root
  const groups = new Map<string, RawOrder[]>();
  for (const o of orders) {
    const r = uf.find(`o:${o.id}`);
    const g = groups.get(r) || [];
    g.push(o);
    groups.set(r, g);
  }

  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
  const customers: Customer[] = [];

  groups.forEach((group, root) => {
    const idSet = new Set<string>();
    group.forEach((o) => idsByOrder.get(o.id)!.forEach((k) => idSet.add(k)));
    const identified = idSet.size > 0;
    const firstIds = idsByOrder.get(group[0].id)!;
    const key = identified ? firstIds[0] ?? [...idSet][0] : `order:${group[0].id}`;
    const clusterMerges = merges.filter((m) => uf.find(m.source_key) === root || uf.find(m.target_key) === root);
    clusterMerges.forEach((m) => { idSet.add(m.source_key); idSet.add(m.target_key); });
    idSet.add(key);

    // Name: most recent non-empty
    let name = "";
    for (let i = group.length - 1; i >= 0 && !name; i--) {
      const o = group[i];
      name = (o.guest_name || (o.user_id ? profileById.get(o.user_id)?.full_name : "") || "").trim();
    }
    name = identified ? (name ? titleCase(name) : "Client sans nom") : "Client non identifié";

    const phones = new Set<string>();
    const emails = new Set<string>();
    idSet.forEach((k) => {
      if (k.startsWith("tel:")) phones.add(k.slice(4));
      if (k.startsWith("mail:")) emails.add(k.slice(5));
    });

    const cOrders: CustomerOrder[] = group.map((o) => {
      const its = (itemsByOrder.get(o.id) || []).filter(isPaidItem);
      return {
        id: o.id,
        date: new Date(o.created_at),
        amount: Number(o.total_amount) || 0,
        grams: Number(o.total_flower_weight) || 0,
        deliveryType: o.delivery_type || "",
        paymentMethod: o.payment_method || "",
        products: its.map((it) => ({ name: cleanProductName(it.product_name), quantity: Number(it.quantity) || 1 })),
      };
    });

    const n = cOrders.length;
    const totalSpent = cOrders.reduce((s, o) => s + o.amount, 0);
    const first = cOrders[0].date;
    const last = cOrders[n - 1].date;
    const daysSinceLast = Math.max(0, daysBetween(last, now));
    const avgIntervalDays = n >= 2 ? Math.max(1, daysBetween(first, last) / (n - 1)) : null;
    const predictedNextDate = avgIntervalDays ? addDays(last, Math.round(avgIntervalDays)) : null;

    let status: CustomerStatus;
    if (daysSinceLast > 90) status = "Endormi";
    else if (n === 1) status = daysSinceLast <= 30 ? "Nouveau" : "À relancer";
    else if (daysSinceLast <= avgIntervalDays!) status = "À l'heure";
    else if (daysSinceLast <= 1.5 * avgIntervalDays!) status = "Bientôt";
    else status = "À relancer";
    const overdueDays = avgIntervalDays && daysSinceLast > avgIntervalDays ? Math.round(daysSinceLast - avgIntervalDays) : 0;

    // Payment habit with switch detection
    const methods = cOrders.map((o) => o.paymentMethod).filter(Boolean);
    let paymentHabit = paymentLabel(mode(methods));
    if (methods.length >= 2) {
      const lastM = methods[methods.length - 1];
      let i = methods.length - 1;
      while (i > 0 && methods[i - 1] === lastM) i--;
      const prev = methods[i - 1];
      if (i > 0 && methods.slice(0, i).every((m) => m === prev) && i >= 1 && methods.length - i >= 1) {
        const switchOrder = cOrders.filter((o) => o.paymentMethod)[i];
        const prevOrder = cOrders.filter((o) => o.paymentMethod)[i - 1];
        const mo = (d: Date) => d.toLocaleDateString("fr-FR", { month: "long", timeZone: "Europe/Paris" });
        paymentHabit = `${paymentLabel(prev)} jusqu'en ${mo(prevOrder.date)}, ${paymentLabel(lastM)} depuis ${mo(switchOrder.date)}`;
      }
    }

    const allProducts = cOrders.flatMap((o) => o.products);
    const monthMap = new Map<string, { name: string; quantity: number }[]>();
    cOrders.forEach((o) => {
      if (!o.products.length) return;
      const k = parisMonthKey(o.date);
      monthMap.set(k, [...(monthMap.get(k) || []), ...o.products]);
    });
    const tastesByMonth = [...monthMap.keys()].sort().slice(-6).map((m) => ({ month: m, product: topProduct(monthMap.get(m)!)! }));

    customers.push({
      key,
      allKeys: [...idSet],
      identified,
      name,
      phones: [...phones],
      emails: [...emails],
      orders: cOrders,
      ordersCount: n,
      totalSpent,
      avgBasket: totalSpent / n,
      firstOrderDate: first,
      lastOrderDate: last,
      daysSinceLast,
      avgIntervalDays,
      predictedNextDate,
      overdueDays,
      typicalGrams: median(cOrders.map((o) => o.grams).filter((g) => g > 0)),
      deliveryHabit: deliveryLabel(mode(cOrders.map((o) => o.deliveryType).filter(Boolean))),
      paymentHabit,
      shareOfRevenue: totalRevenue > 0 ? totalSpent / totalRevenue : 0,
      productOfTheMoment: topProduct(cOrders.slice(-2).flatMap((o) => o.products)),
      favoriteProduct: topProduct(allProducts),
      tastesByMonth,
      status,
      isReseller: group.some((o) => Number(o.total_flower_weight) >= 100 || Number(o.total_amount) >= 400),
      merges: clusterMerges,
    });
  });

  return customers.sort((a, b) => b.totalSpent - a.totalSpent);
};

/** Pairs of different clusters with the same normalised name (≥ 2 words). */
export const findDuplicates = (customers: Customer[], dismissed: Set<string>): DuplicatePair[] => {
  const byName = new Map<string, Customer[]>();
  customers.filter((c) => c.identified).forEach((c) => {
    const n = normalizeName(c.name);
    if (n.split(" ").length < 2) return;
    byName.set(n, [...(byName.get(n) || []), c]);
  });
  const pairs: DuplicatePair[] = [];
  byName.forEach((list) => {
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const id = pairId(list[i].key, list[j].key);
        if (!dismissed.has(id)) pairs.push({ a: list[i], b: list[j], id });
      }
  });
  return pairs;
};

export const pairId = (a: string, b: string) => [a, b].sort().join("|");

/** Global KPIs for the clients page. */
export const computeKpis = (customers: Customer[]) => {
  const ids = customers.filter((c) => c.identified);
  const loyal = ids.filter((c) => c.ordersCount >= 2);
  const totalOrders = customers.reduce((s, c) => s + c.ordersCount, 0);
  const top2 = [...ids].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 2);
  return {
    clients: ids.length,
    loyal: loyal.length,
    loyalOrders: loyal.reduce((s, c) => s + c.ordersCount, 0),
    totalOrders,
    top2Share: top2.reduce((s, c) => s + c.shareOfRevenue, 0),
    toRelaunch: ids.filter((c) => c.status === "À relancer").length,
    asleep: ids.filter((c) => c.status === "Endormi").length,
    firstDate: customers.reduce<Date | null>((d, c) => (!d || c.firstOrderDate < d ? c.firstOrderDate : d), null),
  };
};

/** Case/accent-insensitive search on name, phone, email and products. */
export const matchesSearch = (c: Customer, q: string) => {
  const s = normalizeName(q);
  if (!s) return true;
  const digits = q.replace(/\D/g, "");
  return (
    normalizeName(c.name).includes(s) ||
    c.emails.some((e) => e.includes(s)) ||
    (digits.length >= 3 && c.phones.some((p) => p.includes(digits))) ||
    c.orders.some((o) => o.products.some((p) => normalizeName(p.name).includes(s)))
  );
};

/** Rhythm label. */
export const rhythmLabel = (c: Customer) =>
  c.avgIntervalDays ? `tous les ${Math.round(c.avgIntervalDays)} j` : "1 seule commande";

/** CSV export (semicolon, BOM added by caller). */
export const customersToCsv = (list: Customer[]): string => {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ["Client", "Téléphones", "E-mails", "Commandes", "Total (€)", "Panier moyen (€)", "Première commande", "Dernière commande", "Jours depuis", "Rythme", "Produit du moment", "Produit favori", "Livraison", "Paiement", "Statut", "Revendeur"];
  const rows = list.map((c) => [
    c.name, c.phones.join(", "), c.emails.join(", "), c.ordersCount,
    c.totalSpent.toFixed(2).replace(".", ","), c.avgBasket.toFixed(2).replace(".", ","),
    fmtShortDate(c.firstOrderDate), fmtShortDate(c.lastOrderDate), c.daysSinceLast, rhythmLabel(c),
    c.productOfTheMoment || "", c.favoriteProduct || "", c.deliveryHabit, c.paymentHabit, c.status, c.isReseller ? "oui" : "",
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(";")).join("\n");
};

/** Message template — no health or effect claims. */
export const messageTemplate = (c: Customer) => {
  const first = c.name.split(" ")[0] || "";
  return `Bonjour ${first}, c'est l'équipe High Society Botanicals. Votre dernière commande de ${c.productOfTheMoment || "nos produits"} date du ${fmtDate(c.lastOrderDate)}. Souhaitez-vous qu'on vous en prévoie pour cette semaine ?`;
};

/** International phone for wa.me (33XXXXXXXXX). */
export const toIntlPhone = (p: string) => (p.startsWith("0") ? "33" + p.slice(1) : p);
