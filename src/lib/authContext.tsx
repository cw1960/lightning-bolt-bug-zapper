import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "./supabaseClient";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  freeTrialFixesUsed: number;
  incrementFreeTrialFixes: () => void;
  resetFreeTrialFixes: () => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  loading: true,
  isSubscribed: false,
  setIsSubscribed: () => {},
  freeTrialFixesUsed: 0,
  incrementFreeTrialFixes: () => {},
  resetFreeTrialFixes: () => {},
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [freeTrialFixesUsed, setFreeTrialFixesUsed] = useState<number>(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] =
    useState<boolean>(false);

  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    console.log("Is demo mode:", isDemoMode);
    console.log("Supabase URL:", supabase.supabaseUrl);

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log("Initial session:", session ? "Found" : "None");
        if (session) {
          console.log("Session user ID:", session.user.id);
          console.log(
            "Session expires at:",
            new Date(session.expires_at * 1000).toISOString(),
          );
          console.log("User metadata:", session.user.user_metadata);
          console.log(
            "Access token (first 10 chars):",
            session.access_token.substring(0, 10),
          );

          // Verify the token works by making a simple request
          supabase.auth
            .getUser(session.access_token)
            .then(({ data, error }) => {
              if (error) {
                console.error("Token verification failed:", error);
              } else {
                console.log("Token verified successfully, user:", data.user.id);
              }
            });
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event);
      if (session) {
        console.log("New session user ID:", session.user.id);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load free trial fixes count and onboarding status from localStorage on init
  useEffect(() => {
    const savedFixesCount = localStorage.getItem("freeTrialFixesUsed");
    if (savedFixesCount) {
      setFreeTrialFixesUsed(parseInt(savedFixesCount, 10));
    }

    const onboardingStatus = localStorage.getItem("hasCompletedOnboarding");
    if (onboardingStatus === "true") {
      setHasCompletedOnboarding(true);
    }
  }, []);

  // Check if we're in demo mode
  const isDemoMode =
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (user) {
      console.log("User authenticated, checking subscription status");
      if (isDemoMode) {
        // For demo purposes, set subscription status based on email
        const email = user.email?.toLowerCase() || "";
        const isDemo = email.includes("demo") || email.includes("test");
        console.log(
          "Demo mode: Setting subscription status based on email",
          isDemo,
        );
        setIsSubscribed(isDemo);
      } else {
        // In production mode, check actual subscription
        checkSubscription();
      }
    } else {
      setIsSubscribed(false);
    }
  }, [user]);

  const checkSubscription = async () => {
    if (isDemoMode) {
      // In demo mode, subscription status is set in the useEffect above
      console.log("Demo mode: Subscription status check");
      return;
    }

    // Production mode - actual subscription check
    if (!user) return;

    try {
      // First check localStorage for a recently updated subscription status
      // This helps in cases where the database update might be delayed
      const localSubscriptionStatus = localStorage.getItem(
        "userSubscriptionStatus",
      );
      if (localSubscriptionStatus === "active") {
        console.log("Found active subscription status in localStorage");
        setIsSubscribed(true);
        return;
      }

      console.log("Checking subscription for user:", user.id);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No subscription found for user in database");
          // Try a second query with maybeSingle instead of single
          const { data: altData, error: altError } = await supabase
            .from("subscriptions")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!altError && altData?.status === "active") {
            console.log("Found subscription with alternative query");
            setIsSubscribed(true);
            return;
          }
        } else {
          console.error("Error checking subscription:", error);
        }
        return;
      }

      console.log("Subscription status from database:", data?.status);
      if (data?.status === "active") {
        setIsSubscribed(true);
        // Also update localStorage
        localStorage.setItem("userSubscriptionStatus", "active");
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const signOut = async () => {
    try {
      console.log("Signing out user");
      await supabase.auth.signOut();
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const incrementFreeTrialFixes = () => {
    const newCount = freeTrialFixesUsed + 1;
    setFreeTrialFixesUsed(newCount);
    localStorage.setItem("freeTrialFixesUsed", newCount.toString());
  };

  const resetFreeTrialFixes = () => {
    setFreeTrialFixesUsed(0);
    localStorage.setItem("freeTrialFixesUsed", "0");
  };

  const setHasCompletedOnboardingWithStorage = (value: boolean) => {
    setHasCompletedOnboarding(value);
    localStorage.setItem("hasCompletedOnboarding", value.toString());
  };

  const value = {
    session,
    user,
    signOut,
    loading,
    isSubscribed,
    setIsSubscribed,
    freeTrialFixesUsed,
    incrementFreeTrialFixes,
    resetFreeTrialFixes,
    hasCompletedOnboarding,
    setHasCompletedOnboarding: setHasCompletedOnboardingWithStorage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export the context hook as a named function for Fast Refresh compatibility
export function useAuth() {
  return useContext(AuthContext);
}
