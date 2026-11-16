// Source unique du référencement : lue par RouteSeo (navigateur) et par seo-prerender.ts (construction du site).
// Aucun import React ni alias "@" ici : la configuration de Vite charge aussi ce fichier.
// Toute adresse absente de ce fichier reçoit un noindex (admin, compte, sommelier, produits non listés…).

export const SITE_URL = "https://highsocietybotanicals.com";
export const SITE_NAME = "High Society Botanicals";
export const LEGAL_NOTE =
  "Produits de collection botanique et pot-pourri, usage strictement ornemental. THC inférieur à 0,3 %. Vente interdite aux mineurs.";

const DEFAULT_TITLE = "High Society Botanicals — Fleurs & Résines CBD Haute Couture";
const DEFAULT_DESCRIPTION =
  "Maison française de fleurs et résines CBD premium, cultivées Indoor pour connaisseurs exigeants. Sélection raffinée, service Sommelier et livraison discrète.";

export interface SeoQuestion {
  q: string;
  a: string;
}

export interface SeoProduct {
  id: string;
  name: string;
  category: "fleur" | "resine";
  /** Prix du gramme : à changer ici si le prix change en base (table products). */
  price: number;
  title: string;
  description: string;
  /** Même texte que products.description en base. */
  text: string;
  /** Questions fréquentes : affichées sur la fiche (ProductPage) et reprises telles quelles dans les données FAQPage. */
  questions: SeoQuestion[];
}

// Livraison nationale : une seule phrase, reprise sur toutes les pages. Montant et seuil des textes : changer ici
// SEULEMENT ces deux valeurs, ET le montant du panier (CartDrawer.tsx) et du serveur (create-viva-payment), qui calculent le port.
export const SHIPPING_FEE_TEXT = "5,90 €";
export const FREE_SHIPPING_FROM_TEXT = "10 g";
const NATIONAL_SHIPPING = `Livraison Colissimo suivie ${SHIPPING_FEE_TEXT}, à domicile ou en point relais, partout en France métropolitaine. Offerte dès ${FREE_SHIPPING_FROM_TEXT} de fleurs et de résines. Expédiée sous 48 à 72 heures ouvrées.`;
const LOCAL_HANDOVER = "Remise en main propre sans frais autour d'Abbaretz, en Loire-Atlantique.";

// Prix des cinq Classiques, pour les questions des fiches : à changer ici si le prix change en base.
const CLASSIC_PRICE_TEXT = "12 € le gramme, 65 € les 10 g, soit 6,50 € le gramme";
const GIFTS_TEXT = "Par tranche de 10 g commandés, des feuilles avec cartons, un briquet et 1 g au choix vous sont offerts.";
const THC_TEXT = "Elle contient moins de 0,3 % de THC, comme l'exige la loi française, et son analyse de laboratoire est disponible sur demande.";

// Deux questions communes à toutes les fiches. « de » : "de la Platinum OG", "de l'Ice O Lator"…
const priceAndDelivery = (de: string): SeoQuestion[] => [
  {
    q: `Quel est le prix ${de} ?`,
    a: `${CLASSIC_PRICE_TEXT}. Elle se commande de 1 à 100 g. ${GIFTS_TEXT}`,
  },
  {
    q: `Comment se passe la livraison ${de} ?`,
    a: `${NATIONAL_SHIPPING} ${LOCAL_HANDOVER}`,
  },
];

export const SEO_PRODUCTS: SeoProduct[] = [
  {
    id: "platinum-og",
    name: "Platinum OG",
    category: "fleur",
    price: 12,
    title: "Platinum OG CBD 22 % : fleur aux notes de pin et citron | HSB",
    description:
      "Platinum OG, fleur de chanvre à 22 % de CBD, génétique californienne. Notes de pin, de citron et de bois précieux. Envoi suivi en France métropolitaine.",
    text: "Fleur de chanvre à 22 % de CBD, issue d'une génétique californienne. Son nez mêle le pin, le citron et le bois précieux, sur un profil boisé et terreux. Analyse de laboratoire disponible sur demande.",
    questions: [
      {
        q: "Quels sont les arômes de la Platinum OG ?",
        a: "Son nez mêle le pin, le citron et le bois précieux, sur un profil boisé et terreux.",
      },
      { q: "Quel est le taux de CBD de la Platinum OG ?", a: `22 % de CBD. ${THC_TEXT}` },
      {
        q: "La Platinum OG est-elle une fleur ou une résine ?",
        a: "C'est une fleur de chanvre, issue d'une génétique californienne.",
      },
      ...priceAndDelivery("de la Platinum OG"),
    ],
  },
  {
    id: "mint-kush",
    name: "Mint Kush",
    category: "fleur",
    price: 12,
    title: "Mint Kush CBD 20 % : fleur aux notes de menthe fraîche | HSB",
    description:
      "Mint Kush, fleur de chanvre à 20 % de CBD, génétique californienne. Notes de menthe fraîche et d'épices douces. Envoi suivi en France métropolitaine.",
    text: "Fleur de chanvre à 20 % de CBD, issue d'une génétique californienne. Menthe fraîche et épices douces au nez, sur un fond boisé. Analyse de laboratoire disponible sur demande.",
    questions: [
      {
        q: "Quels sont les arômes de la Mint Kush ?",
        a: "Menthe fraîche et épices douces au nez, sur un fond boisé.",
      },
      { q: "Quel est le taux de CBD de la Mint Kush ?", a: `20 % de CBD. ${THC_TEXT}` },
      {
        q: "La Mint Kush est-elle une fleur ou une résine ?",
        a: "C'est une fleur de chanvre, issue d'une génétique californienne.",
      },
      ...priceAndDelivery("de la Mint Kush"),
    ],
  },
  {
    id: "amnesia-signature-oniria",
    name: "Amnesia Signature Oniria",
    category: "fleur",
    price: 12,
    title: "Amnesia CBD 27 % : fleur Signature Oniria, agrumes | HSB",
    description:
      "Amnesia Signature Oniria, fleur de chanvre à 27 % de CBD signée Oniria. Arômes d'agrumes et de terre. Envoi suivi en France métropolitaine.",
    text: "Fleur d'artiste signée Oniria, à 27 % de CBD. Son profil associe les agrumes et la terre, avec une attaque fruitée bien marquée. Analyse de laboratoire disponible sur demande.",
    questions: [
      {
        q: "Quels sont les arômes de l'Amnesia Signature Oniria ?",
        a: "Son profil associe les agrumes et la terre, avec une attaque fruitée bien marquée.",
      },
      { q: "Quel est le taux de CBD de l'Amnesia Signature Oniria ?", a: `27 % de CBD. ${THC_TEXT}` },
      {
        q: "Pourquoi « Signature Oniria » ?",
        a: "C'est une fleur d'artiste, signée Oniria.",
      },
      ...priceAndDelivery("de l'Amnesia Signature Oniria"),
    ],
  },
  {
    id: "ice-o-lator",
    name: "Ice O Lator",
    category: "resine",
    price: 12,
    title: "Ice O Lator CBD 60 % : résine extraite à l'eau glacée | HSB",
    description:
      "Ice O Lator, résine de chanvre à 60 % de CBD obtenue par extraction à l'eau glacée. Profil fruité et boisé. Envoi suivi en France métropolitaine.",
    text: "Résine de chanvre à 60 % de CBD, obtenue par extraction à l'eau glacée. Profil fruité, avec des notes boisées. Analyse de laboratoire disponible sur demande.",
    questions: [
      {
        q: "Qu'est-ce que l'Ice O Lator ?",
        a: "Une résine de chanvre obtenue par extraction à l'eau glacée. On écrit aussi iceolator ou ice-o-lator : c'est le même nom.",
      },
      {
        q: "Quels sont les arômes de l'Ice O Lator ?",
        a: "Un profil fruité, avec des notes boisées.",
      },
      { q: "Quel est le taux de CBD de l'Ice O Lator ?", a: `60 % de CBD. ${THC_TEXT}` },
      ...priceAndDelivery("de l'Ice O Lator"),
    ],
  },
  {
    id: "golden-cbn",
    name: "Golden CBN",
    category: "resine",
    price: 12,
    title: "Golden CBN : résine 25 % CBD, 10 % CBN, 10 % CBG | HSB",
    description:
      "Golden CBN, résine de chanvre titrée à 25 % de CBD, 10 % de CBN et 10 % de CBG. Profil épicé et terreux. Envoi suivi en France métropolitaine.",
    text: "Résine de chanvre titrée à 25 % de CBD, 10 % de CBN et 10 % de CBG. Profil épicé et terreux. Analyse de laboratoire disponible sur demande.",
    questions: [
      {
        q: "Que contient la Golden CBN ?",
        a: `25 % de CBD, 10 % de CBN et 10 % de CBG. ${THC_TEXT}`,
      },
      {
        q: "Quels sont les arômes de la Golden CBN ?",
        a: "Un profil épicé et terreux.",
      },
      {
        q: "La Golden CBN est-elle une fleur ou une résine ?",
        a: "C'est une résine de chanvre.",
      },
      ...priceAndDelivery("de la Golden CBN"),
    ],
  },
];

export interface SeoSection {
  h2: string;
  paragraphs?: string[];
  list?: string[];
}

export interface SeoLanding {
  path: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  productIds: string[];
  /** Chaque section est une question : la page reçoit aussi des données FAQPage (même texte que la page). */
  faq?: boolean;
}

const DELIVERY_THRESHOLDS = [
  "À moins de 10 km d'Abbaretz : dès 2,5 g.",
  "À moins de 20 km : dès 5 g.",
  "À moins de 30 km : dès 10 g.",
];

// Communes de la remise en main propre, par la route depuis la mairie d'Abbaretz (mesuré le 14/11/2026,
// geo.api.gouv.fr + OSRM ; détail dans studio\seo\distances-abbaretz.json). Les communes à moins d'un kilomètre
// d'une limite sont rangées dans la zone suivante ou laissées de côté.
const TOWNS_10_KM = ["Abbaretz", "Nozay", "Saffré", "Puceul", "Treffieux"];
const TOWNS_20_KM = [
  "La Meilleraye-de-Bretagne",
  "Issé",
  "Joué-sur-Erdre",
  "Saint-Vincent-des-Landes",
  "Marsac-sur-Don",
  "La Grigonnais",
  "Vay",
  "Nort-sur-Erdre",
  "Lusanger",
  "Trans-sur-Erdre",
  "Moisdon-la-Rivière",
  "Jans",
  "Les Touches",
];
const TOWNS_30_KM = ["Derval", "Riaillé", "Petit-Mars", "Casson", "Blain", "Ligné", "Héric", "Châteaubriant"];

export const LANDINGS: SeoLanding[] = [
  {
    path: "/livraison-cbd-france",
    title: "Fleurs et résines CBD livrées partout en France | HSB",
    description: `Fleurs et résines de chanvre en ligne : livraison Colissimo ${SHIPPING_FEE_TEXT}, offerte dès ${FREE_SHIPPING_FROM_TEXT}, à domicile ou en point relais, partout en France métropolitaine.`,
    h1: "Livraison de CBD partout en France",
    intro: `High Society Botanicals expédie ses fleurs et résines de chanvre partout en France métropolitaine, par Colissimo, à domicile ou en point relais. La livraison coûte ${SHIPPING_FEE_TEXT} et elle est offerte dès ${FREE_SHIPPING_FROM_TEXT}. Chaque colis part sous 48 à 72 heures ouvrées après le paiement, et vous recevez un numéro de suivi.`,
    faq: true,
    sections: [
      {
        h2: "Combien coûte la livraison ?",
        paragraphs: [
          `${SHIPPING_FEE_TEXT} pour une commande de moins de ${FREE_SHIPPING_FROM_TEXT}, à domicile comme en point relais. Dès ${FREE_SHIPPING_FROM_TEXT} de fleurs et de résines, elle est offerte. La remise en main propre autour d'Abbaretz est sans frais. Le total affiché dans le panier comprend la livraison : c'est le prix que vous payez.`,
        ],
      },
      {
        h2: "Quels sont les délais ?",
        paragraphs: [
          "Votre commande est préparée à Abbaretz, en Loire-Atlantique, et expédiée sous 48 à 72 heures ouvrées après le paiement. Elle voyage ensuite avec La Poste, et le numéro de suivi vous est envoyé par e-mail dès l'expédition.",
        ],
      },
      {
        h2: "À domicile ou en point relais ?",
        list: [
          "Colissimo à domicile : à l'adresse de votre choix, en France métropolitaine.",
          "Point relais Colissimo : retrait dans un bureau de tabac, un commerce ou un bureau de poste près de chez vous.",
        ],
      },
      {
        h2: "Le colis est-il discret ?",
        paragraphs: ["Oui, nos colis partent dans un emballage discret."],
      },
      {
        h2: "Quels sont les prix ?",
        paragraphs: [
          "Platinum OG, Mint Kush, Amnesia Signature Oniria, Ice O Lator et Golden CBN se commandent de 1 à 100 g : 12 € le gramme, 65 € les 10 g, soit 6,50 € le gramme. Par tranche de 10 g commandés, des feuilles avec cartons, un briquet et 1 g au choix vous sont offerts.",
        ],
      },
      {
        h2: "Comment payer ?",
        paragraphs: [
          "Par carte bancaire, sur une page de paiement sécurisée (Viva Wallet). Un compte client est demandé pour commander : il sert aussi à suivre vos commandes.",
        ],
      },
      {
        h2: "Les produits sont-ils analysés ?",
        paragraphs: [
          "Oui. Chaque variété contient moins de 0,3 % de THC, comme l'exige la loi française, et son analyse de laboratoire est disponible sur demande.",
        ],
      },
      {
        h2: "Puis-je retourner un produit ?",
        paragraphs: [
          "Oui, sous 14 jours après la réception, dans son emballage d'origine non ouvert. Les frais de retour sont à votre charge, et le remboursement intervient sous 14 jours après la réception du retour. Écrivez-nous à contact@highsocietybotanicals.com.",
        ],
      },
      {
        h2: "Qui peut commander ?",
        paragraphs: ["Uniquement les personnes majeures : la vente est interdite aux mineurs."],
      },
    ],
    productIds: ["platinum-og", "mint-kush", "amnesia-signature-oniria", "ice-o-lator", "golden-cbn"],
  },
  {
    path: "/fleurs-cbd",
    title: "Fleurs de CBD : notre sélection de variétés | HSB",
    description:
      "Platinum OG, Mint Kush, Amnesia Signature Oniria : trois fleurs de chanvre de 20 à 27 % de CBD, choisies pour leurs arômes. Envoi suivi en France métropolitaine.",
    h1: "Fleurs de CBD",
    intro:
      "Trois fleurs de chanvre, trois caractères. La maison les présente comme un caviste présente ses crus : par leur nez, leur génétique et leur taux de CBD.",
    sections: [
      {
        h2: "Trois variétés, trois nez",
        list: [
          "Platinum OG, 22 % de CBD : pin, citron et bois précieux, sur une génétique californienne.",
          "Mint Kush, 20 % de CBD : menthe fraîche et épices douces, sur une génétique californienne.",
          "Amnesia Signature Oniria, 27 % de CBD : agrumes et terre, une fleur d'artiste signée Oniria.",
        ],
      },
      {
        h2: "Du gramme aux grands formats",
        paragraphs: [
          "Chaque variété se choisit de 1 à 100 g, et le prix au gramme baisse avec le format : 12 € le gramme, 65 € les 10 g, soit 6,50 € le gramme.",
          "Par tranche de 10 g commandés, des feuilles avec cartons, un briquet et 1 g au choix vous sont offerts.",
        ],
      },
      {
        h2: "Analyses et livraison",
        paragraphs: [
          "Une analyse de laboratoire est disponible sur demande pour chaque variété.",
          `${NATIONAL_SHIPPING} ${LOCAL_HANDOVER}`,
        ],
      },
    ],
    productIds: ["platinum-og", "mint-kush", "amnesia-signature-oniria"],
  },
  {
    path: "/resine-cbd",
    title: "Résines de CBD : Ice O Lator et Golden CBN | HSB",
    description:
      "Deux résines de chanvre : Ice O Lator à 60 % de CBD, extraite à l'eau glacée, et Golden CBN, à 25 % de CBD, 10 % de CBN et 10 % de CBG. Envoi suivi en France.",
    h1: "Résines de CBD",
    intro:
      "Deux résines de chanvre aux personnalités opposées : l'une se distingue par sa méthode d'extraction, l'autre par sa composition.",
    sections: [
      {
        h2: "Nos deux résines",
        list: [
          "Ice O Lator, 60 % de CBD : extraction à l'eau glacée, profil fruité et boisé.",
          "Golden CBN, 25 % de CBD, 10 % de CBN et 10 % de CBG : profil épicé et terreux.",
        ],
      },
      {
        h2: "Fleur ou résine ?",
        paragraphs: [
          "La fleur se choisit pour sa robe et son bouquet. La résine se choisit pour sa texture et la concentration de ses arômes. Les deux se commandent au gramme.",
        ],
      },
      {
        h2: "Formats, analyses et livraison",
        paragraphs: [
          "De 1 à 100 g : 12 € le gramme, 65 € les 10 g, soit 6,50 € le gramme. Une analyse de laboratoire est disponible sur demande.",
          `${NATIONAL_SHIPPING} ${LOCAL_HANDOVER}`,
        ],
      },
    ],
    productIds: ["ice-o-lator", "golden-cbn"],
  },
  {
    path: "/cbd-abbaretz",
    title: "CBD à Nozay, Abbaretz, Blain, Châteaubriant : main propre | HSB",
    description:
      "Fleurs et résines de chanvre remises en main propre, sans frais et sur rendez-vous, jusqu'à 30 km d'Abbaretz (44) : Nozay, Saffré, Nort-sur-Erdre, Blain, Châteaubriant.",
    h1: "CBD à Abbaretz, Nozay, Blain et Châteaubriant",
    intro:
      "High Society Botanicals prépare ses commandes à Abbaretz, en Loire-Atlantique. Si vous habitez près d'ici, nous pouvons vous remettre votre commande en main propre, sur rendez-vous et sans frais.",
    faq: true,
    sections: [
      {
        h2: "Y a-t-il un magasin de CBD à Abbaretz ou à Nozay ?",
        paragraphs: [
          "High Society Botanicals n'a ni magasin ni distributeur automatique. Vous commandez sur le site, à l'heure qui vous convient, puis nous vous remettons vos fleurs et vos résines de chanvre en main propre, sur rendez-vous.",
        ],
      },
      {
        h2: "Jusqu'où livrez-vous en main propre ?",
        list: DELIVERY_THRESHOLDS,
        paragraphs: [
          `Le panier vous propose les zones accessibles selon votre grammage. Au-delà de 30 km, votre commande part par Colissimo suivi, à ${SHIPPING_FEE_TEXT}, offert dès ${FREE_SHIPPING_FROM_TEXT}.`,
        ],
      },
      {
        h2: "Quelles communes sont concernées ?",
        list: [
          `À moins de 10 km environ : ${TOWNS_10_KM.join(", ")}.`,
          `À moins de 20 km environ : ${TOWNS_20_KM.join(", ")}.`,
          `À moins de 30 km environ : ${TOWNS_30_KM.join(", ")}.`,
        ],
        paragraphs: [
          "Ces distances sont comptées par la route, depuis le centre d'Abbaretz. Tout dépend de votre adresse exacte : c'est vous qui choisissez votre zone dans le panier.",
        ],
      },
      {
        h2: "Comment se passe la remise ?",
        list: [
          "Vous choisissez votre variété et votre grammage sur le site.",
          "Vous payez en ligne, ou à la remise.",
          "Nous convenons d'un rendez-vous par téléphone ou par e-mail.",
        ],
        paragraphs: ["La remise en main propre est sans frais."],
      },
      {
        h2: "Quels sont les prix ?",
        paragraphs: [
          `Platinum OG, Mint Kush, Amnesia Signature Oniria, Ice O Lator et Golden CBN : ${CLASSIC_PRICE_TEXT}. ${GIFTS_TEXT}`,
        ],
      },
      {
        h2: "Et si j'habite plus loin ?",
        paragraphs: [NATIONAL_SHIPPING],
      },
      {
        h2: "Qui peut commander ?",
        paragraphs: ["Uniquement les personnes majeures : la vente est interdite aux mineurs."],
      },
    ],
    productIds: ["platinum-og", "mint-kush", "amnesia-signature-oniria", "ice-o-lator", "golden-cbn"],
  },
  {
    path: "/cbd-loire-atlantique",
    title: "CBD en Loire-Atlantique (44) : livraison et main propre | HSB",
    description:
      "Fleurs et résines de chanvre en Loire-Atlantique : remise en main propre selon la distance et le grammage, ou envoi postal suivi sous 48 à 72 h ouvrées.",
    h1: "CBD en Loire-Atlantique",
    intro:
      "Nos commandes sont préparées à Abbaretz, au nord de Nantes. Deux façons de recevoir la vôtre dans le 44 : en main propre, ou par envoi postal suivi.",
    sections: [
      {
        h2: "Remise en main propre",
        list: DELIVERY_THRESHOLDS,
        paragraphs: [
          `Nozay, Nort-sur-Erdre, Blain, Héric et Châteaubriant sont à moins de 30 km d'Abbaretz par la route. Nantes, Treillières, La Chapelle-sur-Erdre ou Saint-Nazaire sont plus loin : votre commande part alors par Colissimo suivi, à ${SHIPPING_FEE_TEXT}, offert dès ${FREE_SHIPPING_FROM_TEXT}.`,
        ],
      },
      {
        h2: "Envoi postal suivi",
        paragraphs: [
          `Partout dans le département et en France métropolitaine, expédié sous 48 à 72 heures ouvrées. La livraison coûte ${SHIPPING_FEE_TEXT}, elle est offerte dès ${FREE_SHIPPING_FROM_TEXT}, et le numéro de suivi vous est envoyé par e-mail.`,
        ],
      },
    ],
    productIds: ["platinum-og", "mint-kush", "amnesia-signature-oniria", "ice-o-lator", "golden-cbn"],
  },
];

const STATIC_PAGES: Record<string, { title: string; description: string }> = {
  "/": { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  "/catalogue": {
    title: "Catalogue CBD : fleurs et résines premium | HSB",
    description: `Toutes les fleurs et résines de chanvre de la maison, du gramme aux grands formats. Livraison Colissimo ${SHIPPING_FEE_TEXT}, offerte dès ${FREE_SHIPPING_FROM_TEXT}, remise en main propre autour d'Abbaretz (44).`,
  },
  "/societe": {
    title: "La Maison : qui nous sommes | High Society Botanicals",
    description:
      "Maison française de fleurs et résines de chanvre, installée en Loire-Atlantique. Notre sélection, notre savoir-faire et nos engagements.",
  },
  "/contact": {
    title: "Contact | High Society Botanicals",
    description:
      "Une question sur une variété, une commande ou une livraison ? Écrivez à la maison High Society Botanicals.",
  },
  "/livraison-retours": {
    title: "Livraison et retours | High Society Botanicals",
    description: `Livraison Colissimo ${SHIPPING_FEE_TEXT}, offerte dès ${FREE_SHIPPING_FROM_TEXT}, à domicile ou en point relais en France métropolitaine. Remise en main propre sans frais autour d'Abbaretz (44). Retours sous 14 jours.`,
  },
  "/cgv": {
    title: "Conditions générales de vente | High Society Botanicals",
    description: "Conditions générales de vente de la maison High Society Botanicals.",
  },
  "/mentions-legales": {
    title: "Mentions légales | High Society Botanicals",
    description: "Mentions légales et informations sur l'éditeur du site High Society Botanicals.",
  },
  "/confidentialite": {
    title: "Confidentialité | High Society Botanicals",
    description: "Politique de confidentialité et gestion des données personnelles de High Society Botanicals.",
  },
};

export interface SeoMeta {
  title: string;
  description: string;
  canonical: string | null;
  noindex: boolean;
  jsonLd: object[];
  /** Image de l'aperçu quand le lien est partagé (og:image, twitter:image). */
  image: string;
}

// Visuel affiché en tête de fiche : mêmes fichiers que CUT_FILE dans src/components/minuit/minuitData.ts (les deux listes vont ensemble).
const PRODUCT_IMAGE_BASE = "https://pvwwxpcosiqetsflykmp.supabase.co/storage/v1/object/public/social-media/site-minuit/";
const PRODUCT_IMAGE_FILE: Record<string, string> = {
  "platinum-og": "cut-platinum-og.webp",
  "mint-kush": "cut-mint-kush.webp",
  "amnesia-signature-oniria": "cut-amnesia.webp",
  "ice-o-lator": "cut-ice-o-lator.webp",
  "golden-cbn": "cut-golden-cbn.webp",
};

// Aperçu d'un lien partagé (WhatsApp, Instagram, Facebook…). Par défaut : le logo, même adresse que dans index.html.
const DEFAULT_SHARE_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/4yU0VmKMEkROHeN819I6VFRfxVn2/uploads/1769042271271-logo luxe.jpeg";
// Fiches des Classiques : une image 1200 x 630 par fiche, dans public/og (mêmes découpes que PRODUCT_IMAGE_FILE).
const shareImage = (p: SeoProduct) => (PRODUCT_IMAGE_FILE[p.id] ? `${SITE_URL}/og/${p.id}.jpg` : DEFAULT_SHARE_IMAGE);

// Montant du port lu dans le texte affiché ("5,90 €" → 5.9) : une seule valeur à changer.
const SHIPPING_FEE_EUR = Number(SHIPPING_FEE_TEXT.replace(/[^\d,]/g, "").replace(",", "."));

// Livraison de l'offre affichée (1 g, donc sous le seuil du port offert) : mêmes faits que NATIONAL_SHIPPING.
const shippingDetailsJsonLd = () => ({
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: SHIPPING_FEE_EUR, currency: "EUR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "FR" },
  // « Expédiée sous 48 à 72 heures ouvrées ». Le délai du transporteur n'est pas écrit sur le site : il n'est pas déclaré ici.
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 2, maxValue: 3, unitCode: "DAY" },
  },
});

// Retours : mêmes faits que la question « Puis-je retourner un produit ? » (14 jours, frais de retour à la charge du client).
const returnPolicyJsonLd = () => ({
  "@type": "MerchantReturnPolicy",
  applicableCountry: "FR",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
});

const productJsonLd = (p: SeoProduct) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  description: p.text,
  ...(PRODUCT_IMAGE_FILE[p.id] ? { image: PRODUCT_IMAGE_BASE + PRODUCT_IMAGE_FILE[p.id] } : {}),
  category: p.category === "fleur" ? "Fleur de chanvre" : "Résine de chanvre",
  brand: { "@type": "Brand", name: SITE_NAME },
  offers: {
    "@type": "Offer",
    url: `${SITE_URL}/produit/${p.id}`,
    price: p.price,
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: SITE_NAME },
    shippingDetails: shippingDetailsJsonLd(),
    hasMerchantReturnPolicy: returnPolicyJsonLd(),
  },
});

// Questions et réponses : exactement le texte visible de la page (exigence de Google pour les données structurées).
const faqJsonLd = (landing: SeoLanding) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: landing.sections.map((s) => ({
    "@type": "Question",
    name: s.h2,
    acceptedAnswer: { "@type": "Answer", text: [...(s.list ?? []), ...(s.paragraphs ?? [])].join(" ") },
  })),
});

// Questions d'une fiche produit : exactement le texte affiché sur la fiche.
const questionsJsonLd = (questions: SeoQuestion[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: questions.map((x) => ({
    "@type": "Question",
    name: x.q,
    acceptedAnswer: { "@type": "Answer", text: x.a },
  })),
});

// Pas de magasin : une activité locale qui se déplace (LocalBusiness + communes desservies), sans adresse de rue.
const localBusinessJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: `${SITE_NAME} CBD`,
  url: `${SITE_URL}/cbd-abbaretz`,
  address: { "@type": "PostalAddress", addressLocality: "Abbaretz", postalCode: "44170", addressCountry: "FR" },
  areaServed: [...TOWNS_10_KM, ...TOWNS_20_KM, ...TOWNS_30_KM],
});

export const normalizePath = (pathname: string) => (pathname === "/" ? "/" : pathname.replace(/\/+$/, ""));

export function seoFor(pathname: string): SeoMeta {
  const path = normalizePath(pathname);
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;

  const page = STATIC_PAGES[path];
  if (page) return { ...page, canonical, noindex: false, jsonLd: [], image: DEFAULT_SHARE_IMAGE };

  const landing = LANDINGS.find((l) => l.path === path);
  if (landing) {
    return {
      title: landing.title,
      description: landing.description,
      canonical,
      noindex: false,
      jsonLd: [
        ...(landing.path === "/cbd-abbaretz" ? [localBusinessJsonLd()] : []),
        ...(landing.faq ? [faqJsonLd(landing)] : []),
      ],
      image: DEFAULT_SHARE_IMAGE,
    };
  }

  const product = SEO_PRODUCTS.find((p) => `/produit/${p.id}` === path);
  if (product) {
    return {
      title: product.title,
      description: product.description,
      canonical,
      noindex: false,
      jsonLd: [productJsonLd(product), ...(product.questions.length ? [questionsJsonLd(product.questions)] : [])],
      image: shareImage(product),
    };
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonical: null, noindex: true, jsonLd: [], image: DEFAULT_SHARE_IMAGE };
}

/** Toutes les adresses à montrer à Google : sitemap et fichiers HTML pré-construits. */
export const INDEXABLE_PATHS: string[] = [
  ...Object.keys(STATIC_PAGES),
  ...LANDINGS.map((l) => l.path),
  ...SEO_PRODUCTS.map((p) => `/produit/${p.id}`),
];
