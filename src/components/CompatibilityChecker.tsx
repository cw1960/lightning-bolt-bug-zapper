import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const CompatibilityChecker = () => {
  const [status, setStatus] = useState<{
    checking: boolean;
    success: boolean;
    message: string;
  }>({
    checking: true,
    success: false,
    message: "Checking database connection...",
  });

  const checkConnection = async () => {
    setStatus({
      checking: true,
      success: false,
      message: "Checking database connection...",
    });

    try {
      // Check if we can connect to Supabase
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        setStatus({
          checking: false,
          success: false,
          message: `Auth error: ${authError.message}`,
        });
        return;
      }

      // Try a simple query to check database access
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (error) {
        // If table doesn't exist, try to create it
        if (error.code === "PGRST116") {
          try {
            // Check if we have RPC access
            const { data: rpcData, error: rpcError } =
              await supabase.rpc("version");

            if (rpcError) {
              setStatus({
                checking: false,
                success: false,
                message: `Cannot use RPC: ${rpcError.message}. Please check your Supabase permissions.`,
              });
              return;
            }

            // Try to create the users table directly
            const createTableQuery = `
              CREATE TABLE IF NOT EXISTS public.users (
                id UUID PRIMARY KEY,
                email TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;

            const { error: createError } = await supabase.rpc("execute_sql", {
              sql: createTableQuery,
            });

            if (createError) {
              setStatus({
                checking: false,
                success: false,
                message: `Failed to create users table: ${createError.message}`,
              });
              return;
            }

            setStatus({
              checking: false,
              success: true,
              message: "Successfully created users table!",
            });
          } catch (err: any) {
            setStatus({
              checking: false,
              success: false,
              message: `Error creating table: ${err.message}`,
            });
          }
        } else {
          setStatus({
            checking: false,
            success: false,
            message: `Database error: ${error.message}`,
          });
        }
      } else {
        setStatus({
          checking: false,
          success: true,
          message: "Successfully connected to database!",
        });
      }
    } catch (err: any) {
      setStatus({
        checking: false,
        success: false,
        message: `Unexpected error: ${err.message}`,
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Database Compatibility Check</h2>

      <Alert
        className={
          status.checking
            ? "bg-blue-500/10 border-blue-500/20"
            : status.success
              ? "bg-green-500/10 border-green-500/20"
              : "bg-red-500/10 border-red-500/20"
        }
      >
        {status.checking ? (
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

      <Button onClick={checkConnection} disabled={status.checking}>
        {status.checking ? "Checking..." : "Check Again"}
      </Button>
    </div>
  );
};

export default CompatibilityChecker;
