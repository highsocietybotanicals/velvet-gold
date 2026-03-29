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

const LABEL_MAP: Record<string, string> = {
  "911-og-indoor": label911og,
  "blue-mango-indoor": labelBlueMango,
  "nuage-de-mousseux": labelNuage,
  "golden-cbn": labelGolden,
  "ice-o-lator": labelIceOLator,
  "amnesia-signature-oniria": labelAmnesia,
  "mint-kush": labelMintKush,
  "platinum-og": labelPlatinumOg,
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
}

export async function generateProductLabel({ productName, weight, productId }: LabelParams) {
  const labelUrl = LABEL_MAP[productId];
  if (!labelUrl) throw new Error(`No label image for product: ${productId}`);

  const labelB64 = await toBase64(labelUrl);

  // PDF 100mm x 150mm portrait
  const doc = new jsPDF({ unit: "mm", format: [100, 150], orientation: "portrait" });
  const W = 100;

  // Full image covering most of the page
  doc.addImage(labelB64, "JPEG", 0, 0, W, 138);

  // Weight at the bottom
  const weightText = `${weight}g`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(30, 30, 30);
  doc.text(weightText, W / 2, 146, { align: "center" });

  doc.save(`etiquette-${productId}-${weight}g.pdf`);
}
