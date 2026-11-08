import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { INDEXABLE_PATHS, LANDINGS, LEGAL_NOTE, SEO_PRODUCTS, SITE_NAME, seoFor } from "./src/seo/seoData";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const link = (href: string, label: string) => `<a href="${href}" style="color:#C9A24A">${esc(label)}</a>`;

const fallbackLinks = () =>
  LANDINGS.map((l) => `<li>${link(l.path, l.h1)}</li>`).join("") +
  SEO_PRODUCTS.map((p) => `<li>${link(`/produit/${p.id}`, p.name)}</li>`).join("") +
  `<li>${link("/catalogue", "Catalogue")}</li>`;

// Texte lisible sans JavaScript (moteurs de recherche, IA, partage). React le remplace dès qu'il démarre.
function fallbackBody(pagePath: string): string {
  const landing = LANDINGS.find((l) => l.path === pagePath);
  const product = SEO_PRODUCTS.find((p) => `/produit/${p.id}` === pagePath);
  const seo = seoFor(pagePath);

  let main: string;
  if (landing) {
    main =
      `<h1>${esc(landing.h1)}</h1><p>${esc(landing.intro)}</p>` +
      landing.sections
        .map(
          (s) =>
            `<h2>${esc(s.h2)}</h2>` +
            (s.list ? `<ul>${s.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "") +
            (s.paragraphs ?? []).map((t) => `<p>${esc(t)}</p>`).join(""),
        )
        .join("");
  } else if (product) {
    main = `<h1>${esc(product.name)}</h1><p>${esc(product.text)}</p>`;
  } else if (pagePath === "/") {
    main = `<h1>${esc(SITE_NAME)}</h1><p>${esc(seo.description)}</p>`;
  } else {
    main = `<p>${esc(seo.description)}</p>`;
  }

  return (
    `<main style="max-width:44rem;margin:0 auto;padding:6rem 1.5rem;color:#B9AE98;font-family:sans-serif;line-height:1.6">` +
    main +
    `<ul>${fallbackLinks()}</ul><p><small>${esc(LEGAL_NOTE)}</small></p></main>`
  );
}

const setContent = (html: string, pattern: RegExp, value: string) => html.replace(pattern, (_m, before, after) => `${before}${esc(value)}${after}`);

function buildPage(shell: string, pagePath: string): string {
  const seo = seoFor(pagePath);
  let html = shell.replace(/<title>[^<]*<\/title>/, `<title>${esc(seo.title)}</title>`);
  html = setContent(html, /(<meta name="description" content=")[^"]*(")/, seo.description);
  html = setContent(html, /(<meta property="og:title" content=")[^"]*(")/, seo.title);
  html = setContent(html, /(<meta property="og:description" content=")[^"]*(")/, seo.description);
  html = setContent(html, /(<meta property="og:url" content=")[^"]*(")/, seo.canonical ?? "");
  html = setContent(html, /(<meta name="twitter:title" content=")[^"]*(")/, seo.title);
  html = setContent(html, /(<meta name="twitter:description" content=")[^"]*(")/, seo.description);

  const head =
    `<link rel="canonical" href="${seo.canonical}" />` +
    seo.jsonLd
      .map((d) => `<script type="application/ld+json" data-seo-route>${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`)
      .join("");
  html = html.replace("</head>", `${head}</head>`);
  return html.replace(/<!--seo-fallback-->[\s\S]*?<!--\/seo-fallback-->/, () => fallbackBody(pagePath));
}

// Écrit un fichier HTML par page publique (dist/catalogue.html, dist/produit/platinum-og.html…).
// Si l'hébergeur ne les sert pas, il retombe sur index.html : le site marche comme avant.
export function seoPrerender(): Plugin {
  let outDir = "dist";
  return {
    name: "hsb-seo-prerender",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexFile = path.join(outDir, "index.html");
      if (!fs.existsSync(indexFile)) return;
      const shell = fs.readFileSync(indexFile, "utf8");

      for (const pagePath of INDEXABLE_PATHS) {
        if (pagePath === "/") continue;
        const file = path.join(outDir, `${pagePath.slice(1)}.html`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buildPage(shell, pagePath));
      }

      // index.html sert aussi de repli à toutes les autres adresses : le texte de l'accueil s'y retire tout seul.
      const home =
        `<div id="seo-fallback">${fallbackBody("/")}` +
        `<script>if(location.pathname!=="/")document.getElementById("seo-fallback").remove()</script></div>`;
      fs.writeFileSync(indexFile, shell.replace(/<!--seo-fallback-->[\s\S]*?<!--\/seo-fallback-->/, () => home));
    },
  };
}
