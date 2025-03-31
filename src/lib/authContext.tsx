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
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signOut: async () => {},
  loading: true,
  isSubscribed: false,
  setIsSubscribed: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
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
      console.log("Checking subscription for user:", user.id);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("No subscription found for user");
        } else {
          console.error("Error checking subscription:", error);
        }
        return;
      }

      console.log("Subscription status:", data?.status);
      setIsSubscribed(data?.status === "active");
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

  const value = {
    session,
    user,
    signOut,
    loading,
    isSubscribed,
    setIsSubscribed,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export as a named function declaration instead of an arrow function for Fast Refresh compatibility
export function useAuth() {
  return useContext(AuthContext);
}
