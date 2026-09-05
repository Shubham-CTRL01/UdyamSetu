import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null); // "government" | "startup"
  const [loading, setLoading] = useState(true);

  // Demo Users Preset Profiles
  const DEMO_PROFILES = {
    government_verified: {
      user: { id: "demo-govt-railways-001", email: "director.railways@gov.in" },
      profile: {
        id: "demo-govt-railways-001",
        full_name: "Dr. Amit Sharma",
        email: "director.railways@gov.in",
        phone: "+91 98100 12345",
        role: "government",
        verification_status: "verified",
        govt_level: "Central Ministry",
        organization_name: "Ministry of Railways",
        designation: "Director of Innovation & Technology",
        description: "Public rail network infrastructure, signaling systems, and rolling stock modernizations.",
        website: "https://railways.gov.in",
      },
    },
    government_pending: {
      user: { id: "demo-govt-dot-002", email: "undersec.dot@nic.in" },
      profile: {
        id: "demo-govt-dot-002",
        full_name: "Pooja Verma",
        email: "undersec.dot@nic.in",
        phone: "+91 98111 54321",
        role: "government",
        verification_status: "pending",
        govt_level: "Central Ministry",
        organization_name: "Department of Telecommunications",
        designation: "Under Secretary (Telecom Research)",
        description: "5G & 6G indigenous stack deployment, rural connectivity, and optical fiber broadband expansion.",
        website: "https://dot.gov.in",
      },
    },
    janparichay: {
      user: { id: "demo-govt-official-001", email: "official@gov.in" },
      profile: {
        id: "demo-govt-official-001",
        full_name: "Government Official (JanParichay)",
        email: "official@gov.in",
        phone: "+91 98100 12345",
        role: "government",
        verification_status: "verified",
        govt_level: "Central Ministry",
        organization_name: "Ministry of Railways / MeitY",
        designation: "Nodal Officer (Innovation & Technology)",
        description: "National sovereign digital exchange and e-governance innovation mission.",
        website: "https://gov.in",
      },
    },
    startup: {
      user: { id: "demo-startup-apex-001", email: "vikram@apexvision.ai" },
      profile: {
        id: "demo-startup-apex-001",
        full_name: "Vikram Patel",
        email: "vikram@apexvision.ai",
        phone: "+91 99887 76655",
        role: "startup",
        verification_status: "verified",
        organization_name: "ApexVision AI Labs",
        sector: "Deep Tech",
        dpiit_id: "DIPP94821",
        description: "Computer vision and edge AI models for predictive maintenance of industrial assets.",
        website: "https://apexvision.ai",
      },
    },
  };

  // Fetch or initialize profile record
  const fetchProfile = useCallback(async (userId, fallbackMetadata = null) => {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return null;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setRole(data.role || "startup");
        return data;
      }

      // If no profile found in DB, populate from metadata if available
      if (fallbackMetadata) {
        const initialRole = fallbackMetadata.role || "startup";
        const initialVerificationStatus =
          fallbackMetadata.verification_status ||
          (initialRole === "government" ? "pending" : "verified");

        const newProfile = {
          id: userId,
          full_name: fallbackMetadata.full_name || "",
          email: fallbackMetadata.email || "",
          phone: fallbackMetadata.phone || "",
          role: initialRole,
          verification_status: initialVerificationStatus,
          govt_level: fallbackMetadata.govt_level || null,
          rejection_reason: fallbackMetadata.rejection_reason || null,
          organization_name: fallbackMetadata.organization_name || "",
          designation: fallbackMetadata.designation || null,
          sector: fallbackMetadata.sector || null,
          description: fallbackMetadata.description || null,
          website: fallbackMetadata.website || null,
        };

        const { data: inserted } = await supabase
          .from("profiles")
          .upsert(newProfile)
          .select()
          .maybeSingle();

        const activeProf = inserted || newProfile;
        setProfile(activeProf);
        setRole(activeProf.role || "startup");
        return activeProf;
      }
    } catch (err) {
      console.warn("Could not fetch profile:", err);
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;

    // 0. Check local demo session first
    const savedDemoKey = localStorage.getItem("udyamsetu_demo_session");
    if (savedDemoKey && DEMO_PROFILES[savedDemoKey]) {
      const demoData = DEMO_PROFILES[savedDemoKey];
      setUser(demoData.user);
      setSession({ user: demoData.user });
      setProfile(demoData.profile);
      setRole(demoData.profile.role);
      setLoading(false);
      return;
    }

    // 1. Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.user_metadata).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      // Don't overwrite active demo session with null if demo key present
      if (!newSession && localStorage.getItem("udyamsetu_demo_session")) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.user_metadata);
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInDemo = (demoKey = "government_verified") => {
    const demoData = DEMO_PROFILES[demoKey] || DEMO_PROFILES.government_verified;
    localStorage.setItem("udyamsetu_demo_session", demoKey);
    setUser(demoData.user);
    setSession({ user: demoData.user });
    setProfile(demoData.profile);
    setRole(demoData.profile.role);
    setLoading(false);
    return demoData;
  };

  const verifyCurrentAccount = async () => {
    if (!profile) return;
    const updated = { ...profile, verification_status: "verified" };
    setProfile(updated);
    // Also sync with DB if real user
    if (user && !user.id.startsWith("demo-")) {
      await supabase.from("profiles").update({ verification_status: "verified" }).eq("id", user.id);
    }
  };

  const signUp = async (email, password, roleData) => {
    const {
      role = "startup",
      fullName = "",
      phone = "",
      organizationName = "",
      designation = "",
      govtLevel = "",
      sector = "",
      dpiitId = "",
      dpiit_id = "",
      description = "",
      website = "",
    } = roleData;

    const resolvedDpiitId = dpiitId || dpiit_id || null;

    // Government accounts start as pending; startups start as verified
    const verificationStatus = role === "government" ? "pending" : "verified";

    const metadata = {
      full_name: fullName,
      phone,
      role,
      verification_status: verificationStatus,
      govt_level: govtLevel || null,
      organization_name: organizationName,
      designation: designation || null,
      sector: sector || null,
      dpiit_id: resolvedDpiitId,
      description: description || null,
      website: website || null,
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (!error && data?.user) {
      // Upsert profile record
      const profileRow = {
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        role,
        verification_status: verificationStatus,
        govt_level: govtLevel || null,
        organization_name: organizationName,
        designation: designation || null,
        sector: sector || null,
        dpiit_id: resolvedDpiitId,
        description: description || null,
        website: website || null,
      };

      if (data.session) {
        await supabase.from("profiles").upsert(profileRow);
        setProfile(profileRow);
        setRole(role);
      }
    }

    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    let resolvedRole = "startup";
    let resolvedProfile = null;

    if (!error && data?.user) {
      resolvedProfile = await fetchProfile(data.user.id, data.user.user_metadata);
      resolvedRole = resolvedProfile?.role || data.user.user_metadata?.role || "startup";
      setRole(resolvedRole);
    }

    const verificationStatus =
      resolvedProfile?.verification_status ||
      (resolvedRole === "government" ? "pending" : "verified");

    return {
      data,
      profile: resolvedProfile,
      role: resolvedRole,
      verificationStatus,
      error,
    };
  };

  const signOut = async () => {
    localStorage.removeItem("udyamsetu_demo_session");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (user && !user.id.startsWith("demo-")) {
      await fetchProfile(user.id, user.user_metadata);
    }
  };

  const verificationStatus =
    profile?.verification_status ||
    (role === "government" ? "pending" : "verified");

  const isGovernmentVerified =
    role === "government" && verificationStatus === "verified";

  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        verificationStatus,
        isGovernmentVerified,
        isAdmin,
        loading,
        signIn,
        signInDemo,
        verifyCurrentAccount,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
