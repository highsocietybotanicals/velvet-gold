import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  company_name: string | null;
  siret: string | null;
  vat_number: string | null;
  is_pro_validated: boolean;
  is_vat_validated: boolean;
  qualifying_orders_count: number;
  free_grams_available: number;
}

interface ProInfo {
  companyName: string;
  siret: string;
  vatNumber?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isPro: boolean;
  isProValidated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signUp: (
    email: string, 
    password: string, 
    accountType?: 'classic' | 'pro',
    proInfo?: ProInfo
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  submitProRequest: (companyName: string, siret: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isProValidated, setIsProValidated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile({
          ...data,
          qualifying_orders_count: data.qualifying_orders_count ?? 0,
          free_grams_available: data.free_grams_available ?? 0,
          is_vat_validated: data.is_vat_validated ?? false,
        } as Profile);
        setIsProValidated(data.is_pro_validated || false);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching profile:", error);
    }
  };

  const checkProStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("is_pro", { _user_id: userId });
      if (error) throw error;
      setIsPro(data || false);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error checking pro status:", error);
      setIsPro(false);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("has_role", { 
        _user_id: userId, 
        _role: "admin" 
      });
      if (error) throw error;
      setIsAdmin(data || false);
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await Promise.all([
        fetchProfile(user.id), 
        checkProStatus(user.id),
        checkAdminStatus(user.id)
      ]);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkProStatus(session.user.id);
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsPro(false);
          setIsProValidated(false);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // THEN check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkProStatus(session.user.id);
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string, 
    password: string,
    accountType: 'classic' | 'pro' = 'classic',
    proInfo?: ProInfo
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;

      // If Pro account, update profile with company info
      if (accountType === 'pro' && proInfo && data.user) {
        // Wait a bit for the profile to be created by the trigger
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            company_name: proInfo.companyName,
            siret: proInfo.siret,
            vat_number: proInfo.vatNumber || null,
            is_pro_validated: false, // Admin will validate
          })
          .eq("id", data.user.id);

        if (profileError && import.meta.env.DEV) {
          console.error("Error updating pro info:", profileError);
        }
      }

      toast({
        title: accountType === 'pro' ? "Demande Pro envoyée !" : "Compte créé !",
        description: accountType === 'pro' 
          ? "Votre demande sera examinée sous 48h."
          : "Bienvenue chez High Society Botanicals.",
      });
      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) console.error("Signup error:", error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({
        title: "Connexion réussie",
        description: "Content de vous revoir !",
      });
      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) console.error("Signin error:", error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsPro(false);
    setIsProValidated(false);
    setIsAdmin(false);
    toast({
      title: "Déconnexion",
      description: "À bientôt !",
    });
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user?.id) return { error: new Error("Non connecté") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées.",
      });
      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) console.error("Update profile error:", error);
      return { error: error as Error };
    }
  };

  const submitProRequest = async (companyName: string, siret: string) => {
    if (!user?.id) return { error: new Error("Non connecté") };

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyName,
          siret: siret,
          is_pro_validated: false, // Admin will validate
        })
        .eq("id", user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      toast({
        title: "Demande Pro envoyée",
        description: "Nous examinerons votre demande sous 48h.",
      });
      return { error: null };
    } catch (error) {
      if (import.meta.env.DEV) console.error("Pro request error:", error);
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isPro,
        isProValidated,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateProfile,
        submitProRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
