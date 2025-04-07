import { createClient } from "@supabase/supabase-js";

// Use the correct Supabase URL from manifest.json CSP
const supabaseUrl = "https://xuktzhjeqsywtfdlzxpi.supabase.co";

// Using the same Supabase Anon Key from previous file
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a3R6aGplcXN5d3RmZGx6eHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc1MTMsImV4cCI6MjA1OTM2MzUxM30.Ar0ImorooUONYLTpHKnkPbJDvaj6JWt1M-xZr0Fc4LI";

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "lightning-bolt-bug-zapper-auth"
  }
});

// Helper functions for authentication
export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });
  
  if (data.user) {
    // Create a profile entry
    await supabase.from('profiles').insert({
      id: data.user.id,
      display_name: displayName,
      email: email
    });
  }
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return await supabase.auth.getUser();
};

export const getSession = async () => {
  return await supabase.auth.getSession();
}; 