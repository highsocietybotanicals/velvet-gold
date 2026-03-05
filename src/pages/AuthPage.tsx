import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, User, Building2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type AccountType = "classic" | "pro";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const handleGoogleSignIn = async () => {
  const { error } = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (error) {
    console.error("Google sign-in error:", error);
  }
};

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Registration specific
  const [accountType, setAccountType] = useState<AccountType>("classic");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [vatNumber, setVatNumber] = useState("");

  // Redirect if already logged in
  if (user) {
    navigate("/profil");
    return null;
  }

  const handleSubmit = async (type: "login" | "register") => {
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    if (type === "register" && accountType === "pro") {
      if (!companyName.trim()) {
        setError("Veuillez entrer le nom de votre entreprise");
        setLoading(false);
        return;
      }
      const siretClean = siret.replace(/\s/g, "");
      if (!/^\d{14}$/.test(siretClean)) {
        setError("Le SIRET doit contenir exactement 14 chiffres");
        setLoading(false);
        return;
      }
      // Optional VAT validation (FR + 11 chars or other EU formats)
      if (vatNumber.trim()) {
        const vatClean = vatNumber.replace(/\s/g, "").toUpperCase();
        if (!/^[A-Z]{2}[A-Z0-9]{2,12}$/.test(vatClean)) {
          setError("Format de numéro de TVA invalide (ex: FR12345678901)");
          setLoading(false);
          return;
        }
      }
    }

    if (type === "login") {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error.message);
      } else {
        navigate("/profil");
      }
    } else {
      const proInfo = accountType === "pro" 
        ? { 
            companyName, 
            siret: siret.replace(/\s/g, ""),
            vatNumber: vatNumber.replace(/\s/g, "").toUpperCase() || undefined,
          }
        : undefined;
      
      const result = await signUp(email, password, accountType, proInfo);
      if (result.error) {
        setError(result.error.message);
      } else {
        navigate("/profil");
      }
    }

    setLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setAccountType("classic");
    setCompanyName("");
    setSiret("");
    setVatNumber("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl text-primary mb-2">
                Mon Compte
              </h1>
              <p className="text-muted-foreground">
                Accédez à votre espace personnel
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <Tabs defaultValue="login" className="w-full" onValueChange={() => resetForm()}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                  <TabsTrigger value="register">Inscription</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={() => handleSubmit("login")}
                    disabled={loading}
                    className="w-full btn-luxury"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  {/* Account Type Selector */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Type de compte</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccountType("classic")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          accountType === "classic"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <User className={`w-6 h-6 mx-auto mb-2 ${
                          accountType === "classic" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <p className={`text-sm font-medium ${
                          accountType === "classic" ? "text-primary" : "text-foreground"
                        }`}>
                          Classique
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Particulier
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType("pro")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          accountType === "pro"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <Building2 className={`w-6 h-6 mx-auto mb-2 ${
                          accountType === "pro" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <p className={`text-sm font-medium ${
                          accountType === "pro" ? "text-primary" : "text-foreground"
                        }`}>
                          Professionnel
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Tarifs exclusifs
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères
                    </p>
                  </div>

                  {/* Pro fields */}
                  {accountType === "pro" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-2 border-t border-border"
                    >
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Nom de l'entreprise</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Ma Société SARL"
                            className="pl-10"
                          />
                        </div>
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

                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          N° TVA intracommunautaire <span className="text-xs">(optionnel)</span>
                        </label>
                        <Input
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          placeholder="FR12345678901"
                          maxLength={14}
                        />
                        <p className="text-xs text-muted-foreground">
                          Renseignez votre TVA pour bénéficier de prix HT
                        </p>
                      </div>

                      <p className="text-xs text-primary/80 bg-primary/10 p-3 rounded-lg">
                        Votre demande Pro sera examinée sous 48h. En attendant, vous pourrez utiliser votre compte normalement.
                      </p>
                    </motion.div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={() => handleSubmit("register")}
                    disabled={loading}
                    className="w-full btn-luxury"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : accountType === "pro" ? (
                      "Créer mon compte Pro"
                    ) : (
                      "Créer mon compte"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AuthPage;
