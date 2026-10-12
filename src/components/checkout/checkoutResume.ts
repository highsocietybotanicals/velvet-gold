// Reprise du tunnel de commande après un aller-retour hors du site (connexion Google/Apple,
// lien de connexion ou de confirmation reçu par e-mail) : le panier, lui, est déjà conservé
// dans le navigateur par CartContext ; ce repère rouvre simplement le tiroir à l'étape livraison.

const RESUME_KEY = "hsb-checkout-resume";
const RESUME_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 h

/** Paramètre d'URL qui rouvre le tiroir du panier (ex. /?panier=1). */
export const CART_RETURN_PARAM = "panier";

export function markCheckoutResume(): void {
  try {
    localStorage.setItem(RESUME_KEY, String(Date.now()));
  } catch {
    /* navigation privée ou stockage bloqué : la reprise automatique est simplement perdue */
  }
}

export function clearCheckoutResume(): void {
  try {
    localStorage.removeItem(RESUME_KEY);
  } catch {
    /* rien à faire */
  }
}

/** Vrai si une reprise récente est en attente (sans la consommer). */
export function hasPendingCheckoutResume(): boolean {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at) || Date.now() - at > RESUME_MAX_AGE_MS) {
      localStorage.removeItem(RESUME_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Brouillon de l'étape « Votre compte » (nom, e-mail, téléphone — jamais le mot de passe), gardé le temps
// de l'onglet : un retour au panier par erreur ne fait rien perdre. Effacé dès que la cliente est connectée.
const DRAFT_KEY = "hsb-checkout-account-draft";
export type AccountDraft = { fullName?: string; email?: string; phone?: string };

export function readAccountDraft(): AccountDraft {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "{}");
    if (!parsed || typeof parsed !== "object") return {};
    const text = (v: unknown) => (typeof v === "string" ? v : undefined);
    return { fullName: text(parsed.fullName), email: text(parsed.email), phone: text(parsed.phone) };
  } catch {
    return {};
  }
}

export function saveAccountDraft(draft: AccountDraft): void {
  try {
    if (!draft.fullName && !draft.email && !draft.phone) sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* stockage indisponible : le brouillon n'est simplement pas gardé */
  }
}

export function clearAccountDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* rien à faire */
  }
}

// Code promo noté avant la connexion (BIENVENUE15) : gardé dans le navigateur pour survivre au rechargement
// de la page après une connexion Google / Apple ou un lien reçu par e-mail (souvent ouvert dans un autre onglet).
// Même durée de validité que la reprise du tunnel. Le serveur revérifie toujours le code au paiement.
const PROMO_KEY = "hsb-checkout-pending-promo";
// Seuls les codes réservés aux comptes peuvent être mis en attente (le tiroir leur applique -15 %).
const PENDABLE_PROMO_CODES = ["BIENVENUE15"];

export function savePendingPromo(code: string): void {
  try {
    localStorage.setItem(PROMO_KEY, JSON.stringify({ code, at: Date.now() }));
  } catch {
    /* stockage indisponible : le code reste seulement en mémoire */
  }
}

export function readPendingPromo(): string {
  try {
    const raw = localStorage.getItem(PROMO_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { code?: unknown; at?: unknown } | null;
    const code = typeof parsed?.code === "string" ? parsed.code.trim().toUpperCase() : "";
    const at = Number(parsed?.at);
    if (!PENDABLE_PROMO_CODES.includes(code) || !Number.isFinite(at) || Date.now() - at > RESUME_MAX_AGE_MS) {
      localStorage.removeItem(PROMO_KEY);
      return "";
    }
    return code;
  } catch {
    return "";
  }
}

export function clearPendingPromo(): void {
  try {
    localStorage.removeItem(PROMO_KEY);
  } catch {
    /* rien à faire */
  }
}

/** Adresse de retour vers la page courante, tiroir du panier rouvert. */
export function cartReturnUrl(): string {
  return `${window.location.origin}${window.location.pathname}?${CART_RETURN_PARAM}=1`;
}
