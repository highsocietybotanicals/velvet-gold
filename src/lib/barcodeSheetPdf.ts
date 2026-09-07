import jsPDF from "jspdf";
import { renderEan13DataUrl } from "./barcode";
import { calculateItemPrice } from "./pricing";
import type { PriceGroup } from "@/data/products";

export interface BarcodeSheetProduct {
  id: string;
  name: string;
  price: number;
  priceGroup: PriceGroup;
}

interface SheetParams {
  products: BarcodeSheetProduct[];
  /** map[productId][poids] = EAN-13 */
  barcodes: Record<string, Record<string, string>>;
  formats: number[];
  fileName?: string;
}

const euro = (n: number) =>
  n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

/**
 * Planche A4 de codes-barres : une vignette par variété × poids
 * (nom, poids, prix public conseillé TTC, code-barres EAN-13).
 */
export const generateBarcodeSheet = ({
  products,
  barcodes,
  formats,
  fileName = "HSB-planche-codes-barres.pdf",
}: SheetParams) => {
  const cells: { name: string; weight: number; ean: string; retail: number }[] = [];
  products.forEach((p) => {
    formats.forEach((f) => {
      const ean = barcodes[p.id]?.[String(f)];
      if (!ean) return;
      cells.push({
        name: p.name,
        weight: f,
        ean,
        retail: calculateItemPrice(p.price, f, p.priceGroup, p.id).finalPrice,
      });
    });
  });

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 10;
  const COLS = 3;
  const CELL_W = (PAGE_W - MARGIN * 2) / COLS;
  const CELL_H = 33;
  const ROWS = Math.floor((PAGE_H - MARGIN - 18) / CELL_H);

  const header = (page: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text("HIGH SOCIETY BOTANICALS — Codes-barres produits", MARGIN, MARGIN + 2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `EAN-13 interne (préfixe 200) · prix public conseillé TTC · page ${page}`,
      MARGIN,
      MARGIN + 6.5
    );
  };

  if (cells.length === 0) {
    header(1);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Aucun code-barres disponible.", MARGIN, MARGIN + 20);
    doc.save(fileName);
    return;
  }

  let page = 1;
  header(page);

  cells.forEach((c, i) => {
    const posInPage = i % (COLS * ROWS);
    if (i > 0 && posInPage === 0) {
      doc.addPage();
      page += 1;
      header(page);
    }
    const col = posInPage % COLS;
    const row = Math.floor(posInPage / COLS);
    const x = MARGIN + col * CELL_W;
    const y = MARGIN + 12 + row * CELL_H;

    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.2);
    doc.rect(x + 1, y, CELL_W - 2, CELL_H - 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(25, 25, 25);
    doc.text(doc.splitTextToSize(c.name, CELL_W - 8)[0], x + 3.5, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(`${c.weight} g · ${euro(c.retail)}`, x + 3.5, y + 8);

    const img = renderEan13DataUrl(c.ean, { moduleWidth: 3, barHeight: 90, showText: true });
    if (img) {
      const imgW = CELL_W - 10;
      doc.addImage(img, "PNG", x + 5, y + 10, imgW, 18);
    }
  });

  doc.save(fileName);
};
