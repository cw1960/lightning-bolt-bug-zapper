import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2, Database, Plus } from "lucide-react";

const DatabaseSetup = () => {
  const [status, setStatus] = useState<{
    loading: boolean;
    message: string;
    success?: boolean;
  }>({ loading: false, message: "" });

  const createTables = async () => {
    setStatus({ loading: true, message: "Creating database tables..." });

    try {
      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY,
          email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Create user_settings table
      const createUserSettingsTable = `
        CREATE TABLE IF NOT EXISTS public.user_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          claude_api_key TEXT,
          gemini_api_key TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `;

      // Create subscriptions table
      const createSubscriptionsTable = `
        CREATE TABLE IF NOT EXISTS public.subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          subscription_id TEXT,
          customer_id TEXT,
          status TEXT,
          plan_id TEXT,
          current_period_start TIMESTAMP WITH TIME ZONE,
          current_period_end TIMESTAMP WITH TIME ZONE,
          cancel_at_period_end BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `;

      // Create api_keys table
      const createApiKeysTable = `
        CREATE TABLE IF NOT EXISTS public.api_keys (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          provider TEXT,
          api_key TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Execute all table creation queries
      const tables = [
        { name: "users", sql: createUsersTable },
        { name: "user_settings", sql: createUserSettingsTable },
        { name: "subscriptions", sql: createSubscriptionsTable },
        { name: "api_keys", sql: createApiKeysTable },
      ];

      for (const table of tables) {
        setStatus({
          loading: true,
          message: `Creating ${table.name} table...`,
        });
        const { error } = await supabase.rpc("execute_sql", { sql: table.sql });

        if (error) {
          console.error(`Error creating ${table.name} table:`, error);
          setStatus({
            loading: false,
            message: `Error creating ${table.name} table: ${error.message}`,
            success: false,
          });
          return;
        }
      }

      setStatus({
        loading: false,
        message: "All database tables created successfully!",
        success: true,
      });
    } catch (error: any) {
      console.error("Error setting up database:", error);
      setStatus({
        loading: false,
        message: `Error: ${error.message}`,
        success: false,
      });
    }
  };

  const insertTestData = async () => {
    setStatus({ loading: true, message: "Inserting test data..." });

    try {
      // Generate a test user ID
      const testUserId = crypto.randomUUID();

      // Insert test user
      const insertTestUser = `
        INSERT INTO public.users (id, email, created_at, updated_at)
        VALUES ('${testUserId}', 'test@example.com', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
        RETURNING id;
      `;

      setStatus({
        loading: true,
        message: "Inserting test user...",
      });

      const { data: userData, error: userError } = await supabase.rpc(
        "execute_sql",
        {
          sql: insertTestUser,
        },
      );

      if (userError) {
        console.error("Error inserting test user:", userError);
        setStatus({
          loading: false,
          message: `Error inserting test user: ${userError.message}`,
          success: false,
        });
        return;
      }

      // Insert test user settings
      const insertTestUserSettings = `
        INSERT INTO public.user_settings (user_id, claude_api_key, gemini_api_key, created_at, updated_at)
        VALUES ('${testUserId}', 'test-claude-key-123', 'test-gemini-key-456', NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
      `;

      setStatus({
        loading: true,
        message: "Inserting test user settings...",
      });

      const { error: settingsError } = await supabase.rpc("execute_sql", {
        sql: insertTestUserSettings,
      });

      if (settingsError) {
        console.error("Error inserting test user settings:", settingsError);
        setStatus({
          loading: false,
          message: `Error inserting test user settings: ${settingsError.message}`,
          success: false,
        });
        return;
      }

      // Insert test subscription
      const insertTestSubscription = `
        INSERT INTO public.subscriptions 
        (user_id, subscription_id, customer_id, status, plan_id, current_period_start, current_period_end, cancel_at_period_end)
        VALUES 
        ('${testUserId}', 'sub_test123', 'cus_test123', 'active', 'plan_basic', NOW(), NOW() + INTERVAL '30 days', false)
        ON CONFLICT (user_id) DO NOTHING;
      `;

      setStatus({
        loading: true,
        message: "Inserting test subscription...",
      });

      const { error: subscriptionError } = await supabase.rpc("execute_sql", {
        sql: insertTestSubscription,
      });

      if (subscriptionError) {
        console.error("Error inserting test subscription:", subscriptionError);
        setStatus({
          loading: false,
          message: `Error inserting test subscription: ${subscriptionError.message}`,
          success: false,
        });
        return;
      }

      // Insert test API keys
      const insertTestApiKeys = `
        INSERT INTO public.api_keys (user_id, provider, api_key)
        VALUES 
        ('${testUserId}', 'claude', 'test-claude-key-123'),
        ('${testUserId}', 'gemini', 'test-gemini-key-456');
      `;

      setStatus({
        loading: true,
        message: "Inserting test API keys...",
      });

      const { error: apiKeysError } = await supabase.rpc("execute_sql", {
        sql: insertTestApiKeys,
      });

      if (apiKeysError) {
        console.error("Error inserting test API keys:", apiKeysError);
        setStatus({
          loading: false,
          message: `Error inserting test API keys: ${apiKeysError.message}`,
          success: false,
        });
        return;
      }

      // Verify data was inserted by querying the users table
      const { data: verifyData, error: verifyError } = await supabase.rpc(
        "execute_sql",
        {
          sql: `SELECT * FROM public.users WHERE email = 'test@example.com';`,
        },
      );

      if (verifyError) {
        console.error("Error verifying test data:", verifyError);
        setStatus({
          loading: false,
          message: `Error verifying test data: ${verifyError.message}`,
          success: false,
        });
        return;
      }

      setStatus({
        loading: false,
        message: `Test data inserted successfully! Created test user with email: test@example.com and ID: ${testUserId}`,
        success: true,
      });
    } catch (error: any) {
      console.error("Error inserting test data:", error);
      setStatus({
        loading: false,
        message: `Error: ${error.message}`,
        success: false,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If you're experiencing issues with user registration or database
          access, you can manually create the required database tables.
        </p>

        {status.message && (
          <Alert
            className={`${
              status.success === true
                ? "bg-green-500/10 border-green-500/20"
                : status.success === false
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-blue-500/10 border-blue-500/20"
            }`}
          >
            {status.loading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <AlertDescription>{status.message}</AlertDescription>
              </div>
            ) : status.success ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600">
                  {status.message}
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">
                  {status.message}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button onClick={createTables} disabled={status.loading}>
            {status.loading && status.message.includes("Creating")
              ? "Setting Up..."
              : "Create Database Tables"}
          </Button>
          <Button
            onClick={insertTestData}
            disabled={status.loading}
            variant="outline"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            {status.loading && status.message.includes("Inserting")
              ? "Adding Test Data..."
              : "Add Test Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSetup;
