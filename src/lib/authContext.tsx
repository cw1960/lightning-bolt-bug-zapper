import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { UserSettings } from "../types/supabase";

// Define the shape of our auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userSettings: UserSettings | null;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string, userData: any) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
  saveApiKeys: (claudeKey: string, geminiKey: string) => Promise<boolean>;
  getApiKeys: () => Promise<{
    claude: string | null;
    gemini: string | null;
  }>;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userSettings: null,
  signIn: async () => ({ error: null, data: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  loading: true,
  saveApiKeys: async () => false,
  getApiKeys: async () => ({ claude: null, gemini: null }),
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component to wrap the app with
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Get the current session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("Initializing auth state...");

        // Get the current session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        if (data?.session) {
          setSession(data.session);
          setUser(data.session.user);

          // Get user settings
          await fetchUserSettings(data.session.user.id);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    // Call the initialization function
    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchUserSettings(newSession.user.id);
        } else {
          setUserSettings(null);
        }
      }
    );

    // Clean up the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch user settings from the database
  const fetchUserSettings = async (userId: string) => {
    try {
      console.log("Fetching user settings for user:", userId);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user settings:", error);
        return null;
      }

      console.log("User settings fetched:", data);
      setUserSettings(data);
      return data;
    } catch (error) {
      console.error("Error in fetchUserSettings:", error);
      return null;
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log("Signing in user:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error signing in:", error);
        return { error, data: null };
      }

      console.log("User signed in successfully:", data);
      return { error: null, data: data.session };
    } catch (error) {
      console.error("Error in signIn:", error);
      return { error: error as Error, data: null };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log("Signing up user:", email);
      
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: userData.displayName || email.split("@")[0],
          },
        },
      });

      if (error) {
        console.error("Error signing up:", error);
        return { error, data: null };
      }

      if (!data.user) {
        console.error("No user returned from signUp");
        return {
          error: new Error("No user returned from signUp"),
          data: null,
        };
      }

      console.log("User signed up successfully:", data);

      // Create user settings record
      if (userData.claudeKey || userData.geminiKey) {
        const { error: settingsError } = await supabase
          .from("user_settings")
          .insert([
            {
              user_id: data.user.id,
              claude_api_key: userData.claudeKey || null,
              gemini_api_key: userData.geminiKey || null,
            },
          ]);

        if (settingsError) {
          console.error("Error creating user settings:", settingsError);
        } else {
          console.log("User settings created successfully");
        }
      }

      return { error: null, data: data.session };
    } catch (error) {
      console.error("Error in signUp:", error);
      return { error: error as Error, data: null };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      console.log("Signing out user");
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setUserSettings(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Save API keys
  const saveApiKeys = async (claudeKey: string, geminiKey: string) => {
    try {
      if (!user) {
        console.error("No user logged in");
        return false;
      }

      console.log("Saving API keys for user:", user.id);

      // Check if user settings already exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching user settings:", fetchError);
        return false;
      }

      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("user_settings")
          .update({
            claude_api_key: claudeKey || existingSettings.claude_api_key,
            gemini_api_key: geminiKey || existingSettings.gemini_api_key,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating API keys:", updateError);
          return false;
        }
      } else {
        // Create new settings
        const { error: insertError } = await supabase
          .from("user_settings")
          .insert([
            {
              user_id: user.id,
              claude_api_key: claudeKey || null,
              gemini_api_key: geminiKey || null,
            },
          ]);

        if (insertError) {
          console.error("Error inserting API keys:", insertError);
          return false;
        }
      }

      // Refresh user settings
      await fetchUserSettings(user.id);
      return true;
    } catch (error) {
      console.error("Error saving API keys:", error);
      return false;
    }
  };

  // Get API keys
  const getApiKeys = async () => {
    try {
      if (!user) {
        console.error("No user logged in");
        return { claude: null, gemini: null };
      }

      console.log("Getting API keys for user:", user.id);

      // Fetch user settings
      const settings = await fetchUserSettings(user.id);

      if (!settings) {
        return { claude: null, gemini: null };
      }

      return {
        claude: settings.claude_api_key,
        gemini: settings.gemini_api_key,
      };
    } catch (error) {
      console.error("Error getting API keys:", error);
      return { claude: null, gemini: null };
    }
  };

  // Provide the auth context to children
  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userSettings,
        signIn,
        signUp,
        signOut,
        loading,
        saveApiKeys,
        getApiKeys,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
