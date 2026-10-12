import jsPDF from "jspdf";
import { renderEan13DataUrl } from "./barcode";

// Import label images
import label911og from "@/assets/labels/911-og-label.png";
import labelBlueMango from "@/assets/labels/blue-mango-label.png";
import labelNuage from "@/assets/labels/nuage-label.png";
import labelGolden from "@/assets/labels/golden-label.png";
import labelIceOLator from "@/assets/labels/ice-o-lator-label.png";
import labelAmnesia from "@/assets/labels/amnesia-label.png";
import labelMintKush from "@/assets/labels/mint-kush-label.png";
import labelPlatinumOg from "@/assets/labels/platinum-og-label.png";
import labelMangoXIce from "@/assets/labels/mango-x-ice-label.png";
import labelHaribo from "@/assets/labels/haribo-label.png";
import labelHeisenberg from "@/assets/labels/heisenberg-label.png";
import labelPoussiereDor from "@/assets/labels/poussiere-dor-label.png";
import labelPiatella from "@/assets/labels/piatella-label.png";
import labelBhm from "@/assets/labels/bhm-label.png";
import labelLemonPunchHash from "@/assets/labels/lemon-punch-hash-label.png";

const LABEL_MAP: Record<string, string> = {
  "911-og-indoor": label911og,
  "blue-mango-indoor": labelBlueMango,
  "nuage-de-mousseux": labelNuage,
  "golden-cbn": labelGolden,
  "ice-o-lator": labelIceOLator,
  "amnesia-signature-oniria": labelAmnesia,
  "mint-kush": labelMintKush,
  "platinum-og": labelPlatinumOg,
  "mango-x-ice": labelMangoXIce,
  "haribo": labelHaribo,
  "heisenberg": labelHeisenberg,
  "poussiere-dor": labelPoussiereDor,
  "piatella": labelPiatella,
  "bubble-hash-maturer": labelBhm,
  "lemon-punch-hash": labelLemonPunchHash,
};

export const SUPPORTED_LABEL_IDS = Object.keys(LABEL_MAP);

/** Étiquette intégrée d'origine pour un produit (si elle existe) */
export const builtInLabel = (productId: string): string | undefined => LABEL_MAP[productId];

// ------------------------------------------------------------ poids et quantités

/**
 * Nombre d'étiquettes (= d'unités) d'une ligne de commande.
 * Ligne sans quantité (ou quantité 1) : une seule étiquette.
 */
export function labelCount(quantity?: number | null): number {
  const q = Math.floor(Number(quantity));
  return Number.isFinite(q) && q > 1 ? q : 1;
}

/**
 * Poids UNITAIRE d'une ligne de commande, arrondi à 2 décimales.
 * Quand quantity > 1, le poids enregistré est le total de la ligne
 * (ex. « 2.5 g x5 » : weight = 12,5 → 2,5 g par sachet).
 */
export function unitWeight(weight: number, quantity?: number | null): number {
  const q = labelCount(quantity);
  const raw = q > 1 ? Number(weight) / q : Number(weight);
  return Math.round(raw * 100) / 100;
}

/** Poids affiché sur l'étiquette, à la française : 2.5 → « 2,5 g » */
export const formatGrams = (grams: number): string =>
  `${String(Math.round(grams * 100) / 100).replace(".", ",")} g`;

/**
 * Nombre d'étiquettes produit à imprimer pour une ligne :
 * 0 si la ligne n'a pas de poids ou si le produit n'a aucune étiquette
 * (cadeaux, accessoires, produits sans visuel), sinon une par unité.
 */
export function labelUnitsForLine(
  line: { productId: string; weight: number | null | undefined; quantity?: number | null },
  hasCustomLabel: boolean,
): number {
  const w = Number(line.weight);
  if (!Number.isFinite(w) || w <= 0) return 0;
  if (!hasCustomLabel && !LABEL_MAP[line.productId]) return 0;
  return labelCount(line.quantity);
}

// ------------------------------------------------------------ outils fichiers

/** Convert an image URL (imported asset or signed URL) to a base64 data URL */
async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image d'étiquette inaccessible (${res.status})`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Lecture de l'image impossible"));
    reader.readAsDataURL(blob);
  });
}

/** Télécharge un fichier distant tel quel (étiquette importée au format PDF) */
async function downloadRemoteFile(url: string, fileName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Étiquette PDF inaccessible (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Laisse au navigateur le temps de démarrer le téléchargement
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

/** Nom de fichier sûr : HSB-833204 reste tel quel, le reste devient « - » */
const safeFilePart = (s: string) => s.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

// ------------------------------------------------------------ niveau 1 : document

/** Une page d'étiquette 100 × 150 mm */
export interface LabelPage {
  /** URL de l'image d'étiquette (asset intégré ou URL signée d'une étiquette importée) */
  imageUrl: string;
  /** Poids imprimé sous le visuel, en grammes (poids UNITAIRE) */
  weight: number;
  /** Code-barres EAN-13 correspondant à ce poids (optionnel) */
  ean13?: string | null;
}

const PAGE_W = 100;
const PAGE_H = 150;
const PAGE_FORMAT = [PAGE_W, PAGE_H];

/**
 * Construit UN document PDF avec une page 100 × 150 mm par entrée, dans l'ordre.
 * Les images identiques ne sont chargées et intégrées qu'une fois.
 */
export async function buildLabelDoc(pages: LabelPage[]): Promise<jsPDF> {
  if (pages.length === 0) throw new Error("Aucune étiquette à générer");

  // Chargement des visuels distincts, une seule fois chacun
  const uniqueUrls = [...new Set(pages.map((p) => p.imageUrl))];
  const loaded = await Promise.all(uniqueUrls.map((u) => toBase64(u)));
  const images = new Map<string, { data: string; alias: string }>();
  uniqueUrls.forEach((u, i) => images.set(u, { data: loaded[i], alias: `label-${i}` }));

  const barcodeCache = new Map<string, string>();
  const barcodeFor = (ean13: string): string => {
    let img = barcodeCache.get(ean13);
    if (img === undefined) {
      try {
        img = renderEan13DataUrl(ean13, { moduleWidth: 3, barHeight: 100, showText: true });
      } catch {
        throw new Error(`Code-barres invalide : ${ean13}`);
      }
      barcodeCache.set(ean13, img);
    }
    return img;
  };

  const doc = new jsPDF({ unit: "mm", format: PAGE_FORMAT, orientation: "portrait" });

  pages.forEach((page, index) => {
    if (index > 0) doc.addPage(PAGE_FORMAT, "portrait");

    const image = images.get(page.imageUrl)!;
    const format = image.data.startsWith("data:image/png") ? "PNG" : "JPEG";
    const hasBarcode = !!page.ean13;
    const imgH = hasBarcode ? 118 : 138;

    // Visuel pleine largeur (intégré une seule fois grâce à l'alias ; compression sans perte)
    doc.addImage(image.data, format, 0, 0, PAGE_W, imgH, image.alias, "FAST");

    // Poids unitaire sous le visuel
    doc.setFont("helvetica", "bold");
    doc.setFontSize(hasBarcode ? 22 : 28);
    doc.setTextColor(30, 30, 30);
    doc.text(formatGrams(page.weight), PAGE_W / 2, hasBarcode ? imgH + 8 : 146, { align: "center" });

    if (hasBarcode) {
      const barcodeImg = barcodeFor(page.ean13!);
      if (barcodeImg) {
        doc.addImage(barcodeImg, "PNG", 15, imgH + 11, 70, 19, `ean-${page.ean13}`);
      }
    }
  });

  return doc;
}

// ------------------------------------------------------------ niveau 2 : lignes

/** Une ligne de commande à étiqueter */
export interface LabelLine {
  productId: string;
  productName: string;
  /** Poids de la ligne en grammes (TOTAL de la ligne quand quantity > 1) */
  weight: number;
  /** Nombre d'unités (sachets) : une étiquette par unité ; absent = 1 */
  quantity?: number | null;
  /** Code-barres EAN-13 du poids UNITAIRE (optionnel) */
  ean13?: string | null;
  /** Étiquette importée depuis l'administration (URL signée) */
  customLabelUrl?: string | null;
  /** true si l'étiquette importée est un PDF déjà prêt à imprimer */
  customLabelIsPdf?: boolean;
}

export interface LabelBatchResult {
  /** Pages du PDF principal */
  pages: number;
  /**
   * Étiquettes importées en PDF, téléchargées à part (non fusionnables) :
   * à imprimer `count` fois. `ok = false` si le téléchargement a échoué.
   */
  separatePdfs: { productName: string; weight: number; count: number; ok: boolean }[];
}

/** Au-delà, la génération est refusée (les commandes réelles vont jusqu'à ~50 sachets) */
export const MAX_LABELS_PER_BATCH = 300;

/**
 * Génère les étiquettes de plusieurs lignes : un seul PDF (une page par unité,
 * dans l'ordre des lignes, au poids unitaire) + les étiquettes importées en PDF,
 * téléchargées à part car jsPDF ne sait pas les fusionner.
 */
export async function generateLabelBatch(
  lines: LabelLine[],
  fileName: string,
): Promise<LabelBatchResult> {
  // Garde-fou : une quantité aberrante (ex. 1000 saisi par erreur) ne doit pas
  // construire des centaines de pages en mémoire ni lancer de téléchargement.
  const totalLabels = lines.reduce((sum, line) => sum + labelCount(line.quantity), 0);
  if (totalLabels > MAX_LABELS_PER_BATCH) {
    throw new Error(`Trop d'étiquettes (${totalLabels}) : vérifiez les quantités de la commande.`);
  }

  const pages: LabelPage[] = [];
  const pdfLines: { line: LabelLine; unit: number; count: number }[] = [];

  for (const line of lines) {
    const count = labelCount(line.quantity);
    const unit = unitWeight(line.weight, line.quantity);
    if (!Number.isFinite(unit) || unit <= 0) {
      throw new Error(`Poids manquant pour ${line.productName}`);
    }

    if (line.customLabelUrl && line.customLabelIsPdf) {
      pdfLines.push({ line, unit, count });
      continue;
    }

    const imageUrl = line.customLabelUrl || LABEL_MAP[line.productId];
    if (!imageUrl) throw new Error(`Aucune étiquette pour ${line.productName}`);
    for (let i = 0; i < count; i++) pages.push({ imageUrl, weight: unit, ean13: line.ean13 ?? null });
  }

  if (pages.length > 0) {
    const doc = await buildLabelDoc(pages);
    doc.save(fileName);
  }

  const separatePdfs: LabelBatchResult["separatePdfs"] = [];
  for (const { line, unit, count } of pdfLines) {
    let ok = true;
    try {
      await downloadRemoteFile(
        line.customLabelUrl!,
        `etiquette-${safeFilePart(line.productId)}-${unit}g.pdf`,
      );
    } catch (e) {
      console.error(`Étiquette PDF de ${line.productName} :`, e);
      ok = false;
    }
    separatePdfs.push({ productName: line.productName, weight: unit, count, ok });
  }

  return { pages: pages.length, separatePdfs };
}

/** Nom du PDF groupé d'une commande : etiquettes-HSB-833204.pdf */
export const orderLabelsFileName = (orderNumber: string) =>
  `etiquettes-${safeFilePart(orderNumber) || "commande"}.pdf`;

// ------------------------------------------------------------ cas particulier : 1 ligne

type LabelParams = LabelLine;

/**
 * Étiquettes d'une seule ligne : `quantity` pages au poids unitaire
 * (une page si la ligne n'a pas de quantité). Signature d'origine conservée,
 * `quantity` est optionnel.
 */
export async function generateProductLabel(params: LabelParams): Promise<LabelBatchResult> {
  const count = labelCount(params.quantity);
  const unit = unitWeight(params.weight, params.quantity);
  const fileName = `etiquette-${safeFilePart(params.productId)}-${unit}g${count > 1 ? `-x${count}` : ""}.pdf`;
  return generateLabelBatch([params], fileName);
}
