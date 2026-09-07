import jsPDF from "jspdf";

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
};

export const SUPPORTED_LABEL_IDS = Object.keys(LABEL_MAP);

/** Convert an image URL (imported asset) to a base64 data URL */
async function toBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface LabelParams {
  productName: string;
  weight: number; // grams
  productId: string;
  /** Code-barres EAN-13 interne (optionnel) */
  ean13?: string | null;
}

export async function generateProductLabel({
  productName,
  weight,
  productId,
  ean13,
}: LabelParams) {
  const labelUrl = LABEL_MAP[productId];
  if (!labelUrl) throw new Error(`No label image for product: ${productId}`);

  const labelB64 = await toBase64(labelUrl);

  // PDF 100mm x 150mm portrait
  const doc = new jsPDF({ unit: "mm", format: [100, 150], orientation: "portrait" });
  const W = 100;

  const hasBarcode = !!ean13;
  const imgH = hasBarcode ? 118 : 138;

  // Full image covering most of the page
  doc.addImage(labelB64, "JPEG", 0, 0, W, imgH);

  // Weight below the artwork
  const weightText = `${weight}g`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(hasBarcode ? 22 : 28);
  doc.setTextColor(30, 30, 30);
  doc.text(weightText, W / 2, hasBarcode ? imgH + 8 : 146, { align: "center" });

  if (hasBarcode) {
    const barcodeImg = renderEan13DataUrl(ean13!, {
      moduleWidth: 3,
      barHeight: 100,
      showText: true,
    });
    if (barcodeImg) {
      doc.addImage(barcodeImg, "PNG", 15, imgH + 11, 70, 19);
    }
  }

  doc.save(`etiquette-${productId}-${weight}g.pdf`);
}
