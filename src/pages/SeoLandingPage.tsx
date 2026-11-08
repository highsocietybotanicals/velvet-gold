import { Link, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LANDINGS, LEGAL_NOTE, SEO_PRODUCTS, normalizePath } from "@/seo/seoData";

// Pages de recherche Google (fleurs, résines, villes) : tout le texte vient de src/seo/seoData.ts.
const SeoLandingPage = () => {
  const { pathname } = useLocation();
  const path = normalizePath(pathname);
  const page = LANDINGS.find((l) => l.path === path);
  if (!page) return null;

  const products = page.productIds
    .map((id) => SEO_PRODUCTS.find((p) => p.id === id))
    .filter((p): p is (typeof SEO_PRODUCTS)[number] => Boolean(p));
  const others = LANDINGS.filter((l) => l.path !== page.path);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl text-primary mb-6 text-center">{page.h1}</h1>
          <p className="text-muted-foreground font-body text-base leading-relaxed text-center mb-14">{page.intro}</p>

          <div className="space-y-10 text-muted-foreground font-body text-sm leading-relaxed">
            {page.sections.map((section) => (
              <section key={section.h2}>
                <h2 className="font-display text-xl text-foreground mb-4">{section.h2}</h2>
                {section.list && (
                  <ul className="list-disc list-inside space-y-2 mb-3">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.paragraphs?.map((text) => (
                  <p key={text} className="mt-3">
                    {text}
                  </p>
                ))}
              </section>
            ))}

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">Les variétés</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    to={`/produit/${p.id}`}
                    className="block p-4 rounded-xl border border-border/30 bg-card/50 hover:border-primary/50 transition-colors"
                  >
                    <span className="block text-foreground font-display text-base mb-1">{p.name}</span>
                    <span className="block text-xs">{p.text}</span>
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-center">
                <Link to="/catalogue" className="text-primary underline underline-offset-4">
                  Voir tout le catalogue
                </Link>
              </p>
            </section>

            <section>
              <h2 className="font-display text-xl text-foreground mb-4">Voir aussi</h2>
              <ul className="space-y-2">
                {others.map((l) => (
                  <li key={l.path}>
                    <Link to={l.path} className="text-primary underline underline-offset-4">
                      {l.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-xs text-center pt-6">{LEGAL_NOTE}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SeoLandingPage;
