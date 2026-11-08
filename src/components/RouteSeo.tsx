import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { seoFor } from "@/seo/seoData";

const setMeta = (attr: "name" | "property", key: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
};

// Titre, description, adresse officielle, noindex et données structurées de la page affichée.
const RouteSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const seo = seoFor(pathname);

    document.title = seo.title;
    setMeta("name", "description", seo.description);
    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.description);
    if (seo.canonical) setMeta("property", "og:url", seo.canonical);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (seo.canonical) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = seo.canonical;
    } else {
      canonical?.remove();
    }

    const robots = document.head.querySelector('meta[name="robots"]');
    if (seo.noindex) setMeta("name", "robots", "noindex,follow");
    else robots?.remove();

    document.head.querySelectorAll("script[data-seo-route]").forEach((s) => s.remove());
    for (const data of seo.jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoRoute = "";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }, [pathname]);

  return null;
};

export default RouteSeo;
