import jsPDF from "jspdf";
import { PRO_TIERS, TIER_DISCOUNT, proTierLabel } from "./margin";

// A4 portrait: 210 × 297 mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2; // 180mm

interface FormProduct {
  id: string;
  name: string;
  pricePerGram: number; // base tier (≤100g) €/g HT
  isOutOfStock?: boolean;
}

const GOLD = [184, 134, 11] as const;
const DARK = [40, 40, 40] as const;
const GRAY = [120, 120, 120] as const;
const LIGHT_GRAY = [200, 200, 200] as const;

function setFont(doc: jsPDF, size: number, style: "normal" | "bold" | "italic" = "normal", color: readonly [number, number, number] = DARK) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

function drawLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, color: readonly [number, number, number] = LIGHT_GRAY, width = 0.3) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, h, "F");
}

function checkBox(doc: jsPDF, x: number, y: number, size = 3.5) {
  drawLine(doc, x, y, x + size, y, DARK, 0.4);
  drawLine(doc, x + size, y, x + size, y + size, DARK, 0.4);
  drawLine(doc, x + size, y + size, x, y + size, DARK, 0.4);
  drawLine(doc, x, y + size, x, y, DARK, 0.4);
}

function fieldLine(doc: jsPDF, x: number, y: number, w: number, label?: string, labelW?: number) {
  if (label) {
    setFont(doc, 8.5, "normal", GRAY);
    doc.text(label, x, y - 1.5);
    doc.line(x + (labelW ?? 0), y, x + w, y);
  } else {
    doc.line(x, y, x + w, y);
  }
}

// ============================================================
// BON DE COMMANDE PRO
// ============================================================
export function generateProOrderForm(products: FormProduct[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = MARGIN;

  // --- Header ---
  setFont(doc, 16, "bold", GOLD);
  doc.text("HIGH SOCIETY BOTANICALS", MARGIN, y + 5);
  setFont(doc, 7.5, "normal", GRAY);
  doc.text("SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910", MARGIN, y + 10);
  doc.text("highsocietybotanicals.com — contact@highsocietybotanicals.com", MARGIN, y + 13.5);

  // right side: order meta
  setFont(doc, 7.5, "normal", GRAY);
  const rx = PAGE_W - MARGIN - 70;
  doc.text("N° de bon :", rx, y + 5);
  doc.line(rx + 22, y + 5.5, rx + 70, y + 5.5);
  doc.text("Date :", rx, y + 10);
  doc.line(rx + 22, y + 10.5, rx + 50, y + 10.5);
  doc.text("Commercial :", rx, y + 14.5);
  doc.line(rx + 22, y + 15, rx + 70, y + 15);

  drawLine(doc, MARGIN, y + 17, PAGE_W - MARGIN, y + 17, GOLD, 1);
  y += 22;

  // --- Title ---
  setFont(doc, 14, "bold", DARK);
  doc.text("BON DE COMMANDE PRO", PAGE_W / 2, y, { align: "center" });
  y += 7;

  // --- Client block ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("CLIENT", MARGIN, y);
  y += 3;

  const colW = (CONTENT_W - 5) / 2;
  // Row 1
  fieldLine(doc, MARGIN, y + 5, colW, "Raison sociale :", 28);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "Enseigne commerciale :", 34);
  y += 8;
  // Row 2
  fieldLine(doc, MARGIN, y + 5, colW, "SIRET :", 16);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "N° TVA intracom. :", 28);
  y += 8;
  // Row 3
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "Adresse :", 18);
  y += 8;
  // Row 4
  fieldLine(doc, MARGIN, y + 5, 35, "CP :", 8);
  fieldLine(doc, MARGIN + 40, y + 5, 70, "Ville :", 12);
  fieldLine(doc, MARGIN + 115, y + 5, CONTENT_W - 115, "Pays :", 12);
  y += 8;
  // Row 5
  fieldLine(doc, MARGIN, y + 5, colW, "Nom du contact :", 28);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "Téléphone :", 18);
  y += 8;
  // Row 6
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "E-mail :", 14);
  y += 10;

  // --- Delivery ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("LIVRAISON", MARGIN, y);
  setFont(doc, 8, "normal", DARK);
  let lx = MARGIN + 22;
  checkBox(doc, lx, y - 3);
  doc.text("Colissimo domicile", lx + 5, y);
  lx += 42;
  checkBox(doc, lx, y - 3);
  doc.text("Point relais", lx + 5, y);
  lx += 32;
  checkBox(doc, lx, y - 3);
  doc.text("Remise en main propre", lx + 5, y);
  y += 7;

  // --- Payment ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("PAIEMENT", MARGIN, y);
  setFont(doc, 8, "normal", DARK);
  let plx = MARGIN + 22;
  checkBox(doc, plx, y - 3);
  doc.text("En ligne", plx + 5, y);
  plx += 30;
  checkBox(doc, plx, y - 3);
  doc.text("Virement à 30 jours", plx + 5, y);
  y += 9;

  // --- Product table ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("PRODUITS", MARGIN, y);
  y += 3;

  // Column widths
  const cName = 52;
  const cFmt = 16; // ×4 (1g, 2.5g, 5g, 10g)
  const cTotalG = 20;
  const cPriceG = 16;
  const cTotalHT = 20;
  // total: 52 + 16*4 + 20 + 16 + 20 = 172 → fits in 180

  const tableX = MARGIN;
  const tableW = cName + cFmt * 4 + cTotalG + cPriceG + cTotalHT;

  // Header row
  const headerH = 6;
  fillRect(doc, tableX, y, tableW, headerH, GOLD);
  setFont(doc, 7, "bold", [255, 255, 255]);
  doc.setTextColor(255, 255, 255);
  let cx = tableX;
  doc.text("Produit", cx + 2, y + 4); cx += cName;
  doc.text("1g", cx + cFmt / 2, y + 4, { align: "center" }); cx += cFmt;
  doc.text("2,5g", cx + cFmt / 2, y + 4, { align: "center" }); cx += cFmt;
  doc.text("5g", cx + cFmt / 2, y + 4, { align: "center" }); cx += cFmt;
  doc.text("10g", cx + cFmt / 2, y + 4, { align: "center" }); cx += cFmt;
  doc.text("Total g", cx + cTotalG / 2, y + 4, { align: "center" }); cx += cTotalG;
  doc.text("€/g HT", cx + cPriceG / 2, y + 4, { align: "center" }); cx += cPriceG;
  doc.text("Total HT", cx + cTotalHT / 2, y + 4, { align: "center" });
  y += headerH;

  // Product rows
  const rowH = 6.5;
  const activeProducts = products.filter(p => !p.isOutOfStock);
  const outOfStockProducts = products.filter(p => p.isOutOfStock);

  for (const p of [...activeProducts, ...outOfStockProducts]) {
    // Alternating row background
    if (p.isOutOfStock) {
      fillRect(doc, tableX, y, tableW, rowH, [245, 240, 240]);
    }
    drawLine(doc, tableX, y, tableX + tableW, y, LIGHT_GRAY, 0.2);

    cx = tableX;
    setFont(doc, 7.5, p.isOutOfStock ? "italic" : "normal", p.isOutOfStock ? GRAY : DARK);
    const name = p.isOutOfStock ? `${p.name} (rupture)` : p.name;
    doc.text(name.length > 28 ? name.substring(0, 27) + "…" : name, cx + 2, y + 4.5);
    cx += cName;
    // Empty cells for quantities (lines to write on)
    for (let i = 0; i < 4; i++) {
      drawLine(doc, cx, y + rowH, cx + cFmt, y + rowH, LIGHT_GRAY, 0.2);
      cx += cFmt;
    }
    drawLine(doc, cx, y + rowH, cx + cTotalG, y + rowH, LIGHT_GRAY, 0.2);
    cx += cTotalG;
    // Print the base €/g
    setFont(doc, 7.5, "bold", DARK);
    doc.text(p.pricePerGram.toFixed(2).replace(".", ","), cx + cPriceG / 2, y + 4.5, { align: "center" });
    cx += cPriceG;
    drawLine(doc, cx, y + rowH, cx + cTotalHT, y + rowH, LIGHT_GRAY, 0.2);
    cx += cTotalHT;

    y += rowH;
  }

  // 4 blank rows for accessories / custom items
  for (let i = 0; i < 4; i++) {
    drawLine(doc, tableX, y, tableX + tableW, y, LIGHT_GRAY, 0.2);
    cx = tableX + cName;
    for (let j = 0; j < 6; j++) {
      drawLine(doc, cx, y + rowH, cx + (j < 4 ? cFmt : j === 4 ? cTotalG : cTotalHT), y + rowH, LIGHT_GRAY, 0.2);
      cx += j < 4 ? cFmt : j === 4 ? cTotalG : cTotalHT;
    }
    y += rowH;
  }

  // Table bottom border
  drawLine(doc, tableX, y, tableX + tableW, y, DARK, 0.4);
  y += 4;

  // --- Volume discount scale ---
  setFont(doc, 7.5, "bold", GOLD);
  doc.text("DÉGRESSIVITÉ VOLUME (remise sur le poids total de la commande)", MARGIN, y);
  y += 4;
  setFont(doc, 7, "normal", DARK);

  const tierLabels: string[] = [];
  for (let i = 0; i < PRO_TIERS.length; i++) {
    const tierMax = PRO_TIERS[i];
    const discount = TIER_DISCOUNT[tierMax] ?? 0;
    const label = proTierLabel(tierMax);
    tierLabels.push(discount === 0 ? label : `${label} (−${discount}%)`);
  }
  // Print as two lines
  const half = Math.ceil(tierLabels.length / 2);
  doc.text(tierLabels.slice(0, half).join("   |   "), MARGIN, y);
  if (tierLabels.slice(half).length) {
    doc.text(tierLabels.slice(half).join("   |   "), MARGIN, y + 4);
    y += 4;
  }
  setFont(doc, 6.5, "italic", GRAY);
  doc.text("Le €/g HT imprimé ci-dessus est le tarif de base (≤ 100 g). Déduire la remise du palier atteint.", MARGIN, y + 3);
  y += 9;

  // --- Totals ---
  const totalsX = MARGIN + 100;
  const totalsW = CONTENT_W - 100;
  setFont(doc, 8, "bold", GOLD);
  doc.text("TOTAUX", MARGIN, y);
  y += 3;

  const totRowH = 5.5;
  const rows = [
    { label: "Total grammes :", w: 45 },
    { label: "Total HT :", w: 45 },
    { label: "TVA (20 %) :", w: 45 },
    { label: "TOTAL TTC :", w: 45, bold: true, gold: true },
  ];
  for (const r of rows) {
    if (r.gold) {
      fillRect(doc, totalsX, y, totalsW, totRowH, [250, 245, 230]);
    }
    setFont(doc, 8, r.bold ? "bold" : "normal", r.gold ? GOLD : DARK);
    doc.text(r.label, totalsX, y + 3.5);
    doc.line(totalsX + r.w, y + 4, totalsX + totalsW, y + 4);
    y += totRowH;
  }
  y += 2;

  // Franco de port
  setFont(doc, 7, "italic", GRAY);
  doc.text("Franco de port au-delà du seuil HT fixé en administration.", MARGIN, y);
  y += 6;

  // --- Mentions ---
  setFont(doc, 7, "normal", GRAY);
  doc.text("• Cadeaux inclus dès 10 g : briquet BIC + feuilles slim", MARGIN, y);
  doc.text("• Produits CBD < 0,3 % THC — Analyses laboratoire disponibles sur demande", MARGIN, y + 4);
  doc.text("• Commission commercial : 10 % sur toutes ventes + 10 % sur réassorts — Bonus 50 € par nouveau client pro", MARGIN, y + 8);
  y += 13;

  // --- Signatures ---
  drawLine(doc, MARGIN, y, MARGIN + 75, y, DARK, 0.4);
  drawLine(doc, PAGE_W - MARGIN - 75, y, PAGE_W - MARGIN, y, DARK, 0.4);
  setFont(doc, 7, "normal", GRAY);
  doc.text("Le client (cachet et signature)", MARGIN, y + 4);
  doc.text("Le commercial (signature)", PAGE_W - MARGIN - 75, y + 4);

  return doc;
}

// ============================================================
// FICHE NOUVEAU CLIENT PRO
// ============================================================
export function generateProClientForm(): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = MARGIN;

  // --- Header ---
  setFont(doc, 16, "bold", GOLD);
  doc.text("HIGH SOCIETY BOTANICALS", MARGIN, y + 5);
  setFont(doc, 7.5, "normal", GRAY);
  doc.text("SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910", MARGIN, y + 10);
  doc.text("highsocietybotanicals.com — contact@highsocietybotanicals.com", MARGIN, y + 13.5);

  drawLine(doc, MARGIN, y + 17, PAGE_W - MARGIN, y + 17, GOLD, 1);
  y += 22;

  // --- Title ---
  setFont(doc, 14, "bold", DARK);
  doc.text("FICHE NOUVEAU CLIENT PRO", PAGE_W / 2, y, { align: "center" });
  y += 8;

  // --- Type établissement ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("TYPE D'ÉTABLISSEMENT", MARGIN, y);
  y += 4;
  setFont(doc, 8, "normal", DARK);
  let tx = MARGIN;
  checkBox(doc, tx, y - 3);
  doc.text("Buraliste", tx + 5, y);
  tx += 30;
  checkBox(doc, tx, y - 3);
  doc.text("CBD Shop", tx + 5, y);
  tx += 30;
  checkBox(doc, tx, y - 3);
  doc.text("Autre :", tx + 5, y);
  doc.line(tx + 18, y + 0.5, tx + 60, y + 0.5);
  y += 8;

  // --- Entreprise ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("ENTREPRISE", MARGIN, y);
  y += 4;

  const colW = (CONTENT_W - 5) / 2;
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "Raison sociale :", 22);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, colW, "Enseigne commerciale :", 30);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "SIRET :", 16);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "N° TVA intracommunautaire :", 38);
  y += 10;

  // --- Adresse ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("ADRESSE", MARGIN, y);
  y += 4;
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "Adresse :", 14);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "Complément :", 18);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, 35, "CP :", 8);
  fieldLine(doc, MARGIN + 40, y + 5, 70, "Ville :", 12);
  fieldLine(doc, MARGIN + 115, y + 5, CONTENT_W - 115, "Pays :", 12);
  y += 10;

  // --- Contact ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("CONTACT", MARGIN, y);
  y += 4;
  fieldLine(doc, MARGIN, y + 5, colW, "Nom :", 10);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "Prénom :", 14);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, colW, "Fonction :", 16);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "Téléphone :", 18);
  y += 10;

  // E-mail avec cases
  setFont(doc, 8, "bold", GOLD);
  doc.text("E-MAIL (identifiant de connexion — écrire très lisiblement)", MARGIN, y);
  y += 4;
  setFont(doc, 7, "normal", GRAY);
  doc.text("Lettre par lettre, une case par caractère :", MARGIN, y);
  y += 3;
  const boxSize = 5;
  const boxGap = 1;
  const numBoxes = 28;
  const boxesW = numBoxes * (boxSize + boxGap) - boxGap;
  let bx = MARGIN;
  for (let i = 0; i < numBoxes; i++) {
    drawLine(doc, bx, y, bx + boxSize, y, LIGHT_GRAY, 0.3);
    drawLine(doc, bx + boxSize, y, bx + boxSize, y + boxSize, LIGHT_GRAY, 0.3);
    drawLine(doc, bx + boxSize, y + boxSize, bx, y + boxSize, LIGHT_GRAY, 0.3);
    drawLine(doc, bx, y + boxSize, bx, y, LIGHT_GRAY, 0.3);
    bx += boxSize + boxGap;
  }
  // line break if too wide
  y += boxSize + 5;

  // --- Conditions ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("CONDITIONS COMMERCIALES", MARGIN, y);
  y += 4;
  setFont(doc, 7.5, "normal", DARK);
  doc.text("Commission : 10 % sur toutes ventes + 10 % sur réassorts", MARGIN, y);
  doc.text("Bonus nouveau client : 50 €", MARGIN, y + 4);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, colW, "Commercial référent :", 26);
  fieldLine(doc, MARGIN + colW + 5, y + 5, colW, "Date de signature :", 26);
  y += 10;

  // --- Préférences ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("PRÉFÉRENCES", MARGIN, y);
  y += 4;
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "Horaires d'ouverture :", 28);
  y += 8;
  fieldLine(doc, MARGIN, y + 5, CONTENT_W, "Jour de réassort préféré :", 32);
  y += 10;

  // --- Consentement ---
  setFont(doc, 8, "normal", DARK);
  checkBox(doc, MARGIN, y - 3);
  doc.text("Accepte de recevoir ses accès à l'espace Pro par e-mail", MARGIN + 5, y);
  y += 8;

  // --- Signature ---
  drawLine(doc, MARGIN, y, MARGIN + 75, y, DARK, 0.4);
  setFont(doc, 7, "normal", GRAY);
  doc.text("Signature du client", MARGIN, y + 4);
  y += 12;

  // --- Encadré réservé HSB ---
  drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, DARK, 0.6);
  y += 4;
  fillRect(doc, MARGIN, y, CONTENT_W, 20, [245, 245, 248]);
  setFont(doc, 8, "bold", GOLD);
  doc.text("RÉSERVÉ HSB", MARGIN + 3, y + 5);
  setFont(doc, 7.5, "normal", DARK);
  doc.text("Compte créé le :", MARGIN + 3, y + 11);
  doc.line(MARGIN + 30, y + 11.5, MARGIN + 70, y + 11.5);
  doc.text("Validé par :", MARGIN + 80, y + 11);
  doc.line(MARGIN + 105, y + 11.5, MARGIN + 140, y + 11.5);
  doc.text("TVA vérifiée :", MARGIN + 3, y + 17);
  checkBox(doc, MARGIN + 30, y + 13.5);

  return doc;
}

// ============================================================
// Save helpers (browser)
// ============================================================
export function downloadProOrderForm(products: FormProduct[]) {
  const doc = generateProOrderForm(products);
  doc.save("HSB-Bon-Commande-Pro.pdf");
}

export function downloadProClientForm() {
  const doc = generateProClientForm();
  doc.save("HSB-Fiche-Nouveau-Client-Pro.pdf");
}
