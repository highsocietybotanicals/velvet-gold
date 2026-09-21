import jsPDF from "jspdf";
import { PRO_TIERS, TIER_DISCOUNT, getProPricePerGram, type PriceTier } from "./margin";
import { BANK_DETAILS } from "./bankDetails";

// A4 portrait : 210 × 297 mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

const GOLD = [184, 134, 11] as const;
const DARK = [35, 35, 35] as const;
const GRAY = [115, 115, 115] as const;
const LIGHT = [205, 205, 205] as const;
const BLACK = [12, 12, 14] as const;
const WHITE = [255, 255, 255] as const;

const SITE = "highsocietybotanicals.com";
const PHONE = "07 56 91 13 43";

export interface DocProduct {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  category: string; // "fleur" | "resine"
  cbdPercentage?: string;
  molecule?: string;
  isForceNoire?: boolean;
  isExotique?: boolean;
  /** Prix public TTC au gramme (site) */
  publicPrice: number;
  /** URL ou data-url du visuel produit (catalogue uniquement) */
  image?: string;
}

// ---------- helpers bas niveau ----------
function setFont(
  doc: jsPDF,
  size: number,
  style: "normal" | "bold" | "italic" = "normal",
  color: readonly [number, number, number] = DARK
) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

function hLine(doc: jsPDF, y: number, color: readonly [number, number, number] = LIGHT, width = 0.3) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, h, "F");
}

/** Titre courant en lettres espacées */
function spacedTitle(doc: jsPDF, text: string, y: number, size = 15) {
  setFont(doc, size, "bold", DARK);
  const spaced = text.toUpperCase().split("").join(" ");
  doc.text(spaced, PAGE_W / 2, y, { align: "center" });
}

function footer(doc: jsPDF, pageLabel: string) {
  setFont(doc, 7, "normal", GRAY);
  doc.text(`HIGH SOCIETY BOTANICALS · ${SITE}`, MARGIN, PAGE_H - 8);
  doc.text(pageLabel, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
}

/** Paragraphe justifié gauche, renvoie le nouveau y */
function para(doc: jsPDF, text: string, y: number, size = 9.5, color: readonly [number, number, number] = DARK, style: "normal" | "bold" | "italic" = "normal"): number {
  setFont(doc, size, style, color);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + lines.length * (size * 0.45);
}

// ---------- couverture sombre ----------
function darkCover(doc: jsPDF, title: string, subtitle: string, lines: string[]) {
  fillRect(doc, 0, 0, PAGE_W, PAGE_H, BLACK);
  setFont(doc, 26, "bold", GOLD);
  doc.text("HSB", PAGE_W / 2, 40, { align: "center" });
  setFont(doc, 11, "normal", GOLD);
  doc.text("H I G H   S O C I E T Y   B O T A N I C A L S", PAGE_W / 2, 52, { align: "center" });

  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(0.6);
  doc.line(PAGE_W / 2 - 30, 62, PAGE_W / 2 + 30, 62);

  setFont(doc, 24, "bold", WHITE);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), CONTENT_W);
  doc.text(titleLines, PAGE_W / 2, 105, { align: "center" });
  let y = 105 + titleLines.length * 10 + 4;
  setFont(doc, 12, "italic", GOLD);
  doc.text(subtitle, PAGE_W / 2, y, { align: "center" });
  y += 16;

  setFont(doc, 9.5, "normal", [200, 200, 200]);
  for (const l of lines) {
    const wrapped = doc.splitTextToSize(l, CONTENT_W - 30);
    doc.text(wrapped, PAGE_W / 2, y, { align: "center" });
    y += wrapped.length * 5 + 2;
  }

  setFont(doc, 10, "normal", GOLD);
  doc.text("H·S·B", PAGE_W / 2, PAGE_H - 32, { align: "center" });
  setFont(doc, 8.5, "normal", [160, 160, 160]);
  doc.text(`${SITE} · ${PHONE}`, PAGE_W / 2, PAGE_H - 22, { align: "center" });
}

// ---------- utilitaires données ----------
const TIER_WEIGHTS = [50, 100, 250, 500, 1000]; // poids représentatif de chaque palier
const TIER_COL_LABELS = ["jusqu’à 100 g", "dès 100 g", "dès 250 g", "dès 500 g", "dès 1 kg"];

function familleLabel(p: DocProduct): string {
  if (p.isExotique) return "Exotique";
  if (p.isForceNoire) return "Force Noire";
  return "Classique";
}

const eur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

// ============================================================
// 1. GRILLE TARIFAIRE PRO — PRÉCONDITIONNÉ
// ============================================================
export function generateProPriceGrid(products: DocProduct[], tiers: PriceTier[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // --- Couverture ---
  darkCover(doc, "Grille Tarifaire Partenaire", "Vente directe · Préconditionné exclusif", [
    "Maison française de CBD haut de gamme. Culture 100 % indoor, traçabilité complète, conforme à la législation française.",
    "Une sélection destinée aux partenaires exigeants qui souhaitent fidéliser une clientèle de qualité.",
  ]);

  // --- Notre engagement ---
  doc.addPage();
  let y = 24;
  spacedTitle(doc, "Notre engagement", y);
  y += 8;
  setFont(doc, 10, "italic", GRAY);
  doc.text("L'écrin fait l'exception.", PAGE_W / 2, y, { align: "center" });
  y += 6;
  setFont(doc, 9, "normal", GRAY);
  doc.text(
    "Chaque fleur et chaque résine quitte notre maison dans un préconditionné pensé comme un écrin.",
    PAGE_W / 2, y, { align: "center" }
  );
  y += 12;

  const engagements: Array<[string, string]> = [
    ["I. Préconditionné exclusif",
      "Aucun format vrac. Chaque poids est scellé à la source pour préserver l'intégrité du séchage, l'expression des terpènes et la fraîcheur — condition non négociable de notre expertise."],
    ["II. Pochon aluminium HSB",
      "Aluminium alimentaire hermétique, opaque anti-UV, aux couleurs de la Maison. Un objet de vitrine qui distingue vos linéaires et signe votre exigence."],
    ["III. Boveda 62 % inclus",
      "Chaque pochon renferme un régulateur d'humidité Boveda 62 % — la garantie d'une saveur intacte, du départ de nos ateliers jusqu'à la main du client."],
    ["IV. Kit cadeau client offert",
      "Chaque pochon de 10 g contient un briquet BIC et un paquet de feuilles + carton, offerts au client final. Aucun surcoût sur le tarif partenaire."],
  ];
  for (const [title, body] of engagements) {
    setFont(doc, 10.5, "bold", GOLD);
    doc.text(title, MARGIN, y);
    y += 5;
    y = para(doc, body, y, 9.5);
    y += 7;
  }
  footer(doc, "II · Engagement");

  // --- Barème ---
  doc.addPage();
  y = 24;
  spacedTitle(doc, "Barème partenaire", y);
  y += 10;
  setFont(doc, 11, "bold", DARK);
  doc.text("Grille de remises dégressives", PAGE_W / 2, y, { align: "center" });
  y += 5;
  setFont(doc, 9, "normal", GRAY);
  doc.text("Prix professionnel HT fixe par variété. La remise s'applique sur le poids total de la commande,", PAGE_W / 2, y, { align: "center" });
  doc.text("tous produits confondus.", PAGE_W / 2, y + 4.5, { align: "center" });
  y += 16;

  // Tableau des paliers depuis les vraies données
  const colW = [60, 55, 55];
  let cx = MARGIN;
  fillRect(doc, MARGIN, y, CONTENT_W, 8, GOLD);
  setFont(doc, 8.5, "bold", WHITE);
  doc.text("VOLUME COMMANDÉ", cx + 3, y + 5.5); cx += colW[0];
  doc.text("PALIER", cx + 3, y + 5.5); cx += colW[1];
  doc.text("REMISE", cx + colW[2] - 3, y + 5.5, { align: "right" });
  y += 8;

  const palierNames = ["Palier découverte", "Palier confirmé", "Palier privilège", "Palier majeur", "Palier maison"];
  PRO_TIERS.forEach((tierMax, i) => {
    const discount = TIER_DISCOUNT[tierMax] ?? 0;
    if (i % 2 === 1) fillRect(doc, MARGIN, y, CONTENT_W, 8, [247, 243, 234]);
    cx = MARGIN;
    setFont(doc, 9, "normal", DARK);
    doc.text(TIER_COL_LABELS[i], cx + 3, y + 5.5); cx += colW[0];
    doc.text(palierNames[i] ?? "", cx + 3, y + 5.5); cx += colW[1];
    setFont(doc, 9, "bold", discount > 0 ? GOLD : DARK);
    doc.text(discount > 0 ? `-${discount} %` : "tarif de base", cx + colW[2] - 3, y + 5.5, { align: "right" });
    hLine(doc, y + 8, LIGHT, 0.2);
    y += 8;
  });
  y += 8;

  setFont(doc, 10, "bold", GOLD);
  doc.text("LECTURE DU BARÈME", MARGIN, y);
  y += 5;
  y = para(doc,
    "Exemple : pour une commande de 300 g, la remise de 10 % s'applique sur le prix HT de l'ensemble des variétés commandées. Le prix au gramme imprimé page suivante est le tarif de base (moins de 100 g) : déduisez la remise du palier atteint.",
    y, 9.5);
  y += 4;
  y = para(doc,
    "Aucun frais de conditionnement · Kit cadeau client inclus dans chaque 10 g.",
    y, 9.5, GRAY, "italic");
  footer(doc, "III · Barème");

  // --- Tarifs par variété ---
  doc.addPage();
  y = 24;
  spacedTitle(doc, "Tarifs partenaire", y);
  y += 8;
  setFont(doc, 9, "normal", GRAY);
  doc.text("Prix professionnels HT au gramme, par palier de volume. Prix public conseillé identique au site.", PAGE_W / 2, y, { align: "center" });
  y += 8;

  const cName = 52;
  const cFam = 22;
  const cPv = 20;
  const cTier = (CONTENT_W - cName - cFam - cPv) / TIER_WEIGHTS.length; // ~17.2

  fillRect(doc, MARGIN, y, CONTENT_W, 7, GOLD);
  setFont(doc, 7, "bold", WHITE);
  cx = MARGIN;
  doc.text("PRODUIT", cx + 2, y + 4.8); cx += cName;
  doc.text("GAMME", cx + 2, y + 4.8); cx += cFam;
  doc.text("PV TTC/g", cx + cPv / 2, y + 4.8, { align: "center" }); cx += cPv;
  for (const l of TIER_COL_LABELS) {
    doc.text(l, cx + cTier / 2, y + 4.8, { align: "center" });
    cx += cTier;
  }
  y += 7;

  const rowH = 11;
  products.forEach((p, idx) => {
    if (y + rowH > PAGE_H - 20) {
      footer(doc, "IV · Tarifs");
      doc.addPage();
      y = 24;
    }
    if (idx % 2 === 1) fillRect(doc, MARGIN, y, CONTENT_W, rowH, [247, 243, 234]);
    hLine(doc, y, LIGHT, 0.2);

    cx = MARGIN;
    setFont(doc, 8.5, "bold", DARK);
    const nm = p.name.length > 26 ? p.name.slice(0, 25) + "…" : p.name;
    doc.text(nm, cx + 2, y + 4.5);
    setFont(doc, 6.5, "italic", GRAY);
    doc.text(`${p.category === "fleur" ? "Fleur" : "Résine"}${p.cbdPercentage ? ` · ${p.cbdPercentage}` : ""}`, cx + 2, y + 9);
    cx += cName;
    setFont(doc, 7.5, "normal", p.isExotique || p.isForceNoire ? GOLD : GRAY);
    doc.text(familleLabel(p), cx + 2, y + 4.5);
    cx += cFam;
    setFont(doc, 8, "normal", DARK);
    doc.text(eur(p.publicPrice), cx + cPv / 2, y + 4.5, { align: "center" });
    cx += cPv;
    TIER_WEIGHTS.forEach((w) => {
      const price = getProPricePerGram(tiers, p.id, w);
      setFont(doc, 8, "bold", DARK);
      doc.text(price != null ? price.toFixed(2).replace(".", ",") : "—", cx + cTier / 2, y + 4.5, { align: "center" });
      cx += cTier;
    });
    y += rowH;
  });
  hLine(doc, y, DARK, 0.4);
  y += 6;
  setFont(doc, 7.5, "normal", GRAY);
  doc.text("Prix HT au gramme, préconditionné 1 g · 2,5 g · 5 g · 10 g. Boveda 62 % et kit cadeau client (briquet BIC + feuilles/carton) inclus.", MARGIN, y);
  doc.text("Marge conseillée : coefficient ×2 HT minimum en revente au prix public conseillé.", MARGIN, y + 4);
  footer(doc, "IV · Tarifs");

  // --- Modalités ---
  doc.addPage();
  y = 24;
  spacedTitle(doc, "Modalités partenaire", y);
  y += 10;
  setFont(doc, 11, "bold", GOLD);
  doc.text("Passer commande", PAGE_W / 2, y, { align: "center" });
  y += 10;

  const modalites: Array<[string, string]> = [
    ["Commande minimum", "50 g toutes références confondues, en préconditionné (multiples de 10 g)."],
    ["Délais", "Expédition sous 24 à 48 h ouvrées après réception du règlement."],
    ["Livraison", "Colissimo suivi & assuré ou remise en main propre sur la région Grand Ouest."],
    ["Règlement", "Carte bancaire (à privilégier) ou virement bancaire. Aucun règlement en espèces ni par chèque."],
    ["Traçabilité", "Certificats d'analyse et documentation légale fournis sur simple demande."],
    ["Retour & SAV", "Suivi personnalisé. Toute anomalie prise en charge sous 48 h."],
  ];
  for (const [t, b] of modalites) {
    setFont(doc, 9.5, "bold", DARK);
    doc.text(t, MARGIN, y);
    y = para(doc, b, y + 4.5, 9);
    y += 5;
  }

  y += 3;
  fillRect(doc, MARGIN, y, CONTENT_W, 24, [247, 243, 234]);
  setFont(doc, 8.5, "bold", GOLD);
  doc.text("COORDONNÉES BANCAIRES (VIREMENT)", MARGIN + 4, y + 6);
  setFont(doc, 8, "normal", DARK);
  doc.text(`Titulaire : ${BANK_DETAILS.holder}`, MARGIN + 4, y + 12);
  doc.text(`IBAN : ${BANK_DETAILS.iban}`, MARGIN + 4, y + 17);
  doc.text(`BIC : ${BANK_DETAILS.bic}`, MARGIN + 4, y + 22);
  y += 34;

  setFont(doc, 9.5, "normal", GRAY);
  doc.text("Pour toute demande de devis personnalisé", PAGE_W / 2, y, { align: "center" });
  doc.text("ou pour convenir d'une première commande test :", PAGE_W / 2, y + 5, { align: "center" });
  setFont(doc, 10, "bold", GOLD);
  doc.text(`${PHONE} · ${SITE}`, PAGE_W / 2, y + 12, { align: "center" });
  setFont(doc, 8, "italic", GRAY);
  doc.text("High Society Botanicals — Maison française · CBD haut de gamme · 100 % légal", PAGE_W / 2, y + 19, { align: "center" });
  footer(doc, "V · Modalités");

  return doc;
}

// ============================================================
// 2. CATALOGUE PRO — VENTE DIRECTE
// ============================================================
async function loadImageData(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    if (typeof Image === "undefined" || typeof document === "undefined") return null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("img load"));
      img.src = url;
    });
    const max = 600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL("image/jpeg", 0.85), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

export async function generateProCatalogue(products: DocProduct[], tiers: PriceTier[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // --- Couverture ---
  darkCover(doc, "Catalogue Professionnel", "Sélection 2026 · Prête à vendre", [
    "100 % indoor — Préconditionné 1 g · 2,5 g · 5 g · 10 g",
    "Analyses laboratoire disponibles — Codes-barres EAN-13 sur chaque format",
    "Document à remettre aux partenaires",
  ]);

  // --- La marque ---
  doc.addPage();
  let y = 24;
  spacedTitle(doc, "La marque", y);
  y += 8;
  setFont(doc, 10.5, "italic", GRAY);
  doc.text("Une gamme courte. Une exigence rare.", PAGE_W / 2, y, { align: "center" });
  doc.text("Pensée pour les commerces qui veulent fidéliser par la qualité.", PAGE_W / 2, y + 5.5, { align: "center" });
  y += 16;

  const pillars: Array<[string, string]> = [
    ["NOTRE SÉLECTION", "Plus de 200 variétés testées. Une dizaine retenues."],
    ["100 % INDOOR", "Des fleurs et résines sélectionnées pour leur aspect, leur identité aromatique et leur régularité."],
    ["PACKAGING PREMIUM", "Pochon aluminium alimentaire, scellé et prêt à exposer. Boveda 62 % intégré pour préserver la qualité."],
    ["PREUVES DISPONIBLES", "Analyses de laboratoire par référence et par lot, consultables par le commercial en un clic."],
    ["VENTE SIMPLIFIÉE", "Quatre formats, quatre EAN-13, un prix public conseillé cohérent et une marge claire pour le revendeur."],
  ];
  for (const [t, b] of pillars) {
    setFont(doc, 10, "bold", GOLD);
    doc.text(t, MARGIN, y);
    y += 5;
    y = para(doc, b, y, 9.5);
    y += 8;
  }
  footer(doc, "2");

  // --- Fiches produits : 3 par page ---
  // Pré-chargement des visuels
  const images = await Promise.all(products.map((p) => (p.image ? loadImageData(p.image) : null)));

  const CARD_H = 82;
  const perPage = 3;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (i % perPage === 0) {
      if (i > 0) footer(doc, "Le catalogue");
      doc.addPage();
      y = 22;
      spacedTitle(doc, "Le catalogue", y, 13);
      y += 10;
    }

    const fam = familleLabel(p);
    // Carte
    doc.setDrawColor(LIGHT[0], LIGHT[1], LIGHT[2]);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, CONTENT_W, CARD_H);

    // Bandeau gamme
    fillRect(doc, MARGIN, y, CONTENT_W, 7, p.isExotique || p.isForceNoire ? BLACK : GOLD);
    setFont(doc, 7.5, "bold", p.isExotique || p.isForceNoire ? GOLD : WHITE);
    doc.text(fam.toUpperCase(), MARGIN + CONTENT_W / 2, y + 4.8, { align: "center" });

    // Image
    const img = images[i];
    const imgSize = CARD_H - 16;
    if (img) {
      const ratio = Math.min(imgSize / img.w, imgSize / img.h);
      const w = img.w * ratio;
      const h = img.h * ratio;
      doc.addImage(img.data, "JPEG", MARGIN + 4, y + 11, w, h);
    }

    // Texte
    const tx = MARGIN + imgSize + 10;
    const tw = CONTENT_W - imgSize - 14;
    let ty = y + 15;
    setFont(doc, 12, "bold", DARK);
    doc.text(p.name, tx, ty);
    if (p.molecule) {
      setFont(doc, 8, "bold", GOLD);
      doc.text(p.molecule, MARGIN + CONTENT_W - 4, ty, { align: "right" });
    }
    ty += 5;
    setFont(doc, 8, "normal", GRAY);
    doc.text(
      `${p.category === "fleur" ? "FLEUR" : "RÉSINE"}${p.cbdPercentage ? ` · ${p.cbdPercentage}` : ""}${p.subtitle ? ` · ${p.subtitle}` : ""}`.toUpperCase(),
      tx, ty
    );
    ty += 6;
    if (p.description) {
      setFont(doc, 8.5, "italic", DARK);
      const lines = doc.splitTextToSize(p.description, tw);
      doc.text(lines.slice(0, 3), tx, ty);
      ty += Math.min(lines.length, 3) * 4 + 2;
    }
    ty += 2;
    setFont(doc, 8, "bold", DARK);
    doc.text("FORMATS : 1 g · 2,5 g · 5 g · 10 g", tx, ty);
    ty += 6;

    // Prix
    const basePrice = getProPricePerGram(tiers, p.id, 50);
    if (basePrice != null) {
      fillRect(doc, tx - 2, ty - 4, tw, 12, [247, 243, 234]);
      setFont(doc, 8.5, "bold", GOLD);
      doc.text(`Pro HT : ${eur(basePrice)}/g`, tx, ty + 2);
      setFont(doc, 8, "normal", DARK);
      doc.text(`Prix public conseillé : ${eur(p.publicPrice)}/g TTC`, tx, ty + 7);
      setFont(doc, 7, "italic", GRAY);
      doc.text("Dégressivité volume : -5 % dès 100 g · -10 % dès 250 g · -15 % dès 500 g · -20 % dès 1 kg", tx, ty + 11);
    }

    y += CARD_H + 6;
  }
  footer(doc, "Le catalogue");

  return doc;
}

// ============================================================
// 3. GUIDE COMMERCIAL
// ============================================================
export function generateProGuide(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let pageNum = 0;

  const guideFooter = () => {
    pageNum += 1;
    if (pageNum === 1) return; // pas de pied sur la couverture
    setFont(doc, 7, "normal", GRAY);
    doc.text(`HIGH SOCIETY BOTANICALS — Guide commercial, usage interne`, MARGIN, PAGE_H - 8);
    doc.text(`Page ${pageNum - 1}`, PAGE_W - MARGIN, PAGE_H - 8, { align: "right" });
  };
  const newPage = () => { guideFooter(); doc.addPage(); };
  const chapterHead = (num: string, title: string, sub: string) => {
    let y = 26;
    setFont(doc, 9, "bold", GOLD);
    doc.text(`${num} — ${title}`, MARGIN, y);
    y += 6;
    setFont(doc, 12, "bold", DARK);
    doc.text(sub.toUpperCase(), MARGIN, y);
    y += 4;
    hLine(doc, y, GOLD, 0.6);
    return y + 7;
  };
  const box = (y: number, title: string, body: string): number => {
    const lines = doc.splitTextToSize(body, CONTENT_W - 10);
    const h = 10 + lines.length * 4;
    fillRect(doc, MARGIN, y, CONTENT_W, h, [247, 243, 234]);
    setFont(doc, 8.5, "bold", GOLD);
    doc.text(title, MARGIN + 5, y + 6);
    setFont(doc, 8.5, "italic", DARK);
    doc.text(lines, MARGIN + 5, y + 11);
    return y + h + 6;
  };
  const table = (y: number, headers: string[], rows: string[][], widths: number[]): number => {
    fillRect(doc, MARGIN, y, CONTENT_W, 7, GOLD);
    setFont(doc, 8, "bold", WHITE);
    let cx = MARGIN;
    headers.forEach((h, i) => { doc.text(h, cx + 2, y + 4.8); cx += widths[i]; });
    y += 7;
    rows.forEach((r, ri) => {
      // hauteur = max lignes wrappées
      const wrapped = r.map((cell, i) => doc.splitTextToSize(cell, widths[i] - 4) as string[]);
      const rh = Math.max(...wrapped.map((w) => w.length)) * 4 + 3;
      if (ri % 2 === 1) fillRect(doc, MARGIN, y, CONTENT_W, rh, [247, 243, 234]);
      setFont(doc, 8, "normal", DARK);
      cx = MARGIN;
      wrapped.forEach((cellLines, i) => { doc.text(cellLines, cx + 2, y + 4); cx += widths[i]; });
      hLine(doc, y + rh, LIGHT, 0.2);
      y += rh;
    });
    return y + 5;
  };

  // ---------- Couverture ----------
  darkCover(doc, "Guide Commercial", "La marque, la gamme, la légalité, le pitch.", [
    "Tout ce qu'il faut pour démarcher un buraliste avec sérénité.",
    "",
    "EN UNE LIGNE",
    "CBD haut de gamme 100 % indoor, préconditionné, prêt à vendre.",
    "Chaque molécule analysée en laboratoire (GC-MS / GC-FID).",
    "Marge revendeur organisée à ×2 HT, ristournes par volume.",
    "Plus de 200 variétés testées, une dizaine retenues.",
    "",
    "Document interne réservé aux commerciaux mandatés par High Society Botanicals.",
    "Ne pas diffuser publiquement. Molécules proposées à usage de pot-pourri uniquement.",
  ]);

  // ---------- 00 Sommaire ----------
  newPage();
  let y = chapterHead("00", "Sommaire", "Comment utiliser ce guide");
  y = para(doc, "Ce guide se lit en une heure et se garde dans la sacoche. Les chapitres 1 à 4 servent à raconter la marque, les chapitres 5 et 6 à rassurer sur la légalité, les chapitres 7 à 9 à vendre et à répondre aux objections, les chapitres 10 et 11 à cadrer votre rémunération et votre matériel.", y);
  y += 4;
  y = table(y, ["Chapitre", "Contenu", "À utiliser"], [
    ["1. Notre histoire", "Pourquoi HSB existe.", "Ouverture de visite"],
    ["2. Notre exigence", "200+ variétés testées, une dizaine retenues.", "Différenciation"],
    ["3. La gamme", "Fleurs, résines, les familles.", "Présentation produit"],
    ["4. Culture & packaging", "Indoor, aluminium alimentaire, Boveda, formats.", "Argument mise en rayon"],
    ["5. Légalité & analyses", "GC-MS / GC-FID, analyses par molécule.", "Rassurer"],
    ["6. Mention obligatoire", "Usage pot-pourri, cadre de langage.", "À respecter en permanence"],
    ["7. L'offre revendeur", "Marge ×2 HT, ristournes, cadeaux 10 g.", "Négociation"],
    ["8. Le pitch", "Déroulé minuté d'une visite.", "Sur le terrain"],
    ["9. Objections", "Réponses courtes + preuves.", "Sur le terrain"],
    ["10. Rémunération", "10 % fixe, réassorts, prime nouveau client.", "Votre suivi"],
    ["11. Aide-mémoire", "Sacoche, documents, contacts.", "Avant de partir"],
  ], [42, 78, 58]);

  // ---------- 01 Notre histoire ----------
  newPage();
  y = chapterHead("01", "Notre histoire", "D'un fumeur déçu à une maison de sélection");
  y = para(doc, "High Society Botanicals n'est pas née d'un plan marketing. Elle est née d'une lassitude.", y);
  y += 2;
  y = para(doc, "Son fondateur est un ancien fumeur. Pendant des années, le même scénario : tomber sur du foin sans goût, sans odeur, sans tenue. Et quand par chance il trouvait enfin quelque chose de bien, il revenait pour s'entendre dire que la variété n'était plus disponible. On lui proposait autre chose. Nouvelle déception. Encore.", y);
  y += 2;
  y = para(doc, "À force, une évidence : le problème n'est pas la demande, c'est la sélection. Personne ne goûtait vraiment ce qui était vendu. Alors plutôt que de subir, il a décidé de mettre son expertise au service d'une seule mission : trouver les meilleures variétés possibles sur le goût, l'odeur et le visuel, ouvrir un laboratoire, et proposer une gamme dont on n'a jamais honte.", y);
  y += 2;
  y = para(doc, "Le positionnement prix est assumé : nous sommes au niveau des magasins de CBD premium. La différence n'est pas sur l'étiquette, elle est sur la méthode. Les autres vendent sur du « on m'a dit ». Nous, nous testons tout nous-mêmes avant commercialisation.", y);
  y += 4;
  box(y, "À DIRE AU BURALISTE (formulation courte)", "« La marque a été créée par un ancien fumeur fatigué d'acheter du foin et de voir les bonnes variétés disparaître. Résultat : on teste tout avant de le vendre, et on ne référence que ce qui est irréprochable. C'est exactement ce qui fidélise vos clients. »");

  // ---------- 02 Notre exigence ----------
  newPage();
  y = chapterHead("02", "Notre exigence de sélection", "Bon ne suffit pas");
  y = para(doc, "Plus de 200 variétés testées pour n'en retenir qu'une dizaine. C'est le chiffre le plus puissant de votre argumentaire : il dit tout du niveau d'exigence sans avoir à en dire plus.", y);
  y += 2;
  y = para(doc, "Chaque candidate passe la même grille de lecture :", y);
  y += 2;
  const bullets2 = [
    "Le visuel — densité de la fleur, trichomes, couleur, absence de feuilles inutiles. C'est ce que le client voit en premier.",
    "L'odeur — intensité et franchise du profil terpénique à l'ouverture du sachet.",
    "Le goût — tenue et netteté, sans amertume ni note végétale.",
    "La régularité — un lot doit ressembler au précédent. C'est ce qui fait revenir un client.",
    "La conformité — analyse laboratoire systématique (chapitre 5).",
  ];
  for (const b of bullets2) { y = para(doc, `• ${b}`, y, 9.5); y += 1.5; }
  y += 2;
  y = para(doc, "Un produit simplement bon est refusé. Nous cherchons l'excellence, pas la moyenne haute. C'est la raison pour laquelle notre catalogue est volontairement court : chaque référence a gagné sa place.", y);
  y += 4;
  box(y, "POURQUOI ÇA INTÉRESSE LE COMMERÇANT", "Un catalogue court est un catalogue qui tourne. Moins de références, moins de stock dormant, un discours simple à tenir en caisse, et des clients qui reviennent parce qu'ils retrouvent ce qu'ils ont aimé.");

  // ---------- 03 La gamme ----------
  newPage();
  y = chapterHead("03", "La gamme sous toutes ses formes", "Fleurs, résines, trois familles");
  y = para(doc, "Deux formes de produits, trois familles. Le catalogue doit être présenté entièrement : chaque référence peut répondre à une attente différente et ouvrir une opportunité de commande. Le but de la visite est de vendre, pas de laisser une partie de la gamme dans la sacoche.", y);
  y += 4;
  y = table(y, ["Famille", "Ce que c'est", "À qui la proposer"], [
    ["Classique", "Fleurs indoor CBD, profils équilibrés, goûts reconnaissables.", "Cœur de gamme. Point d'entrée idéal pour un buraliste qui débute sur le CBD."],
    ["Force Noire", "Gamme haute intensité, dominante sombre, profils puissants.", "Clientèle avertie qui recherche du caractère et une offre premium."],
    ["Exotique", "Pièces d'exception, variétés et résines rares, rotation limitée.", "Effet nouveauté. Sert à créer l'événement et à faire revenir les curieux."],
  ], [30, 72, 76]);
  y = para(doc, "Fleurs — cœur de l'offre, toutes familles confondues, cultivées en intérieur.", y);
  y += 1.5;
  y = para(doc, "Résines — complément à forte valeur : panier moyen plus élevé, clientèle connaisseuse, excellente rotation quand elles sont mises en avant en caisse.", y);
  y += 4;
  box(y, "MÉTHODE DE PRÉSENTATION", "Déroulez tout le catalogue, référence par référence. Pour chacune : nommez la gamme, présentez rapidement son profil, montrez les formats disponibles et expliquez à quelle clientèle elle peut plaire. Faites ensuite choisir au buraliste les références et les quantités à commander. Chaque produit non présenté est une vente potentielle perdue.");

  // ---------- 04 Culture & packaging ----------
  newPage();
  y = chapterHead("04", "Culture & packaging", "100 % indoor, préconditionné, prêt à vendre");
  const bullets4 = [
    "100 % indoor — culture en intérieur, environnement maîtrisé : lumière, hygrométrie, température. Aucune récolte extérieure dans la gamme.",
    "Packaging premium en aluminium alimentaire — barrière à la lumière et à l'air, qualité contact alimentaire. Le produit arrive au client comme il a quitté le laboratoire.",
    "Humidité maîtrisée par Boveda 62 % — le taux d'humidité reste stable en rayon. Pas de produit qui sèche et qui s'effrite au fond du présentoir.",
    "Préconditionnés 1 g / 2,5 g / 5 g / 10 g — aucune pesée, aucune manipulation, aucun matériel à acheter. Le buraliste reçoit et met en rayon.",
    "Code-barres EAN-13 par référence et par format — intégration directe en caisse, sans saisie manuelle.",
  ];
  for (const b of bullets4) { y = para(doc, `• ${b}`, y, 9.5); y += 2; }
  y += 3;
  y = table(y, ["Format", "Usage en point de vente"], [
    ["1 g", "Achat de découverte, impulsion en caisse."],
    ["2,5 g", "Le format qui tourne le plus vite."],
    ["5 g", "Client régulier, panier moyen confortable."],
    ["10 g", "Client fidèle. Feuilles slim et briquet intégrés (chapitre 7)."],
  ], [35, 143]);
  box(y, "ARGUMENT CLÉ", "« Vous n'avez rien à préparer, rien à peser, rien à investir en matériel. Vous ouvrez le carton, vous scannez, vous vendez. »");

  // ---------- 05 Légalité ----------
  newPage();
  y = chapterHead("05", "Légalité & analyses laboratoire", "GC-MS / GC-FID, molécule par molécule");
  y = para(doc, "C'est le chapitre qui fait signer. Un buraliste ne craint pas le produit : il craint le contrôle. Votre rôle est de lui retirer ce risque de la tête.", y);
  y += 2;
  y = para(doc, "Chaque molécule proposée fait l'objet d'une analyse dédiée, spécialement conçue pour le dépistage des molécules illégales. La méthode employée est la chromatographie en phase gazeuse, couplée à la spectrométrie de masse et à un détecteur à ionisation de flamme (GC-MS / GC-FID).", y);
  y += 4;
  y = table(y, ["Étape", "Ce que ça fait", "Ce que ça garantit"], [
    ["Chromatographie en phase gazeuse (GC)", "Sépare un à un tous les composés présents dans l'échantillon.", "Rien ne se cache derrière un autre composé."],
    ["Spectrométrie de masse (MS)", "Identifie chaque composé par sa signature moléculaire.", "Identification certaine : on sait exactement ce qui est présent."],
    ["Détecteur à ionisation de flamme (FID)", "Quantifie précisément chaque composé identifié.", "Les seuils réglementaires sont mesurés, pas estimés."],
  ], [52, 66, 60]);
  y = para(doc, "Résultat : la conformité n'est pas une déclaration, c'est un document. Chaque référence de la gamme dispose de son analyse, disponible en un clic depuis votre espace commercial, onglet Catalogue. Une variété peut avoir plusieurs rapports selon les lots.", y);
  y += 4;
  box(y, "SUR LE TERRAIN", "Sortez la tablette ou le téléphone et ouvrez l'analyse devant lui. Le geste vaut mieux qu'un discours. S'il le demande, vous pouvez lui transmettre le PDF : c'est fait pour. Ne jamais dire : « c'est sans risque », « il n'y a aucun contrôle possible ». Dire : « chaque référence est analysée en laboratoire par GC-MS et GC-FID, et vous avez le rapport. »");

  // ---------- 06 Mention obligatoire ----------
  newPage();
  y = chapterHead("06", "Mention obligatoire", "Usage de pot-pourri uniquement");
  y = box(y, "À RESPECTER SANS EXCEPTION", "Les molécules sont proposées à usage de pot-pourri uniquement, conformément à la loi française. Cette mention s'applique à l'oral comme à l'écrit, en visite, par téléphone, par mail et par message.");
  y = para(doc, "Cette règle n'est pas une formalité : elle protège le commerçant, elle protège HSB, et elle vous protège. Un commercial qui la respecte est un commercial que l'on garde.", y);
  y += 3;
  y = para(doc, "Trois interdits absolus :", y, 9.5, DARK, "bold");
  y += 2;
  const interdits = [
    "Aucune promesse d'effet. Ni détente, ni sommeil, ni euphorie, ni soulagement.",
    "Aucune allégation de santé ou thérapeutique. Pas de douleur, pas d'anxiété, pas de médicament, pas de « ça soigne ».",
    "Aucune incitation à la consommation. On ne conseille jamais un mode d'usage.",
  ];
  for (const b of interdits) { y = para(doc, `• ${b}`, y, 9.5); y += 1.5; }
  y += 3;
  y = table(y, ["Ne dites pas", "Dites plutôt"], [
    ["« Ça détend », « ça aide à dormir ».", "« Profil terpénique doux, notes florales. »"],
    ["« Tu peux le fumer. »", "« Produit proposé à usage de pot-pourri uniquement. »"],
    ["« C'est bon pour le stress. »", "« Sélection premium, goût et odeur travaillés. »"],
    ["« C'est légal, ne t'inquiète pas. »", "« Chaque lot est analysé, voici le rapport laboratoire. »"],
  ], [89, 89]);
  y = para(doc, "Votre vocabulaire de vente est donc simple et sûr : sélection, goût, odeur, visuel, régularité, packaging, analyses, rotation, marge. Rien d'autre n'est nécessaire pour convaincre.", y);

  // ---------- 07 L'offre revendeur ----------
  newPage();
  y = chapterHead("07", "L'offre revendeur", "Marge ×2 HT, ristournes, cadeaux clients");
  y = para(doc, "Le buraliste ne vous achète pas un produit : il vous achète une rentabilité. Voici les trois piliers de l'offre.", y);
  y += 4;
  y = box(y, "1. MARGE ORGANISÉE À ×2 HT", "Nos tarifs professionnels sont construits pour que le commerçant réalise au minimum un coefficient 2 en HT, en revendant au même prix public que notre site. Il n'a pas à casser les prix, il n'a pas à inventer sa grille : il applique le prix public conseillé et sa marge est là.");
  setFont(doc, 10, "bold", DARK);
  doc.text("2. Ristournes par volume", MARGIN, y);
  y += 5;
  y = para(doc, "Plus la commande est importante, plus le prix au gramme baisse. Les paliers sont automatiques :", y);
  y += 3;
  y = table(y, ["Palier de commande", "Remise", "Argument"], [
    ["Moins de 100 g", "tarif de base", "Le prix pro HT affiché par variété."],
    ["À partir de 100 g", "-5 %", "Le palier d'entrée réaliste pour une première vraie commande."],
    ["À partir de 250 g", "-10 %", "Point de vente qui tourne, réassort régulier."],
    ["À partir de 500 g", "-15 %", "Partenaire installé, plusieurs familles en rayon."],
    ["À partir de 1 kg", "-20 %", "Compte majeur ou regroupement de commandes."],
  ], [45, 30, 103]);
  setFont(doc, 10, "bold", DARK);
  doc.text("3. Feuilles slim et briquet intégrés dès 10 g", MARGIN, y);
  y += 5;
  y = para(doc, "Chaque format 10 g part avec les feuilles slim et le briquet inclus. Ce n'est pas un gadget : c'est un remerciement aux clients qui nous font confiance, et un cadeau que le buraliste offre sans que cela lui coûte un centime de marge. Un argument de fidélisation gratuit pour lui.", y);
  y += 4;
  box(y, "LES CHIFFRES EXACTS", "Les prix professionnels HT, le prix public conseillé et le gain HT par format s'affichent en direct dans votre espace commercial, onglet Catalogue, ainsi que dans la grille tarifaire PDF. Utilisez toujours ces valeurs : ne calculez jamais un prix de tête devant un client.");

  // ---------- 08 Le pitch ----------
  newPage();
  y = chapterHead("08", "Le pitch de vente", "Déroulé d'une visite de 12 minutes");
  y = para(doc, "Un buraliste vous accorde rarement plus de dix à quinze minutes, et il sera interrompu par ses clients. Ce déroulé est fait pour ça : chaque étape se tient debout, en quelques phrases.", y);
  y += 4;
  y = table(y, ["Temps", "Étape", "Ce que vous faites"], [
    ["0:00 — 0:30", "L'accroche", "« Bonjour, je suis [prénom], je représente High Society Botanicals, une marque française de CBD haut de gamme, 100 % indoor et préconditionné. Je passe vous montrer une gamme courte qui tourne et qui vous laisse un coefficient 2. »"],
    ["0:30 — 2:00", "Les questions", "Vendez-vous déjà du CBD ? Depuis quand ? Qu'est-ce qui part le mieux ? Qu'est-ce qui dort en rayon ? Qu'est-ce qui vous freine ? Écoutez : ses réponses vous donnent la famille à présenter."],
    ["2:00 — 5:00", "L'histoire", "Trois phrases, chapitre 1. Ancien fumeur, lassitude du foin, plus de 200 variétés testées pour une dizaine retenues. C'est ce qui vous différencie du représentant d'à côté."],
    ["5:00 — 8:00", "Le produit", "Trois références maximum. Faites sentir. Montrez le packaging aluminium, le Boveda, les formats préconditionnés, le code-barres. Laissez-le manipuler."],
    ["8:00 — 9:30", "La légalité", "Ouvrez une analyse laboratoire devant lui. GC-MS et GC-FID, molécule par molécule. Rappelez la mention pot-pourri. C'est le moment où il se détend."],
    ["9:30 — 11:00", "L'argent", "Grille tarifaire en main : prix HT, prix public conseillé, gain par format. Puis les paliers de remise. Puis les feuilles et le briquet offerts dès 10 g."],
    ["11:00 — 12:00", "La conclusion", "Ne demandez jamais « ça vous intéresse ? ». Proposez : « on démarre avec un assortiment de trois références, je vous fais la commande maintenant et je repasse au réassort ? »"],
  ], [26, 26, 126]);
  box(y, "SI IL NE SIGNE PAS AUJOURD'HUI", "Ne repartez jamais les mains vides : récupérez un mail et un nom, laissez la grille tarifaire, déposez des échantillons si c'est pertinent, fixez une date de relance précise et notez-la immédiatement dans l'onglet Prospects de votre espace. Un prospect sans date de relance est un prospect perdu.");

  // ---------- 09 Objections ----------
  newPage();
  y = chapterHead("09", "Objections & réponses", "Une réponse courte, une preuve");
  y = table(y, ["Objection", "Réponse courte", "Votre preuve"], [
    ["« C'est trop cher. »", "Le prix public est le même que celui des boutiques premium, et votre marge est de ×2 HT. Le vrai coût, c'est un produit pas cher qui dort en rayon.", "Grille tarifaire : gain HT affiché par format."],
    ["« J'ai déjà un fournisseur. »", "Parfait, gardez-le. Prenez trois références chez nous et comparez la rotation sur un mois. C'est votre clientèle qui tranchera.", "Assortiment d'essai, échantillons."],
    ["« Le CBD ne tourne pas chez moi. »", "Souvent parce que la qualité ne fidélise pas. Un client déçu ne revient pas. Une gamme courte et testée fait revenir.", "Chapitre 2 : 200 variétés testées, une dizaine retenues."],
    ["« C'est vraiment légal ? »", "Chaque molécule est analysée en laboratoire par chromatographie gazeuse couplée à la spectrométrie de masse et à un détecteur à ionisation de flamme. Vous avez le rapport.", "Analyse PDF ouverte devant lui."],
    ["« Et si je suis contrôlé ? »", "Vous conservez les rapports d'analyse de vos lots. Le produit est proposé à usage de pot-pourri uniquement, et c'est indiqué comme tel.", "Rapports téléchargeables, mentions produit."],
    ["« Je n'ai pas de place / pas de matériel. »", "Rien à peser, rien à préparer. Sachets préconditionnés 1 / 2,5 / 5 / 10 g avec code-barres. Un petit présentoir suffit.", "Le sachet, dans sa main."],
    ["« Il faut que j'en parle / je réfléchis. »", "Bien sûr. Je vous laisse la grille, je note qu'on se rappelle [date précise]. Vous préférez que je repasse ou que je vous appelle ?", "Relance datée dans l'onglet Prospects."],
    ["« Vous serez encore là dans six mois ? »", "Marque française, laboratoire, site en ligne, factures et analyses par lot. Et vous avez un interlocuteur direct : moi.", "Site, factures pro, espace pro dédié."],
  ], [40, 92, 46]);

  // ---------- 10 Rémunération (conditions actuelles) ----------
  newPage();
  y = chapterHead("10", "Votre rémunération", "10 % fixe, réassorts, prime nouveau client");
  y = para(doc, "Vous êtes rémunéré à la commission sur le chiffre d'affaires HT que vous générez. Le taux est unique et simple :", y);
  y += 4;
  y = table(y, ["Type de vente", "Commission"], [
    ["Toute commande d'un client pro rattaché", "10 % du CA HT"],
    ["Réassort d'un client pro rattaché", "10 % du CA HT"],
    ["Nouveau client pro signé (prime unique)", "50 €"],
  ], [120, 58]);
  y = box(y, "EXEMPLE DE CALCUL — 6 000 € HT DE CA SUR LE MOIS + 1 NOUVEAU CLIENT", "6 000 € × 10 % = 600 € de commission\n+ 50 € de prime de nouveau partenaire\nTotal du mois = 650 €");
  y = para(doc, "Réassorts : les commandes de réassort de vos partenaires sont commissionnées au même taux de 10 %. Un client bien installé continue donc de vous rapporter mois après mois, sans nouvelle prospection.", y);
  y += 2;
  y = para(doc, "Prime de nouveau partenaire : 50 € par nouveau client B2B apporté et signé. Chaque point de vente que vous ouvrez est doublement payé : la prime immédiate, puis la commission sur toutes ses commandes.", y);
  y += 4;
  box(y, "SUIVI EN TEMPS RÉEL", "Votre espace commercial vous montre, mois par mois : le CA HT rattaché, la commission calculée, l'état des versements. Vos prospects et vos relances se gèrent dans le même espace.");

  // ---------- 11 Aide-mémoire ----------
  newPage();
  y = chapterHead("11", "Aide-mémoire", "Avant de partir en tournée");
  setFont(doc, 10, "bold", DARK);
  doc.text("Dans la sacoche", MARGIN, y);
  y += 5;
  const sacoche = [
    "Échantillons des trois références que vous avez choisi de pousser.",
    "La grille tarifaire pro préconditionné, imprimée.",
    "Le catalogue pro, imprimé ou sur tablette.",
    "Tablette ou téléphone connecté à votre espace commercial (analyses laboratoire, prix, codes-barres).",
    "De quoi noter un nom, un mail, un téléphone et une date de relance.",
  ];
  for (const b of sacoche) { y = para(doc, `• ${b}`, y, 9.5); y += 1.5; }
  y += 3;
  setFont(doc, 10, "bold", DARK);
  doc.text("Dans votre espace commercial", MARGIN, y);
  y += 5;
  const espace = [
    "Catalogue — photos, prix pro HT, prix public conseillé, gain par format, codes-barres EAN-13, analyses laboratoire en un clic.",
    "Prospects — fiche par point de vente, statut, notes, date de relance.",
    "Commissions — CA HT du mois, commission, versements.",
    "Facturation — facture envoyée directement sur le compte pro du client, payable par virement avec le numéro de commande en libellé ou par carte bancaire.",
    "Documents — PDF à télécharger et textes de prospection à copier.",
  ];
  for (const b of espace) { y = para(doc, `• ${b}`, y, 9.5); y += 1.5; }
  y += 3;
  y = box(y, "LES CINQ PHRASES À CONNAÎTRE PAR CŒUR", "1. Marque française de CBD haut de gamme, 100 % indoor.\n2. Plus de 200 variétés testées, une dizaine retenues.\n3. Chaque molécule analysée en laboratoire : GC-MS et GC-FID, rapport disponible.\n4. Préconditionné 1 / 2,5 / 5 / 10 g, aluminium alimentaire, Boveda 62 %, code-barres.\n5. Coefficient 2 en HT, ristournes par volume, feuilles et briquet offerts dès 10 g.");
  y = para(doc, "RAPPEL FINAL — Molécules proposées à usage de pot-pourri uniquement, conformément à la loi française. Aucune promesse d'effet, aucune allégation de santé.", y, 9.5, GOLD, "bold");
  y += 4;
  y = para(doc, "Une question, un doute sur une formulation, un prospect difficile : appelez avant d'improviser. Nous préférons dix minutes au téléphone à une phrase mal dite chez un buraliste.", y, 9.5, GRAY, "italic");

  guideFooter();
  return doc;
}

// ============================================================
// Save helpers (navigateur)
// ============================================================
export function downloadProPriceGrid(products: DocProduct[], tiers: PriceTier[]) {
  generateProPriceGrid(products, tiers).save("HSB-Grille-Tarifaire-Pro.pdf");
}

export async function downloadProCatalogue(products: DocProduct[], tiers: PriceTier[]) {
  const doc = await generateProCatalogue(products, tiers);
  doc.save("HSB-Catalogue-Pro.pdf");
}

export function downloadProGuide() {
  generateProGuide().save("HSB-Guide-Commercial.pdf");
}
