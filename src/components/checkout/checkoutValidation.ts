// Règles du tunnel de commande (tiroir du panier) : une seule source pour les messages d'erreur
// affichés champ par champ, l'activation du bouton « Payer » et l'adresse transmise au serveur.

export type DeliveryType = "postal" | "personal" | "relay";
export type PersonalZone = "10" | "25" | "50" | "100" | null;

// Mêmes zones et mêmes seuils que DeliverySection (livraison personnelle).
export const ZONE_OPTIONS: { value: Exclude<PersonalZone, null>; label: string; min: number }[] = [
  { value: "10", label: "Moins de 10 km", min: 2.5 },
  { value: "25", label: "Moins de 25 km", min: 5 },
  { value: "50", label: "Moins de 50 km", min: 50 },
  { value: "100", label: "Moins de 100 km", min: 100 },
];
export const PERSONAL_MIN_WEIGHT = 2.5;

export interface CheckoutDetails {
  fullName: string;
  phone: string;
  street: string;
  complement: string;
  postalCode: string;
  city: string;
  personalZone: PersonalZone;
  scheduledDate: Date | undefined;
  scheduledTime: string;
  relayPointId: string;
  relayPointName: string;
  relayPointAddress: string;
}

export const EMPTY_DETAILS: CheckoutDetails = {
  fullName: "",
  phone: "",
  street: "",
  complement: "",
  postalCode: "",
  city: "",
  personalZone: null,
  scheduledDate: undefined,
  scheduledTime: "",
  relayPointId: "",
  relayPointName: "",
  relayPointAddress: "",
};

export type DetailField =
  | "mode"
  | "zone"
  | "relay"
  | "street"
  | "complement"
  | "postalCode"
  | "city"
  | "fullName"
  | "phone";
export type DetailErrors = Partial<Record<DetailField, string>>;

// Ordre d'affichage dans le formulaire : sert à placer le curseur sur la première erreur.
export const FIELD_ORDER: DetailField[] = ["mode", "zone", "relay", "street", "complement", "postalCode", "city", "fullName", "phone"];

// Identifiant HTML de chaque champ (pour le focus et les libellés).
export const FIELD_IDS: Record<DetailField, string> = {
  mode: "co-mode",
  zone: "co-zone",
  relay: "co-relay-cp",
  street: "co-street",
  complement: "co-complement",
  postalCode: "co-postal",
  city: "co-city",
  fullName: "co-name",
  phone: "co-phone",
};

// Libellés courts pour la ligne « Pour payer, complétez : … ».
export const FIELD_LABELS: Record<DetailField, string> = {
  mode: "le mode de livraison",
  zone: "la zone de livraison",
  relay: "le point relais",
  street: "l'adresse",
  complement: "le complément d'adresse",
  postalCode: "le code postal",
  city: "la ville",
  fullName: "votre nom",
  phone: "votre téléphone",
};

const hasLetter = (s: string) => /\p{L}/u.test(s);
export const cleanSpaces = (s: string) => s.replace(/\s+/g, " ").trim();
// Espace insécable : « 2,5 g » ne se coupe jamais en fin de ligne.
export const formatGrams = (g: number) => `${String(g).replace(".", ",")} g`;

// ---------- contact ----------

// « +33 (0)6 12 34 56 78 » : le 0 placé après l'indicatif 33 est retiré (+33612345678).
export const normalizePhone = (raw: string) => raw.replace(/[\s.\-()/]/g, "").replace(/^((?:\+|00)33)0/, "$1");

// Numéro tel qu'il est enregistré (commande, profil) : saisie de la cliente, sans le « (0) » ni le 0 placé
// après +33, qui feraient refuser le numéro par l'étiquette Colissimo.
export const tidyPhone = (raw: string) =>
  cleanSpaces(
    raw
      .replace(/\(\s*0\s*\)/g, " ")
      .trim()
      .replace(/^((?:\+|00)33)[\s.\-]*0(?=[\s.\-]*[1-9])/, "$1 "),
  );

export function phoneError(raw: string): string | null {
  const v = normalizePhone(raw);
  if (!v) return "Indiquez votre numéro de téléphone.";
  if (raw.trim().length > 20) return "Numéro trop long (20 caractères au maximum).";
  const ok =
    /^0[1-9]\d{8}$/.test(v) ||
    /^(?:\+|00)33[1-9]\d{8}$/.test(v) ||
    /^(?:\+|00)(?!33)[1-9]\d{6,13}$/.test(v);
  return ok ? null : "Numéro invalide : 10 chiffres, par exemple 06 12 34 56 78.";
}

export function fullNameError(raw: string): string | null {
  const v = cleanSpaces(raw);
  if (!v) return "Indiquez votre prénom et votre nom.";
  if (v.length > 200) return "200 caractères au maximum.";
  const words = v.split(" ").filter(hasLetter);
  if (words.length < 2) return "Indiquez votre prénom et votre nom (pour l'étiquette du colis).";
  return null;
}

export function emailError(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Indiquez votre adresse e-mail.";
  if (v.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return "Adresse e-mail invalide (exemple : prenom@domaine.fr).";
  }
  return null;
}

export const PASSWORD_MIN = 6;

export function newPasswordError(raw: string): string | null {
  if (!raw) return "Choisissez un mot de passe.";
  if (raw.length < PASSWORD_MIN) return `${PASSWORD_MIN} caractères au minimum.`;
  if (raw.length > 72) return "72 caractères au maximum.";
  return null;
}

export function currentPasswordError(raw: string): string | null {
  return raw ? null : "Indiquez votre mot de passe.";
}

// ---------- adresse ----------

export function streetError(raw: string, deliveryType: DeliveryType): string | null {
  const v = cleanSpaces(raw);
  if (!v) {
    return deliveryType === "personal"
      ? "Indiquez l'adresse ou le lieu de remise."
      : "Indiquez le numéro et le nom de la rue.";
  }
  if (v.length < 4 || !hasLetter(v)) return "Adresse trop courte (exemple : 12 rue de la Paix).";
  if (v.length > 200) return "200 caractères au maximum.";
  return null;
}

export function complementError(raw: string): string | null {
  return cleanSpaces(raw).length > 200 ? "200 caractères au maximum." : null;
}

export function postalCodeError(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Indiquez le code postal.";
  if (!/^\d{5}$/.test(v)) return "Le code postal comporte 5 chiffres.";
  return null;
}

export function cityError(raw: string): string | null {
  const v = cleanSpaces(raw);
  if (!v) return "Indiquez la ville.";
  if (v.length < 2 || !hasLetter(v)) return "Nom de ville invalide.";
  if (v.length > 100) return "100 caractères au maximum.";
  return null;
}

// ---------- ensemble ----------

export interface DeliveryContext {
  isProActive: boolean;
  totalFlowerWeight: number;
}

export const canUsePersonalDelivery = (ctx: DeliveryContext) =>
  ctx.isProActive || ctx.totalFlowerWeight >= PERSONAL_MIN_WEIGHT;

export const isZoneEligible = (zone: { min: number }, ctx: DeliveryContext) =>
  ctx.isProActive || ctx.totalFlowerWeight >= zone.min;

export function validateDetails(d: CheckoutDetails, type: DeliveryType, ctx: DeliveryContext): DetailErrors {
  const e: DetailErrors = {};
  const put = (k: DetailField, msg: string | null) => {
    if (msg) e[k] = msg;
  };

  if (type === "personal") {
    if (!canUsePersonalDelivery(ctx)) {
      e.mode = `La livraison personnelle est disponible à partir de ${formatGrams(PERSONAL_MIN_WEIGHT)} de fleurs.`;
    }
    const zone = ZONE_OPTIONS.find((z) => z.value === d.personalZone);
    if (!zone) e.zone = "Choisissez votre zone.";
    else if (!isZoneEligible(zone, ctx)) e.zone = `Cette zone demande au moins ${formatGrams(zone.min)} de fleurs.`;
  }

  if (type === "relay" && !d.relayPointId) e.relay = "Choisissez un point relais.";

  if (type === "postal" || type === "personal") {
    put("street", streetError(d.street, type));
    put("complement", complementError(d.complement));
    put("postalCode", postalCodeError(d.postalCode));
    put("city", cityError(d.city));
  }

  put("fullName", fullNameError(d.fullName));
  put("phone", phoneError(d.phone));
  return e;
}

export const firstErrorField = (errors: DetailErrors): DetailField | null =>
  FIELD_ORDER.find((f) => !!errors[f]) ?? null;

export function missingSummary(errors: DetailErrors): string {
  const labels = FIELD_ORDER.filter((f) => !!errors[f]).map((f) => FIELD_LABELS[f]);
  return labels.join(", ");
}

// Adresse envoyée au serveur. Même format que l'ancien formulaire postal (« rue, complément, CP, ville, France »),
// lu par l'étiquette Colissimo et, pour la livraison personnelle, par le calcul des kilomètres (Google).
export function buildDeliveryAddress(d: CheckoutDetails, type: DeliveryType): string {
  if (type === "relay") return d.relayPointAddress;
  return [cleanSpaces(d.street), cleanSpaces(d.complement), d.postalCode.trim(), cleanSpaces(d.city), "France"]
    .filter(Boolean)
    .join(", ");
}

// ---------- erreurs d'authentification (Supabase) en français ----------

export type AuthErrorKind = "exists" | "credentials" | "unconfirmed" | "unknown_user" | "rate" | "other";

export function authErrorMessage(err: unknown): { kind: AuthErrorKind; message: string } {
  const e = (err ?? {}) as { message?: unknown; code?: unknown; status?: unknown };
  const m = String(e.message ?? err ?? "").toLowerCase();
  const code = String(e.code ?? "");
  const status = Number(e.status ?? 0);

  if (code === "user_already_exists" || code === "email_exists" || m.includes("already registered") || m.includes("already been registered")) {
    return { kind: "exists", message: "Un compte existe déjà avec cette adresse e-mail. Connectez-vous pour continuer." };
  }
  if (code === "invalid_credentials" || m.includes("invalid login credentials")) {
    return { kind: "credentials", message: "E-mail ou mot de passe incorrect." };
  }
  if (code === "email_not_confirmed" || m.includes("email not confirmed")) {
    return {
      kind: "unconfirmed",
      message: "Votre adresse e-mail n'est pas encore confirmée : ouvrez le lien reçu par e-mail, puis réessayez.",
    };
  }
  if (code === "otp_disabled" || code === "user_not_found" || m.includes("signups not allowed for otp") || m.includes("user not found")) {
    return { kind: "unknown_user", message: "Aucun compte ne correspond à cette adresse e-mail." };
  }
  if (code === "weak_password" || m.includes("easy to guess") || m.includes("pwned") || m.includes("weak password")) {
    return { kind: "other", message: "Ce mot de passe est trop courant : choisissez-en un plus personnel." };
  }
  if (m.includes("password should be at least")) {
    return { kind: "other", message: `Mot de passe trop court : ${PASSWORD_MIN} caractères au minimum.` };
  }
  if (status === 429 || code.startsWith("over_") || m.includes("rate limit") || m.includes("too many")) {
    return { kind: "rate", message: "Trop de tentatives en peu de temps. Patientez quelques minutes, puis réessayez." };
  }
  if (code === "email_address_invalid" || m.includes("invalid email") || (m.includes("email address") && m.includes("invalid"))) {
    return { kind: "other", message: "Cette adresse e-mail n'est pas acceptée. Vérifiez-la." };
  }
  if (code === "signup_disabled" || m.includes("signups not allowed")) {
    return { kind: "other", message: "Les inscriptions sont momentanément fermées. Écrivez-nous depuis la page Contact." };
  }
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed")) {
    return { kind: "other", message: "Connexion impossible. Vérifiez votre réseau, puis réessayez." };
  }
  return { kind: "other", message: "Une erreur est survenue. Réessayez dans un instant." };
}
