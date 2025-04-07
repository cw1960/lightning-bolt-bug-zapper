import { createClient } from "@supabase/supabase-js";

// Use the correct Supabase URL from manifest.json CSP
const supabaseUrl = "https://xuktzhjeqsywtfdlzxpi.supabase.co";

// !!! IMPORTANT: Replace this with your actual Supabase Anon Key !!!
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a3R6aGplcXN5d3RmZGx6eHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc1MTMsImV4cCI6MjA1OTM2MzUxM30.Ar0ImorooUONYLTpHKnkPbJDvaj6JWt1M-xZr0Fc4LI";

// Log the actual values being used (without exposing full key)
console.log(`Supabase URL being used: ${supabaseUrl}`);
console.log(
  `Supabase Anon Key being used: ${supabaseAnonKey.substring(0, 10)}...`
);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Keep true for potential email link redirects
    storageKey: "lightning-bolt-bug-zapper-auth"
  },
  global: {
    headers: {
      "Cache-Control": "no-cache" // Consider if this is always needed
    }
  },
  db: {
    schema: "public"
  },
  // Increase timeout for slow connections
  realtime: {
    timeout: 60000 // Consider if this high timeout is necessary
  }
});

// Client-side schema initialization removed. 
// Ensure your tables (e.g., user_settings) exist in your Supabase project.
// You can use the Supabase dashboard or migrations.
// Reference `supabase-schema.sql` if needed.
