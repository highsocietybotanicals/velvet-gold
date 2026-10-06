// Mon profil — « Le carnet du membre » (DA Minuit Carat) : couverture de cuir qui s'ouvre sur la page de garde,
// commandes en tampons d'encre dorée, coordonnées sur papier noir réglé.
// Logique d'origine conservée telle quelle (profil, sauvegarde, demande pro, TVA, commandes, déconnexion).
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { User, Building2, Phone, MapPin, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoyaltyCard from "@/components/LoyaltyCard";
import OrderTracking from "@/components/OrderTracking";
import OrderHistory from "@/components/OrderHistory";
import { useMinuitSkin } from "@/components/minuit/useMinuitSkin";
import { CarnetCover, CarnetReveal, EngravedName, PfEmblem } from "@/components/minuit/areas/profil/Carnet";
import "@/components/minuit/areas/profil/profil.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, isPro, isProValidated, loading, signOut, updateProfile, submitProRequest } = useAuth();
  const { currentOrder, orderHistory, isLoading: ordersLoading } = useOrders();

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [saving, setSaving] = useState(false);

  // Pro form
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [proSubmitting, setProSubmitting] = useState(false);
  const [proError, setProError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddressLine1(profile.address_line1 || "");
      setAddressLine2(profile.address_line2 || "");
      setCity(profile.city || "");
      setPostalCode(profile.postal_code || "");
      setCompanyName(profile.company_name || "");
      setSiret(profile.siret || "");
      setVatNumber(profile.vat_number || "");
    }
  }, [profile]);

  // Habillage « Minuit Carat » de l'espace (classes mn-skin et mn-profil sur <html>)
  useMinuitSkin("profil");

  // Redirect if not logged in
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pf-loading">
        <div className="pf-loading-in">
          <PfEmblem className="pf-loading-emb" />
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="pf-loading-t">Ouverture du carnet</p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      full_name: fullName,
      phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city,
      postal_code: postalCode,
    });
    setSaving(false);
  };

  const handleProSubmit = async () => {
    setProError(null);

    if (!companyName.trim()) {
      setProError("Veuillez entrer le nom de votre entreprise");
      return;
    }

    // Validate SIRET (14 digits)
    const siretClean = siret.replace(/\s/g, "");
    if (!/^\d{14}$/.test(siretClean)) {
      setProError("Le SIRET doit contenir exactement 14 chiffres");
      return;
    }

    setProSubmitting(true);
    const result = await submitProRequest(companyName, siretClean);
    if (result.error) {
      setProError(result.error.message);
    }
    setProSubmitting(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Check if user is classic (not pro or pro not validated)
  const isClassicUser = !isPro || !isProValidated;

  // Affichage seulement : nom gravé sur la page de garde et date d'entrée du compte
  const memberName = profile?.full_name?.trim() || "Membre de la maison";
  const joined = user?.created_at ? new Date(user.created_at) : null;
  const memberSince = joined && !Number.isNaN(joined.getTime()) ? format(joined, "MMMM yyyy", { locale: fr }) : null;

  return (
    <div className="min-h-screen bg-background pf-root">
      <Header />

      {/* data-fx-off : le carnet gère ses propres animations (le kit hsb-fx ne découpe ni n'anime ces titres et sections) */}
      <main className="pf-main" data-fx-off="">
        <CarnetReveal className="pf-carnet">
          {/* ---------- Le carnet : couverture de cuir et page de garde ---------- */}
          <section className="pf-hero" aria-labelledby="pf-title">
            <div className="pf-beam" aria-hidden="true" />
            <div className="pf-stage">
              <div className="pf-book">
                <div className="pf-block">
                  <div className="pf-garde">
                    <PfEmblem className="pf-garde-emb" />
                    <h1 id="pf-title" className="pf-h1">
                      Mon Profil
                    </h1>
                    <EngravedName className="pf-name" text={memberName} />
                    <p className="pf-email">
                      {profile?.email}
                    </p>
                    {memberSince && <p className="pf-since">Membre depuis {memberSince}</p>}
                    <div className="pf-badges">
                      {isPro && isProValidated && (
                        <div className="pf-badge pf-badge-pro">
                          <CheckCircle className="w-4 h-4" aria-hidden="true" />
                          <span>Compte PRO</span>
                        </div>
                      )}
                      {profile?.siret && !isProValidated && (
                        <div className="pf-badge pf-badge-wait">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>Pro en attente</span>
                        </div>
                      )}
                    </div>
                    <p className="pf-garde-foot" aria-hidden="true">Maison de nuit · Collection N° 26</p>
                  </div>
                  <span className="pf-signet" aria-hidden="true" />
                </div>
                <CarnetCover />
              </div>
              <span className="pf-floor" aria-hidden="true" />
            </div>
            <p className="pf-hint" aria-hidden="true"><i />Feuilleter le carnet</p>
          </section>

          {/* Loyalty Card - Only for classic users */}
          {isClassicUser && (
            <LoyaltyCard
              qualifyingOrdersCount={profile?.qualifying_orders_count ?? 0}
              freeGramsAvailable={profile?.free_grams_available ?? 0}
            />
          )}

          {/* Current Order Tracking */}
          {!ordersLoading && currentOrder && (
            <OrderTracking order={currentOrder} />
          )}

          {/* Order History */}
          {!ordersLoading && orderHistory && orderHistory.length > 0 && (
            <div className="pf-slot">
              <OrderHistory orders={orderHistory} />
            </div>
          )}

          {/* Personal Info */}
          <section className="pf-page pf-sheet" data-pf-reveal="" aria-labelledby="pf-perso-t">
            <header className="pf-page-head">
              <p className="pf-kick">
                <User className="w-4 h-4" aria-hidden="true" />
                <span>Coordonnées</span>
              </p>
              <h2 id="pf-perso-t" className="pf-h2">Informations Personnelles</h2>
            </header>

            <div className="pf-grid2">
              <div className="pf-field">
                <label htmlFor="pf-fullname">Nom complet</label>
                <Input
                  id="pf-fullname"
                  className="pf-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="pf-field">
                <label htmlFor="pf-phone">Téléphone</label>
                <div className="relative">
                  <Phone className="pf-in-ico" aria-hidden="true" />
                  <Input
                    id="pf-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="pl-10 pf-input pf-input-ico"
                  />
                </div>
              </div>
            </div>

            <div className="pf-orn" aria-hidden="true"><span>✦</span></div>

            <div className="pf-subhead">
              <MapPin className="w-4 h-4" aria-hidden="true" />
              <h3>Adresse de livraison</h3>
            </div>

            <div className="pf-stack">
              <div className="pf-field">
                <label htmlFor="pf-addr1">Adresse</label>
                <Input
                  id="pf-addr1"
                  className="pf-input"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Rue Example"
                />
              </div>
              <div className="pf-field">
                <label htmlFor="pf-addr2">Complément</label>
                <Input
                  id="pf-addr2"
                  className="pf-input"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Appartement, étage..."
                />
              </div>
              <div className="pf-grid2 pf-grid2-keep">
                <div className="pf-field">
                  <label htmlFor="pf-cp">Code postal</label>
                  <Input
                    id="pf-cp"
                    className="pf-input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75001"
                  />
                </div>
                <div className="pf-field">
                  <label htmlFor="pf-city">Ville</label>
                  <Input
                    id="pf-city"
                    className="pf-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="mt-6 btn-luxury pf-save"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Enregistrer"
              )}
            </Button>
          </section>

          {/* Pro Section */}
          <section className="pf-page pf-sheet pf-pro" data-pf-reveal="" aria-labelledby="pf-pro-t">
            <header className="pf-page-head">
              <p className="pf-kick">
                <Building2 className="w-4 h-4" aria-hidden="true" />
                <span>Registre professionnel</span>
              </p>
              <h2 id="pf-pro-t" className="pf-h2">Espace Professionnel</h2>
            </header>

            {isPro && isProValidated ? (
              <div className="pf-stack">
                <div className="pf-pro-card pf-pro-ok">
                  <span className="pf-wax" aria-hidden="true"><span>Pro</span></span>
                  <div className="pf-pro-txt">
                    <p className="pf-pro-t">
                      <CheckCircle className="w-4 h-4" aria-hidden="true" />
                      Compte Pro validé
                    </p>
                    <p className="pf-pro-s">
                      {profile?.company_name} - SIRET: {profile?.siret}
                    </p>
                    {profile?.vat_number && (
                      <div className="pf-pro-vat">
                        <p className="pf-pro-s">
                          TVA: {profile.vat_number}
                        </p>
                        {profile?.is_vat_validated ? (
                          <span className="pf-chip pf-chip-ok">
                            <CheckCircle className="w-3 h-3" aria-hidden="true" />
                            Validée
                          </span>
                        ) : (
                          <span className="pf-chip pf-chip-wait">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            En attente
                          </span>
                        )}
                      </div>
                    )}
                    <p className="pf-pro-note">
                      {profile?.is_vat_validated
                        ? "✓ Vous bénéficiez de prix HT exclusifs"
                        : profile?.vat_number
                          ? "Votre TVA est en cours de validation par notre équipe"
                          : "Ajoutez votre numéro de TVA pour des prix HT"
                      }
                    </p>
                  </div>
                </div>

                {/* TVA form for Pro users */}
                <div className="pf-field">
                  <label htmlFor="pf-vat">
                    N° TVA intracommunautaire
                  </label>
                  <div className="pf-inline">
                    <Input
                      id="pf-vat"
                      className="pf-input"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="FR12345678901"
                      maxLength={14}
                    />
                    <Button
                      onClick={async () => {
                        const vatClean = vatNumber.replace(/\s/g, "").toUpperCase();
                        if (vatClean && !/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(vatClean)) {
                          setProError("Format de TVA invalide");
                          return;
                        }
                        await updateProfile({ vat_number: vatClean || null });
                        setProError(null);
                      }}
                      variant="outline"
                      size="sm"
                      className="pf-btn-line"
                    >
                      Enregistrer
                    </Button>
                  </div>
                  {proError && (
                    <p className="pf-err" role="alert">{proError}</p>
                  )}
                </div>
              </div>
            ) : profile?.siret ? (
              <div className="pf-pro-card pf-pro-wait">
                <span className="pf-rubber" aria-hidden="true">En attente</span>
                <Clock className="pf-pro-ico" aria-hidden="true" />
                <div className="pf-pro-txt">
                  <p className="pf-pro-t">Demande en cours</p>
                  <p className="pf-pro-s">
                    {profile?.company_name} - SIRET: {profile?.siret}
                  </p>
                  <p className="pf-pro-s pf-pro-delay">
                    Validation sous 48h ouvrées
                  </p>
                </div>
              </div>
            ) : (
              <div className="pf-stack">
                <p className="pf-lede">
                  Vous êtes un professionnel ? Accédez à des tarifs exclusifs en validant votre compte.
                </p>

                <div className="pf-field">
                  <label htmlFor="pf-company">Nom de l'entreprise</label>
                  <Input
                    id="pf-company"
                    className="pf-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ma Société SARL"
                  />
                </div>

                <div className="pf-field">
                  <label htmlFor="pf-siret">SIRET (14 chiffres)</label>
                  <Input
                    id="pf-siret"
                    className="pf-input"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    placeholder="123 456 789 00012"
                    maxLength={17}
                  />
                </div>

                <div className="pf-field">
                  <label htmlFor="pf-vat-req">
                    N° TVA intracommunautaire <span className="pf-opt">(optionnel)</span>
                  </label>
                  <Input
                    id="pf-vat-req"
                    className="pf-input"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="FR12345678901"
                    maxLength={14}
                  />
                  <p className="pf-help">
                    Renseignez votre TVA pour bénéficier de prix HT
                  </p>
                </div>

                {proError && (
                  <div className="pf-err" role="alert">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    {proError}
                  </div>
                )}

                <Button
                  onClick={handleProSubmit}
                  disabled={proSubmitting}
                  className="btn-luxury-outline pf-btn-line pf-btn-wide"
                >
                  {proSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Soumettre ma demande Pro"
                  )}
                </Button>
              </div>
            )}
          </section>

          {/* Sign Out */}
          <div className="pf-colophon" data-pf-reveal="">
            <p className="pf-fin" aria-hidden="true"><span>✦</span> Fin du carnet <span>✦</span></p>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="pf-signout"
            >
              Se déconnecter
            </Button>
            <p className="pf-colo">High Society Botanicals · Maison française · Abbaretz (44)</p>
          </div>
        </CarnetReveal>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
