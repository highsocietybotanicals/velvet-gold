import jsPDF from "jspdf";
import { PRO_TIERS, TIER_DISCOUNT, proTierLabel } from "./margin";
import { BANK_DETAILS } from "./bankDetails";

// A4 portrait: 210 × 297 mm
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2; // 180mm

export interface FormFormatPrice {
  /** Taille du pochon en grammes (1 / 2,5 / 5 / 10) */
  format: number;
  /** Prix HT fixe du pochon pour cette variété */
  unitHT: number;
}

export interface FormProduct {
  id: string;
  name: string;
  /** Prix HT fixe par format de pochon */
  formats: FormFormatPrice[];
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
  doc.text("Carte bancaire (à privilégier)", plx + 5, y);
  plx += 58;
  checkBox(doc, plx, y - 3);
  doc.text("Virement bancaire", plx + 5, y);
  y += 5;
  setFont(doc, 6.5, "normal", DARK);
  doc.text(`Titulaire : ${BANK_DETAILS.holder}`, MARGIN + 22, y);
  doc.text(`BIC : ${BANK_DETAILS.bic}`, MARGIN + 95, y);
  y += 3.5;
  doc.text(`IBAN : ${BANK_DETAILS.iban}`, MARGIN + 22, y);
  y += 6;

  // --- Product table ---
  setFont(doc, 8, "bold", GOLD);
  doc.text("PRODUITS", MARGIN, y);
  y += 3;

  // Formats de pochon présents dans le tarif (1 g / 2,5 g / 5 g / 10 g)
  const formats = products[0]?.formats.map((f) => f.format) ?? [1, 2.5, 5, 10];
  const fmtLabel = (f: number) => `${String(f).replace(".", ",")} g`;

  // Column widths
  const cName = 46;
  const cFmt = 28; // prix HT imprimé + case quantité
  const cTotalHT = 22;
  const tableX = MARGIN;
  const tableW = cName + cFmt * formats.length + cTotalHT; // 180

  // Header row 1 : formats
  fillRect(doc, tableX, y, tableW, 5.5, GOLD);
  setFont(doc, 7, "bold", [255, 255, 255]);
  doc.setTextColor(255, 255, 255);
  let cx = tableX;
  doc.text("Produit", cx + 2, y + 3.8); cx += cName;
  for (const f of formats) {
    doc.text(`POCHON ${fmtLabel(f)}`, cx + cFmt / 2, y + 3.8, { align: "center" });
    cx += cFmt;
  }
  doc.text("Total HT", cx + cTotalHT / 2, y + 3.8, { align: "center" });
  y += 5.5;

  // Header row 2 : prix / quantité
  fillRect(doc, tableX, y, tableW, 4.5, [250, 245, 230]);
  setFont(doc, 6, "bold", GRAY);
  cx = tableX + cName;
  for (let i = 0; i < formats.length; i++) {
    doc.text("Prix HT", cx + cFmt * 0.27, y + 3.2, { align: "center" });
    doc.text("Nb", cx + cFmt * 0.76, y + 3.2, { align: "center" });
    cx += cFmt;
  }
  y += 4.5;

  // Product rows
  const rowH = 6.4;
  const activeProducts = products.filter((p) => !p.isOutOfStock);
  const outOfStockProducts = products.filter((p) => p.isOutOfStock);

  for (const p of [...activeProducts, ...outOfStockProducts]) {
    if (p.isOutOfStock) fillRect(doc, tableX, y, tableW, rowH, [245, 240, 240]);
    drawLine(doc, tableX, y, tableX + tableW, y, LIGHT_GRAY, 0.2);

    cx = tableX;
    setFont(doc, 7.5, p.isOutOfStock ? "italic" : "normal", p.isOutOfStock ? GRAY : DARK);
    const name = p.isOutOfStock ? `${p.name} (rupture)` : p.name;
    doc.text(name.length > 26 ? name.substring(0, 25) + "…" : name, cx + 2, y + 4.4);
    cx += cName;

    for (const f of formats) {
      const row = p.formats.find((x) => x.format === f);
      // Prix HT fixe du pochon
      setFont(doc, 7.5, "bold", p.isOutOfStock ? GRAY : DARK);
      doc.text(
        row ? `${row.unitHT.toFixed(2).replace(".", ",")} €` : "—",
        cx + cFmt * 0.27,
        y + 4.4,
        { align: "center" }
      );
      // Case quantité à remplir au stylo
      drawLine(doc, cx + cFmt * 0.52, y + 0.5, cx + cFmt * 0.52, y + rowH - 0.5, LIGHT_GRAY, 0.2);
      drawLine(doc, cx + cFmt * 0.55, y + rowH, cx + cFmt, y + rowH, LIGHT_GRAY, 0.3);
      cx += cFmt;
    }
    drawLine(doc, cx, y + rowH, cx + cTotalHT, y + rowH, LIGHT_GRAY, 0.3);
    y += rowH;
  }

  // 2 lignes libres (accessoires, remarque)
  for (let i = 0; i < 2; i++) {
    drawLine(doc, tableX, y, tableX + tableW, y, LIGHT_GRAY, 0.2);
    cx = tableX;
    drawLine(doc, cx, y + rowH, cx + cName, y + rowH, LIGHT_GRAY, 0.3);
    cx += cName;
    for (let j = 0; j < formats.length; j++) {
      drawLine(doc, cx, y + rowH, cx + cFmt, y + rowH, LIGHT_GRAY, 0.3);
      cx += cFmt;
    }
    drawLine(doc, cx, y + rowH, cx + cTotalHT, y + rowH, LIGHT_GRAY, 0.3);
    y += rowH;
  }

  // Table bottom border
  drawLine(doc, tableX, y, tableX + tableW, y, DARK, 0.4);
  y += 4;

  setFont(doc, 6.5, "italic", GRAY);
  doc.text(
    "Prix HT fixes par variété et par format de pochon. Total HT d'une ligne = prix du pochon × nombre de pochons.",
    MARGIN, y
  );
  y += 5;

  // --- Volume discount scale ---
  setFont(doc, 7.5, "bold", GOLD);
  doc.text("REMISE VOLUME (sur le poids total de la commande, tous formats confondus)", MARGIN, y);
  y += 4;
  setFont(doc, 7, "normal", DARK);

  const tierLabels: string[] = [];
  for (let i = 0; i < PRO_TIERS.length; i++) {
    const tierMax = PRO_TIERS[i];
    const discount = TIER_DISCOUNT[tierMax] ?? 0;
    tierLabels.push(proTierLabel(tierMax));
  }
  doc.text(tierLabels.join("  |  "), MARGIN, y);
  y += 4;
  setFont(doc, 6.5, "italic", GRAY);
  doc.text(
    "Additionner les grammes de tous les pochons (ex. 40 x 2,5 g + 10 x 10 g = 200 g, soit remise 5 %), puis appliquer la remise au total HT.",
    MARGIN, y
  );
  y += 6;

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
  y += 9;

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
