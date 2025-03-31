import { setupApiRoutes } from "./routes";
import { initializeSupabaseSchema } from "../lib/supabaseClient";

// Initialize API and database
export async function initializeApi() {
  // Set up API routes
  await setupApiRoutes();

  // Initialize Supabase schema if needed
  await initializeSupabaseSchema();

  console.log("API and database initialized");
}
