import { createClient } from "@supabase/supabase-js";

// Use environment variables for production, fallback to demo values for development
const isDemoMode =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://mskjqqskclzklmapejmj.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1za2pxcXNrY2x6a2xtYXBlam1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NDU2NzIsImV4cCI6MjA1OTAyMTY3Mn0.LgKdAdHEo6l617rnssxXpNLF2JJeRsk0YSAI_hU_iok";

console.log(`Running in ${isDemoMode ? "DEMO" : "PRODUCTION"} mode`);
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Anon Key: ${supabaseAnonKey.substring(0, 10)}...`);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "Cache-Control": "no-cache",
    },
  },
});

// Initialize Supabase schema if needed
export async function initializeSupabaseSchema() {
  // Check if we're in demo mode
  const isDemoMode =
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (isDemoMode) {
    // In demo mode, we don't need to initialize the schema
    console.log("Demo mode: Skipping Supabase schema initialization");
    return;
  }

  console.log("Checking Supabase schema...");

  // Production mode - check and initialize schema
  try {
    // Check if auth is working
    const { data: authData, error: authError } =
      await supabase.auth.getSession();
    console.log(
      "Auth check:",
      authError ? "Error" : "OK",
      authError ? authError.message : "",
    );

    // Check if users table exists
    const { data: usersData, error: usersCheckError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    console.log(
      "Users table check:",
      usersCheckError ? usersCheckError.message : "OK",
      "Data:",
      usersData,
    );

    // Check if error_captures table exists
    const { data: errorsData, error: errorsCheckError } = await supabase
      .from("error_captures")
      .select("id")
      .limit(1);

    console.log(
      "Error captures table check:",
      errorsCheckError ? errorsCheckError.message : "OK",
      "Data:",
      errorsData,
    );

    // Check if subscriptions table exists
    const { data: subscriptionsData, error: subscriptionsCheckError } =
      await supabase.from("subscriptions").select("id").limit(1);

    console.log(
      "Subscriptions table check:",
      subscriptionsCheckError ? subscriptionsCheckError.message : "OK",
      "Data:",
      subscriptionsData,
    );

    // Check if api_keys table exists
    const { data: apiKeysData, error: apiKeysCheckError } = await supabase
      .from("api_keys")
      .select("id")
      .limit(1);

    console.log(
      "API keys table check:",
      apiKeysCheckError ? apiKeysCheckError.message : "OK",
      "Data:",
      apiKeysData,
    );

    // Log detailed error information if any table check failed
    if (
      usersCheckError ||
      errorsCheckError ||
      subscriptionsCheckError ||
      apiKeysCheckError
    ) {
      console.error("Schema check errors detected:");
      if (usersCheckError) console.error("Users table error:", usersCheckError);
      if (errorsCheckError)
        console.error("Error captures table error:", errorsCheckError);
      if (subscriptionsCheckError)
        console.error("Subscriptions table error:", subscriptionsCheckError);
      if (apiKeysCheckError)
        console.error("API keys table error:", apiKeysCheckError);
    }
  } catch (error) {
    console.error("Error initializing Supabase schema:", error);
  }
}

// Call the initialization function
initializeSupabaseSchema().catch((err) => {
  console.error("Failed to initialize Supabase schema:", err);
});
