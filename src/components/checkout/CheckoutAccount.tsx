import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, Loader2, MailCheck, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckoutField } from "./CheckoutField";
import {
  authErrorMessage,
  cleanSpaces,
  currentPasswordError,
  emailError,
  fullNameError,
  newPasswordError,
  phoneError,
  tidyPhone,
} from "./checkoutValidation";
import { cartReturnUrl, clearAccountDraft as clearDraft, markCheckoutResume, readAccountDraft as readDraft, saveAccountDraft } from "./checkoutResume";

// Étape « Votre compte » du tiroir du panier : créer un compte (4 champs) ou se connecter,
// sans quitter la page ni perdre le panier.

type Tab = "create" | "login";

interface CheckoutAccountProps {
  /** Appelé après une inscription avec session immédiate ou une connexion réussie. */
  onAuthenticated: (prefill: { fullName?: string; phone?: string }) => void;
  /** Ouvre la page « Mon compte » pour une inscription professionnelle (retour au panier ensuite). */
  onProSignup: () => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const PasswordToggle = ({ shown, onToggle }: { shown: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    aria-pressed={shown}
    className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--mn-or-clair)]"
  >
    {shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
  </button>
);

const FormMessage = ({ tone, children }: { tone: "error" | "info"; children: ReactNode }) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    className={
      tone === "error"
        ? "rounded-[2px] border border-red-400/40 bg-red-400/10 px-3 py-2.5 text-sm text-red-300"
        : "rounded-[2px] border border-[color:var(--mn-ligne)] bg-primary/10 px-3 py-2.5 text-sm text-[color:var(--mn-ivoire)]"
    }
  >
    {children}
  </div>
);

const CheckoutAccount = ({ onAuthenticated, onProSignup }: CheckoutAccountProps) => {
  const { signIn, signUpForCheckout, sendLoginLink } = useAuth();

  const [tab, setTab] = useState<Tab>("create");
  const [draft] = useState(readDraft);
  const [fullName, setFullName] = useState(draft.fullName ?? "");
  const [email, setEmail] = useState(draft.email ?? "");
  const [phone, setPhone] = useState(draft.phone ?? "");
  const [password, setPassword] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState<Record<Tab, boolean>>({ create: false, login: false });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<{ message: string; offerLogin?: boolean } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState<"google" | "apple" | null>(null);

  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    loginEmail: useRef<HTMLInputElement>(null),
    loginPassword: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    saveAccountDraft({ fullName, email, phone });
  }, [fullName, email, phone]);

  const signupErrors = {
    name: fullNameError(fullName),
    email: emailError(email),
    phone: phoneError(phone),
    password: newPasswordError(password),
  };
  const loginErrors = {
    loginEmail: emailError(email),
    loginPassword: forgotMode ? null : currentPasswordError(loginPassword),
  };

  const visible = (key: string, form: Tab) => touched[key] || submitted[form];
  const blur = (key: string) => () => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  const switchTab = (next: Tab) => {
    setTab(next);
    setFormError(null);
    setForgotMode(false);
    setLinkSentTo(null);
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSubmitted((s) => ({ ...s, create: true }));
    setFormError(null);
    const order: (keyof typeof signupErrors)[] = ["name", "email", "phone", "password"];
    const firstInvalid = order.find((k) => !!signupErrors[k]);
    if (firstInvalid) {
      refs[firstInvalid].current?.focus();
      return;
    }

    setBusy(true);
    const cleanName = cleanSpaces(fullName);
    const cleanPhone = tidyPhone(phone);
    const { error, needsEmailConfirmation } = await signUpForCheckout({
      email: email.trim().toLowerCase(),
      password,
      fullName: cleanName,
      phone: cleanPhone,
      redirectTo: cartReturnUrl(),
    });
    setBusy(false);

    if (error) {
      const { kind, message } = authErrorMessage(error);
      setFormError({ message, offerLogin: kind === "exists" });
      return;
    }
    if (needsEmailConfirmation) {
      markCheckoutResume();
      setPendingConfirmation(email.trim());
      return;
    }
    clearDraft();
    onAuthenticated({ fullName: cleanName, phone: cleanPhone });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setSubmitted((s) => ({ ...s, login: true }));
    setFormError(null);

    if (loginErrors.loginEmail) {
      refs.loginEmail.current?.focus();
      return;
    }

    if (forgotMode) {
      setBusy(true);
      markCheckoutResume();
      const { error } = await sendLoginLink(email.trim().toLowerCase(), cartReturnUrl());
      setBusy(false);
      if (error) {
        const { kind, message } = authErrorMessage(error);
        // Adresse inconnue : même réponse qu'en cas de succès (on ne révèle pas qui a un compte).
        if (kind !== "unknown_user") {
          console.error("Envoi du lien de connexion impossible :", error);
          setFormError({ message });
          return;
        }
      }
      setLinkSentTo(email.trim());
      return;
    }

    if (loginErrors.loginPassword) {
      refs.loginPassword.current?.focus();
      return;
    }

    setBusy(true);
    const { error } = await signIn(email.trim().toLowerCase(), loginPassword);
    setBusy(false);
    if (error) {
      setFormError({ message: authErrorMessage(error).message });
      return;
    }
    clearDraft();
    onAuthenticated({});
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    if (oauthBusy) return;
    setFormError(null);
    setOauthBusy(provider);
    markCheckoutResume();
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: cartReturnUrl() });
      if (result && "redirected" in result && result.redirected) return; // la page part vers Google / Apple
      if (result?.error) throw result.error;
      clearDraft();
      onAuthenticated({});
    } catch (err) {
      console.error(`Connexion ${provider} impossible :`, err);
      setFormError({
        message: `La connexion avec ${provider === "google" ? "Google" : "Apple"} n'a pas abouti. Réessayez, ou utilisez votre e-mail.`,
      });
    } finally {
      setOauthBusy(null);
    }
  };

  // ---------- e-mail de confirmation en attente ----------
  if (pendingConfirmation) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-[2px] border border-[color:var(--mn-ligne)] bg-primary/10 p-4" role="status">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="space-y-2 text-sm text-[color:var(--mn-ivoire)]">
            <p className="font-medium">Plus qu'une étape : confirmez votre adresse e-mail.</p>
            <p className="text-[color:var(--mn-ivoire-2)]">
              Nous venons d'envoyer un lien à <strong className="break-all text-[color:var(--mn-ivoire)]">{pendingConfirmation}</strong>.
              Ouvrez-le sur cet appareil : vous reviendrez directement ici, votre panier est conservé.
            </p>
            <p className="text-xs text-muted-foreground">Rien reçu d'ici quelques minutes ? Regardez dans les courriers indésirables.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setPendingConfirmation(null);
            switchTab("login");
          }}
          className="btn-luxury-outline w-full border py-3 text-xs"
        >
          J'ai confirmé, me connecter
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-[color:var(--mn-ivoire-2)]">
          <ShieldCheck className="mr-1.5 inline h-4 w-4 -translate-y-px text-primary" aria-hidden="true" />
          Un compte en 30&nbsp;secondes : suivi de votre commande, adresses enregistrées et carte fidélité (10&nbsp;g offerts au bout de 10&nbsp;commandes).
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => switchTab(v as Tab)} className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-[2px] border border-[color:var(--mn-ligne)] bg-black/30 p-1">
          <TabsTrigger
            value="create"
            className="h-full rounded-[2px] text-xs tracking-wide data-[state=active]:bg-primary/15 data-[state=active]:text-[color:var(--mn-or-clair)] data-[state=active]:shadow-none"
          >
            Créer mon compte
          </TabsTrigger>
          <TabsTrigger
            value="login"
            className="h-full rounded-[2px] text-xs tracking-wide data-[state=active]:bg-primary/15 data-[state=active]:text-[color:var(--mn-or-clair)] data-[state=active]:shadow-none"
          >
            J'ai déjà un compte
          </TabsTrigger>
        </TabsList>

        {/* ---------- créer un compte ---------- */}
        <TabsContent value="create" className="mt-5">
          <form onSubmit={handleSignup} noValidate className="space-y-4" aria-label="Créer mon compte">
            <CheckoutField
              ref={refs.name}
              id="ca-name"
              label="Prénom et nom"
              autoComplete="name"
              autoCapitalize="words"
              value={fullName}
              maxLength={200}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={blur("name")}
              error={visible("name", "create") ? signupErrors.name : null}
            />
            <CheckoutField
              ref={refs.email}
              id="ca-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={blur("email")}
              error={visible("email", "create") ? signupErrors.email : null}
            />
            <CheckoutField
              ref={refs.phone}
              id="ca-phone"
              label="Téléphone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              maxLength={20}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={blur("phone")}
              error={visible("phone", "create") ? signupErrors.phone : null}
              hint="Pour vous prévenir de la livraison."
            />
            <CheckoutField
              ref={refs.password}
              id="ca-password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              maxLength={72}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={blur("password")}
              error={visible("password", "create") ? signupErrors.password : null}
              hint="6 caractères au minimum."
              trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
            />

            {formError && (
              <FormMessage tone="error">
                <p>{formError.message}</p>
                {formError.offerLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      switchTab("login");
                      setTimeout(() => refs.loginPassword.current?.focus(), 50);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--mn-or-clair)] underline underline-offset-4"
                  >
                    Me connecter avec cette adresse <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </FormMessage>
            )}

            <button type="submit" disabled={busy} className="btn-luxury flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {busy ? "Création du compte…" : "Créer mon compte et continuer"}
            </button>
          </form>
        </TabsContent>

        {/* ---------- se connecter ---------- */}
        <TabsContent value="login" className="mt-5">
          <form onSubmit={handleLogin} noValidate className="space-y-4" aria-label={forgotMode ? "Recevoir un lien de connexion" : "Me connecter"}>
            {forgotMode && !linkSentTo && (
              <p className="text-sm text-[color:var(--mn-ivoire-2)]">
                Indiquez votre e-mail : nous vous envoyons un lien de connexion. Un clic, et vous retrouvez votre panier.
              </p>
            )}
            <CheckoutField
              ref={refs.loginEmail}
              id="cl-email"
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={blur("loginEmail")}
              error={visible("loginEmail", "login") ? loginErrors.loginEmail : null}
            />
            {!forgotMode && (
              <CheckoutField
                ref={refs.loginPassword}
                id="cl-password"
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={loginPassword}
                maxLength={72}
                onChange={(e) => setLoginPassword(e.target.value)}
                onBlur={blur("loginPassword")}
                error={visible("loginPassword", "login") ? loginErrors.loginPassword : null}
                trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
              />
            )}

            {formError && <FormMessage tone="error">{formError.message}</FormMessage>}
            {linkSentTo && (
              <FormMessage tone="info">
                Si un compte existe pour <strong className="break-all">{linkSentTo}</strong>, un lien de connexion vient de partir.
                Ouvrez-le sur cet appareil pour retrouver votre panier (pensez aux courriers indésirables).
              </FormMessage>
            )}

            {!linkSentTo && (
              <button type="submit" disabled={busy} className="btn-luxury flex w-full items-center justify-center gap-2 py-4 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {forgotMode ? (busy ? "Envoi…" : "Recevoir le lien") : busy ? "Connexion…" : "Me connecter et continuer"}
              </button>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotMode((f) => !f);
                  setLinkSentTo(null);
                  setFormError(null);
                }}
                className="min-h-[44px] px-2 text-xs text-[color:var(--mn-or-clair)] underline underline-offset-4 hover:text-primary"
              >
                {forgotMode ? "Revenir au mot de passe" : "Mot de passe oublié ?"}
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>

      {/* ---------- connexion express ---------- */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-[color:var(--mn-ligne)]" />
          </div>
          <p className="relative flex justify-center text-[11px] uppercase tracking-[.18em]">
            <span className="bg-card px-3 text-muted-foreground">ou en un clic</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!oauthBusy}
            className="flex h-11 items-center justify-center gap-2 rounded-[2px] border border-[color:var(--mn-ligne)] text-sm text-foreground transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            {oauthBusy === "google" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("apple")}
            disabled={!!oauthBusy}
            className="flex h-11 items-center justify-center gap-2 rounded-[2px] border border-[color:var(--mn-ligne)] text-sm text-foreground transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            {oauthBusy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <AppleIcon />}
            Apple
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onProSignup}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 text-xs text-muted-foreground transition-colors hover:text-[color:var(--mn-or-clair)]"
      >
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
        Professionnel ? Créez votre compte pro
      </button>
    </div>
  );
};

export default CheckoutAccount;
