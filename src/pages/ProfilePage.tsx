import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Building2, Phone, MapPin, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, isPro, isProValidated, loading, signOut, updateProfile, submitProRequest } = useAuth();

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
    }
  }, [profile]);

  // Redirect if not logged in
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-3xl text-primary mb-2">
                  Mon Profil
                </h1>
                <p className="text-muted-foreground">
                  {profile?.email}
                </p>
              </div>
              {isPro && isProValidated && (
                <div className="flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Compte PRO</span>
                </div>
              )}
            </div>

            {/* Personal Info */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Informations Personnelles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Nom complet</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">Adresse de livraison</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Adresse</label>
                  <Input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="123 Rue Example"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Complément</label>
                  <Input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Appartement, étage..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Code postal</label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="75001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Ville</label>
                    <Input
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
                className="mt-6 btn-luxury"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>

            {/* Pro Section */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="font-display text-lg text-foreground">Espace Professionnel</h2>
              </div>

              {isPro && isProValidated ? (
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-foreground">Compte Pro validé</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.company_name} - SIRET: {profile?.siret}
                    </p>
                    <p className="text-sm text-green-400 mt-1">
                      Vous bénéficiez de tarifs professionnels exclusifs
                    </p>
                  </div>
                </div>
              ) : profile?.siret ? (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="font-medium text-foreground">Demande en cours</p>
                    <p className="text-sm text-muted-foreground">
                      {profile?.company_name} - SIRET: {profile?.siret}
                    </p>
                    <p className="text-sm text-amber-400 mt-1">
                      Validation sous 48h ouvrées
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Vous êtes un professionnel ? Accédez à des tarifs exclusifs en validant votre compte.
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Nom de l'entreprise</label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ma Société SARL"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">SIRET (14 chiffres)</label>
                    <Input
                      value={siret}
                      onChange={(e) => setSiret(e.target.value)}
                      placeholder="123 456 789 00012"
                      maxLength={17}
                    />
                  </div>

                  {proError && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {proError}
                    </div>
                  )}

                  <Button
                    onClick={handleProSubmit}
                    disabled={proSubmitting}
                    className="btn-luxury-outline"
                  >
                    {proSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Soumettre ma demande Pro"
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Sign Out */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive"
              >
                Se déconnecter
              </Button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
