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

// Log the actual values being used (without exposing full key)
console.log(`Supabase URL being used: ${supabaseUrl}`);
console.log(
  `Supabase Anon Key being used: ${supabaseAnonKey.substring(0, 10)}...`,
);

console.log(`Running in ${isDemoMode ? "DEMO" : "PRODUCTION"} mode`);
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Anon Key: ${supabaseAnonKey.substring(0, 10)}...`);

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "lightning-bolt-bug-zapper-auth",
  },
  global: {
    headers: {
      "Cache-Control": "no-cache",
    },
  },
  db: {
    schema: "public",
  },
  // Increase timeout for slow connections
  realtime: {
    timeout: 60000,
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

    // Check if user_settings table exists and create it if it doesn't
    try {
      console.log("Checking if user_settings table exists...");
      const { data: userSettingsData, error: userSettingsCheckError } =
        await supabase.from("user_settings").select("user_id").limit(1);

      if (userSettingsCheckError) {
        console.log(
          "Error checking user_settings table:",
          userSettingsCheckError.message,
          "Code:",
          userSettingsCheckError.code,
        );

        if (userSettingsCheckError.code === "PGRST116") {
          console.log(
            "user_settings table doesn't exist, attempting to create it...",
          );
          // Try to create the table with direct SQL
          const { error: sqlError } = await supabase.rpc("execute_sql", {
            sql: `
                CREATE TABLE IF NOT EXISTS public.user_settings (
                  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                  claude_api_key TEXT,
                  gemini_api_key TEXT,
                  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                  UNIQUE(user_id)
                );
              `,
          });

          if (sqlError) {
            console.error(
              "Error creating user_settings table with SQL:",
              sqlError,
            );
          } else {
            console.log("user_settings table created successfully with SQL");
          }
        }
      } else {
        console.log("user_settings table exists");
      }
    } catch (error) {
      console.error("Error checking/creating user_settings table:", error);
    }

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

    // If users table doesn't exist, create it
    if (usersCheckError && usersCheckError.code === "PGRST116") {
      console.log("Creating users table...");
      const { error: createError } = await supabase.rpc("execute_sql", {
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
      });

      if (createError) {
        console.error("Error creating users table:", createError);
      } else {
        console.log("Users table created successfully");
      }
    }

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

// Call the initialization function immediately
try {
  initializeSupabaseSchema();
} catch (err) {
  console.error("Failed to initialize Supabase schema:", err);
}
