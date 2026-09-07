/**
 * Codes-barres EAN-13 internes (préfixe 200, réservé aux usages internes des commerces).
 *
 * Structure du code : 200 + numéro de variété (6 chiffres) + code format (3 chiffres)
 * + clé de contrôle. Le numéro de variété (`products.barcode_seq`) est fixe : le code
 * d'une variété/poids ne change jamais.
 */

export const INTERNAL_PREFIX = "200";

/** Code format sur 3 chiffres : 1 g -> 001, 2,5 g -> 025, 5 g -> 050, 10 g -> 100 */
export const formatCode = (weightGrams: number): string =>
  String(Math.round(weightGrams * 10)).padStart(3, "0");

export const ean13CheckDigit = (twelve: string): number => {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(twelve[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
};

/** Construit l'EAN-13 complet pour une variété (numéro interne) et un poids */
export const buildEan13 = (barcodeSeq: number, weightGrams: number): string => {
  const body =
    INTERNAL_PREFIX + String(barcodeSeq).padStart(6, "0") + formatCode(weightGrams);
  return body + ean13CheckDigit(body);
};

export const isValidEan13 = (code: string): boolean =>
  /^\d{13}$/.test(code) && ean13CheckDigit(code.slice(0, 12)) === Number(code[12]);

// ---------------------------------------------------------------- rendu image

const L_CODES = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const G_CODES = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
const R_CODES = L_CODES.map((c) =>
  c.split("").map((b) => (b === "0" ? "1" : "0")).join("")
);
const PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL",
];

/** Suite de modules (0/1) d'un EAN-13, 95 modules */
export const ean13Modules = (code: string): string => {
  if (!/^\d{13}$/.test(code)) throw new Error(`EAN-13 invalide : ${code}`);
  const first = Number(code[0]);
  const left = code.slice(1, 7);
  const right = code.slice(7);
  const parity = PARITY[first];

  let out = "101";
  for (let i = 0; i < 6; i++) {
    const d = Number(left[i]);
    out += parity[i] === "L" ? L_CODES[d] : G_CODES[d];
  }
  out += "01010";
  for (let i = 0; i < 6; i++) out += R_CODES[Number(right[i])];
  out += "101";
  return out;
};

interface RenderOptions {
  /** largeur d'un module en px */
  moduleWidth?: number;
  /** hauteur des barres en px */
  barHeight?: number;
  /** affiche le numéro en clair sous le code */
  showText?: boolean;
}

/**
 * Rend un EAN-13 en image PNG (data URL), utilisable dans jsPDF ou une balise <img>.
 */
export const renderEan13DataUrl = (
  code: string,
  { moduleWidth = 2, barHeight = 60, showText = true }: RenderOptions = {}
): string => {
  const modules = ean13Modules(code);
  const quiet = 10 * moduleWidth;
  const textH = showText ? 18 : 0;
  const width = quiet * 2 + modules.length * moduleWidth;
  const height = barHeight + textH + 6;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";

  // Les barres de garde descendent un peu plus bas (norme EAN)
  const guard = new Set<number>();
  [0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94].forEach((i) => guard.add(i));

  for (let i = 0; i < modules.length; i++) {
    if (modules[i] !== "1") continue;
    const h = guard.has(i) ? barHeight + (showText ? 8 : 0) : barHeight;
    ctx.fillRect(quiet + i * moduleWidth, 2, moduleWidth, h);
  }

  if (showText) {
    ctx.font = `${Math.round(textH * 0.85)}px monospace`;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "left";
    // premier chiffre à gauche de la zone de garde
    ctx.fillText(code[0], 2, height - 1);
    ctx.textAlign = "center";
    ctx.fillText(
      code.slice(1, 7),
      quiet + (3 + 21) * moduleWidth,
      height - 1
    );
    ctx.fillText(
      code.slice(7),
      quiet + (50 + 21) * moduleWidth,
      height - 1
    );
  }

  return canvas.toDataURL("image/png");
};
