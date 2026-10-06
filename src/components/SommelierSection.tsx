import { useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Moon, Sun, Feather, ArrowRight, RotateCcw, TreePine, Cherry, Flower2, ChevronLeft, ShoppingCart } from "lucide-react";
import { recommendationMatrix, type Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { edito, eur, gfmt } from "@/components/minuit/minuitData";
import SommelierCave from "@/components/minuit/areas/sommelier/SommelierCave";
import AromaWheel from "@/components/minuit/areas/sommelier/AromaWheel";
import AromaSeal from "@/components/minuit/areas/sommelier/AromaSeal";
import Decantation from "@/components/minuit/areas/sommelier/Decantation";
import { ACCORDS, CAVE_TRUST, FAMILIES, ROMAN, SERVICES, lotTag, presence, teneur } from "@/components/minuit/areas/sommelier/cave";

// « La cave du Sommelier » (DA Minuit Carat) : roue des arômes, carte des vins, décantation du lot.
// Habillage uniquement : états du questionnaire, algorithme de recommandation et ajout au panier inchangés.
// Textes : caractère et arômes seulement (aucune allégation d'effet).
// Changement de texte volontaire (règle de conformité CBD) : les libellés et descriptions du premier service
// (anciennement des promesses d'effet) et sa question ont été réécrits en « caractères » aromatiques ;
// les identifiants envoyés à recommendationMatrix et les gestionnaires (délai de 300 ms) sont inchangés.

type IntentionId = "detente" | "creativite" | "sommeil" | "energie";
type TasteId = "boise" | "fruite" | "floral";

interface Intention {
  id: IntentionId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface Taste {
  id: TasteId;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const intentions: Intention[] = [
  {
    id: "detente",
    label: "Velours",
    description: "Rondeur et douceur, un bouquet tout en velours.",
    icon: <Feather className="w-5 h-5" />,
  },
  {
    id: "creativite",
    label: "Éclat",
    description: "Vivacité et fraîcheur, un bouquet qui s'ouvre d'emblée.",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "sommeil",
    label: "Minuit",
    description: "Profondeur et densité, un registre sombre et racé.",
    icon: <Moon className="w-5 h-5" />,
  },
  {
    id: "energie",
    label: "Lumière",
    description: "Clarté et netteté, des notes vives et lumineuses.",
    icon: <Sun className="w-5 h-5" />,
  },
];

const tastes: Taste[] = [
  {
    id: "boise",
    label: "Boisé & Terreux",
    description: "Notes de cèdre, sous-bois et mousse.",
    icon: <TreePine className="w-5 h-5" />,
  },
  {
    id: "fruite",
    label: "Fruité & Sucré",
    description: "Arômes de baies, d'agrumes et de fruits mûrs.",
    icon: <Cherry className="w-5 h-5" />,
  },
  {
    id: "floral",
    label: "Floral & Épicé",
    description: "Parfums de lavande, de poivre et d'herbes.",
    icon: <Flower2 className="w-5 h-5" />,
  },
];

const SommelierSection = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedIntention, setSelectedIntention] = useState<Intention | null>(null);
  const [selectedTaste, setSelectedTaste] = useState<Taste | null>(null);
  const { addToCart } = useCart();
  const { all: catalogProducts } = useCatalogProducts();

  const handleIntentionSelect = (intention: Intention) => {
    setSelectedIntention(intention);
    setTimeout(() => setStep(2), 300);
  };

  const handleTasteSelect = (taste: Taste) => {
    setSelectedTaste(taste);
    setTimeout(() => setStep(3), 300);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedTaste(null);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedIntention(null);
    setSelectedTaste(null);
  };

  const getRecommendation = (): Product | null => {
    if (!selectedIntention || !selectedTaste) return null;
    const suggested = recommendationMatrix[selectedIntention.id]?.[selectedTaste.id] || null;
    const available = catalogProducts.filter((p) => !p.isOutOfStock);
    // Une variété désactivée ou en rupture n'est jamais recommandée : on prend
    // la première variété active correspondant à la même intention et au même goût.
    if (suggested && available.some((p) => p.id === suggested.id)) {
      return available.find((p) => p.id === suggested.id) ?? suggested;
    }
    return (
      available.find(
        (p) =>
          p.intentionMatch?.includes(selectedIntention.id) &&
          p.tasteMatch?.includes(selectedTaste.id)
      ) ??
      available.find((p) => p.intentionMatch?.includes(selectedIntention.id)) ??
      available[0] ??
      null
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <SommelierCave>
        <div className="sm-inner">
          {/* Enseigne */}
          <header className="sm-head">
            <p className="sm-kick sm-up">Conseil Personnalisé · Collection N° 26</p>
            <h1 id="sm-title" className="sm-title">
              <span className="sm-title-neon">La cave du</span>{" "}
              <span className="sm-title-foil sm-up sm-d1">Sommelier</span>
            </h1>
            <span className="sm-rule sm-up sm-d2" aria-hidden="true"><i /></span>
            <p className="sm-lead sm-up sm-d3">
              Deux services, comme on lit une carte : votre caractère, puis vos arômes.{" "}
              {/* seconde phrase masquée sur petit téléphone pour que la carte arrive plus haut (CSS) */}
              <span className="sm-lead-more">
                Notre majordome descend à la cave et vous remonte le lot dont le bouquet vous ressemble.
              </span>
            </p>
          </header>

          <div className="sm-stage" data-step={step}>
            {/* Roue des arômes (décor : reflète les réponses déjà choisies) */}
            <div className="sm-wheel-col">
              <AromaWheel
                intention={selectedIntention?.id ?? null}
                taste={selectedTaste?.id ?? null}
                product={step === 3 && selectedIntention && selectedTaste ? getRecommendation() : null}
                caracs={intentions}
              />
              <p className="sm-wheel-cap" aria-hidden="true">
                Roue des arômes ·{" "}
                <b>
                  {selectedTaste
                    ? selectedTaste.label
                    : selectedIntention
                    ? `Caractère ${selectedIntention.label}`
                    : "Boisé · Terreux · Épicé · Fruité"}
                </b>
              </p>
            </div>

            {/* La carte */}
            <div className="sm-carte">
              <span className="sm-corner tl" aria-hidden="true" />
              <span className="sm-corner tr" aria-hidden="true" />
              <span className="sm-corner bl" aria-hidden="true" />
              <span className="sm-corner br" aria-hidden="true" />
              {/* sceau de la carte : la roue en réduction (téléphone et tablette, décor) */}
              <AromaSeal
                intention={selectedIntention?.id ?? null}
                taste={selectedTaste?.id ?? null}
                product={step === 3 && selectedIntention && selectedTaste ? getRecommendation() : null}
                caracs={intentions}
              />

              <div className="sm-carte-head">
                <p className="sm-carte-t">La Carte</p>
                <p className="sm-carte-sub">Service de nuit · Maison d'Abbaretz</p>
                {/* Progress indicator */}
                <ol className="sm-services" aria-label="Étapes du conseil">
                  {[1, 2, 3].map((s) => (
                    <li
                      key={s}
                      className={s === step ? "on" : s < step ? "done" : ""}
                      aria-current={s === step ? "step" : undefined}
                    >
                      <span className="n" aria-hidden="true">{ROMAN[s - 1]}</span>
                      <span className="l">{SERVICES[s - 1]}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1: Intention */}
                {step === 1 && (
                  <motion.div
                    key="intention"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="sm-course"
                  >
                    <p className="sm-course-k">Premier service</p>
                    <h2 className="sm-q">Quel caractère pour ce soir ?</h2>

                    <div className="sm-menu">
                      {intentions.map((intention, index) => (
                        <motion.button
                          key={intention.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          onClick={() => handleIntentionSelect(intention)}
                          className={`sm-dish${selectedIntention?.id === intention.id ? " is-sel" : ""}`}
                        >
                          <span className="sm-dish-no" aria-hidden="true">{ROMAN[index]}</span>
                          <span className="sm-dish-body">
                            <span className="sm-dish-line">
                              <span className="sm-dish-name">{intention.label}</span>
                              <span className="sm-dish-dots" aria-hidden="true" />
                              <span className="sm-dish-acc">{ACCORDS[intention.id]}</span>
                            </span>
                            <span className="sm-dish-desc">{intention.description}</span>
                          </span>
                          <span className="sm-dish-ico" aria-hidden="true">{intention.icon}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Taste */}
                {step === 2 && (
                  <motion.div
                    key="taste"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="sm-course"
                  >
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleBack}
                      className="sm-back"
                    >
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      <span>Retour</span>
                    </motion.button>

                    <p className="sm-course-k">Deuxième service</p>
                    <h2 className="sm-q">Quels arômes préférez-vous ?</h2>
                    {selectedIntention && (
                      <p className="sm-recall">
                        Caractère retenu · <b>{selectedIntention.label}</b>
                      </p>
                    )}

                    <div className="sm-menu">
                      {tastes.map((taste, index) => (
                        <motion.button
                          key={taste.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          onClick={() => handleTasteSelect(taste)}
                          className={`sm-dish${selectedTaste?.id === taste.id ? " is-sel" : ""}`}
                        >
                          <span className="sm-dish-no" aria-hidden="true">{ROMAN[index]}</span>
                          <span className="sm-dish-body">
                            <span className="sm-dish-line">
                              <span className="sm-dish-name">{taste.label}</span>
                              <span className="sm-dish-dots" aria-hidden="true" />
                              <span className="sm-dish-acc">{ACCORDS[taste.id]}</span>
                            </span>
                            <span className="sm-dish-desc">{taste.description}</span>
                          </span>
                          <span className="sm-dish-ico" aria-hidden="true">{taste.icon}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Result */}
                {step === 3 && selectedIntention && selectedTaste && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="sm-result"
                  >
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="sm-seal"
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Notre Recommandation</span>
                    </motion.p>

                    {getRecommendation() && (
                      <div className="sm-res-grid">
                        {/* Décantation puis révélation du lot */}
                        <div className="sm-res-vis">
                          <Decantation key={getRecommendation()!.id} p={getRecommendation()!} />
                        </div>

                        {/* Fiche de dégustation */}
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="sm-fiche"
                        >
                          <p className="sm-fiche-k">{lotTag(getRecommendation()!)}</p>
                          <h2 className="sm-fiche-name">{getRecommendation()!.name}</h2>
                          <p className="sm-accord">
                            Caractère <b>{selectedIntention.label}</b> · <b>{selectedTaste.label}</b>
                          </p>
                          <p className="sm-fiche-notes">{edito(getRecommendation()!).notes}</p>

                          <dl className="sm-nez" aria-label="Profil aromatique">
                            {FAMILIES.map((fam) => {
                              const v = Number(getRecommendation()!.terpenes?.[fam.key]) || 0;
                              return (
                                <div key={fam.key}>
                                  <dt>{fam.label}</dt>
                                  <dd>
                                    <span
                                      className="g"
                                      style={{ "--v": Math.max(0, Math.min(1, v / 100)) } as React.CSSProperties}
                                      aria-hidden="true"
                                    />
                                    <span className="w">{presence(v)}</span>
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>

                          {/* Product details */}
                          <div className="sm-chips">
                            <span>{teneur(getRecommendation()!)}</span>
                            <span className="or">{eur(getRecommendation()!.price)} le gramme</span>
                          </div>

                          <div className="sm-actions">
                            <Link
                              to={`/produit/${getRecommendation()!.id}`}
                              className="btn-luxury sm-btn inline-flex items-center justify-center gap-2"
                            >
                              Découvrir
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={() => addToCart(getRecommendation()!, 2.5)}
                              className="btn-luxury-outline sm-btn inline-flex items-center justify-center gap-2"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Ajouter au panier
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={handleReset}
                              className="sm-reset inline-flex items-center justify-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Recommencer
                            </motion.button>
                          </div>
                          {/* même quantité que l'ajout ci-dessus */}
                          <p className="sm-fine">
                            Ajout au panier : {gfmt(2.5)} · autres grammages sur la fiche du lot.
                            <br />
                            THC &lt; 0,3 % · Analyse laboratoire sur demande · Réservé aux majeurs.
                          </p>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <ul className="sm-trust">
            {CAVE_TRUST.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </SommelierCave>
    </MotionConfig>
  );
};

export default SommelierSection;
