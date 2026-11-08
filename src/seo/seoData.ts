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
}

export const SEO_PRODUCTS: SeoProduct[] = [
  {
    id: "platinum-og",
    name: "Platinum OG",
    category: "fleur",
    price: 12,
    title: "Platinum OG : fleur CBD 22 %, pin et citron | HSB",
    description:
      "Platinum OG, fleur de chanvre à 22 % de CBD, génétique californienne. Notes de pin, de citron et de bois précieux. Envoi suivi en France métropolitaine.",
    text: "Fleur de chanvre à 22 % de CBD, issue d'une génétique californienne. Son nez mêle le pin, le citron et le bois précieux, sur un profil boisé et terreux. Analyse de laboratoire disponible sur demande.",
  },
  {
    id: "mint-kush",
    name: "Mint Kush",
    category: "fleur",
    price: 12,
    title: "Mint Kush : fleur CBD 20 %, menthe fraîche | HSB",
    description:
      "Mint Kush, fleur de chanvre à 20 % de CBD, génétique californienne. Notes de menthe fraîche et d'épices douces. Envoi suivi en France métropolitaine.",
    text: "Fleur de chanvre à 20 % de CBD, issue d'une génétique californienne. Menthe fraîche et épices douces au nez, sur un fond boisé. Analyse de laboratoire disponible sur demande.",
  },
  {
    id: "amnesia-signature-oniria",
    name: "Amnesia Signature Oniria",
    category: "fleur",
    price: 12,
    title: "Amnesia Signature Oniria : fleur CBD 27 % | HSB",
    description:
      "Amnesia Signature Oniria, fleur de chanvre à 27 % de CBD signée Oniria. Arômes d'agrumes et de terre. Envoi suivi en France métropolitaine.",
    text: "Fleur d'artiste signée Oniria, à 27 % de CBD. Son profil associe les agrumes et la terre, avec une attaque fruitée bien marquée. Analyse de laboratoire disponible sur demande.",
  },
  {
    id: "ice-o-lator",
    name: "Ice O Lator",
    category: "resine",
    price: 12,
    title: "Ice O Lator : résine CBD 60 %, extraction à l'eau | HSB",
    description:
      "Ice O Lator, résine de chanvre à 60 % de CBD obtenue par extraction à l'eau glacée. Profil fruité et boisé. Envoi suivi en France métropolitaine.",
    text: "Résine de chanvre à 60 % de CBD, obtenue par extraction à l'eau glacée. Profil fruité, avec des notes boisées. Analyse de laboratoire disponible sur demande.",
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

// Livraison nationale : une seule phrase, reprise sur toutes les pages. Si la livraison devient payante, changer ici
// ET la section « Combien coûte la livraison ? » plus bas.
const NATIONAL_SHIPPING =
  "Envoi Colissimo suivi et offert, à domicile ou en point relais, partout en France métropolitaine, expédié sous 48 à 72 heures ouvrées.";
const LOCAL_HANDOVER = "Remise en main propre possible autour d'Abbaretz, en Loire-Atlantique.";

const DELIVERY_THRESHOLDS = [
  "À moins de 10 km d'Abbaretz : dès 2,5 g.",
  "À moins de 20 km : dès 5 g.",
  "À moins de 30 km : dès 10 g.",
];

export const LANDINGS: SeoLanding[] = [
  {
    path: "/livraison-cbd-france",
    title: "Fleurs et résines CBD livrées partout en France | HSB",
    description:
      "Fleurs et résines de chanvre en ligne : envoi Colissimo suivi et offert, à domicile ou en point relais, partout en France métropolitaine, sous 48 à 72 h.",
    h1: "Livraison de CBD partout en France",
    intro:
      "High Society Botanicals expédie ses fleurs et résines de chanvre partout en France métropolitaine, par Colissimo, à domicile ou en point relais. La livraison est offerte, chaque colis part sous 48 à 72 heures ouvrées après le paiement, et vous recevez un numéro de suivi.",
    faq: true,
    sections: [
      {
        h2: "Combien coûte la livraison ?",
        paragraphs: [
          "Rien : la livraison est offerte, à domicile comme en point relais, quel que soit le grammage. Le total affiché dans le panier est le prix que vous payez.",
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
          "Platinum OG, Mint Kush, Amnesia Signature Oniria, Ice O Lator et Golden CBN se commandent de 1 à 100 g : 12 € le gramme, 80,40 € les 10 g, soit 8,04 € le gramme. Par tranche de 10 g commandés, un échantillon de 1 g vous est offert.",
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
          "Chaque variété se choisit de 1 à 100 g, et le prix au gramme baisse avec le format : 12 € le gramme, 80,40 € les 10 g, soit 8,04 € le gramme.",
          "Par tranche de 10 g commandés, un échantillon de 1 g vous est offert.",
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
          "De 1 à 100 g : 12 € le gramme, 80,40 € les 10 g, soit 8,04 € le gramme. Une analyse de laboratoire est disponible sur demande.",
          `${NATIONAL_SHIPPING} ${LOCAL_HANDOVER}`,
        ],
      },
    ],
    productIds: ["ice-o-lator", "golden-cbn"],
  },
  {
    path: "/cbd-abbaretz",
    title: "CBD à Abbaretz et Nozay : remise en main propre | HSB",
    description:
      "Fleurs et résines de chanvre préparées à Abbaretz (44170). Remise en main propre gratuite dès 2,5 g à moins de 10 km, dès 5 g à moins de 20 km. Paiement en ligne ou à la remise.",
    h1: "CBD à Abbaretz et autour de Nozay",
    intro:
      "High Society Botanicals prépare ses commandes à Abbaretz, en Loire-Atlantique. Si vous habitez près d'ici, nous pouvons vous remettre votre commande en main propre, sur rendez-vous et sans frais.",
    sections: [
      {
        h2: "Où, et à partir de quel grammage",
        list: DELIVERY_THRESHOLDS,
        paragraphs: [
          "Nous livrons notamment à Abbaretz, Nozay, Marsac-sur-Don, Saffré, Vay et La Meilleraye-de-Bretagne. Le panier vous propose les zones accessibles selon votre grammage.",
        ],
      },
      {
        h2: "Comment ça se passe",
        list: [
          "Vous choisissez votre variété et votre grammage sur le site.",
          "Vous payez en ligne, ou à la remise.",
          "Nous convenons d'un rendez-vous par téléphone ou par e-mail.",
        ],
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
      "Notre entrepôt est à Abbaretz, au nord de Nantes. Deux façons de recevoir votre commande dans le 44 : en main propre, ou par envoi postal suivi.",
    sections: [
      {
        h2: "Remise en main propre",
        list: DELIVERY_THRESHOLDS,
        paragraphs: [
          "Treillières et La Chapelle-sur-Erdre font partie des communes que nous livrons déjà. Pour Nantes, Saint-Nazaire ou Châteaubriant, tout dépend de la distance de votre adresse : au-delà de 30 km, votre commande part par envoi postal suivi, offert.",
        ],
      },
      {
        h2: "Envoi postal suivi",
        paragraphs: [
          "Partout dans le département et en France métropolitaine, expédié sous 48 à 72 heures ouvrées. La livraison est offerte, et le numéro de suivi vous est envoyé par e-mail.",
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
    description:
      "Toutes les fleurs et résines de chanvre de la maison, du gramme aux grands formats. Envoi Colissimo suivi et offert en France métropolitaine, remise en main propre autour d'Abbaretz (44).",
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
    description:
      "Envoi Colissimo suivi et offert en France métropolitaine, à domicile ou en point relais, expédié sous 48 à 72 h ouvrées. Remise en main propre autour d'Abbaretz (44). Retours sous 14 jours.",
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
}

const productJsonLd = (p: SeoProduct) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: p.name,
  description: p.text,
  category: p.category === "fleur" ? "Fleur de chanvre" : "Résine de chanvre",
  brand: { "@type": "Brand", name: SITE_NAME },
  offers: {
    "@type": "Offer",
    url: `${SITE_URL}/produit/${p.id}`,
    price: p.price,
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: SITE_NAME },
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

const localBusinessJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Store",
  name: `${SITE_NAME} CBD`,
  url: `${SITE_URL}/cbd-abbaretz`,
  address: { "@type": "PostalAddress", addressLocality: "Abbaretz", postalCode: "44170", addressCountry: "FR" },
  areaServed: ["Abbaretz", "Nozay", "Marsac-sur-Don", "Saffré", "Vay", "La Meilleraye-de-Bretagne"],
});

export const normalizePath = (pathname: string) => (pathname === "/" ? "/" : pathname.replace(/\/+$/, ""));

export function seoFor(pathname: string): SeoMeta {
  const path = normalizePath(pathname);
  const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;

  const page = STATIC_PAGES[path];
  if (page) return { ...page, canonical, noindex: false, jsonLd: [] };

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
    };
  }

  const product = SEO_PRODUCTS.find((p) => `/produit/${p.id}` === path);
  if (product) {
    return {
      title: product.title,
      description: product.description,
      canonical,
      noindex: false,
      jsonLd: [productJsonLd(product)],
    };
  }

  return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canonical: null, noindex: true, jsonLd: [] };
}

/** Toutes les adresses à montrer à Google : sitemap et fichiers HTML pré-construits. */
export const INDEXABLE_PATHS: string[] = [
  ...Object.keys(STATIC_PAGES),
  ...LANDINGS.map((l) => l.path),
  ...SEO_PRODUCTS.map((p) => `/produit/${p.id}`),
];
