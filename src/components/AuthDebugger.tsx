import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2, Bug } from "lucide-react";

const AuthDebugger = () => {
  const [status, setStatus] = useState<{
    loading: boolean;
    message: string;
    success?: boolean;
    details?: string;
  }>({ loading: false, message: "" });

  const testAuth = async () => {
    setStatus({ loading: true, message: "Testing authentication..." });

    try {
      // 1. Test Supabase connection
      setStatus({ loading: true, message: "Testing Supabase connection..." });

      // Log Supabase URL and key (first few chars)
      console.log("Supabase URL:", supabase.supabaseUrl);
      console.log(
        "Supabase key (first 10 chars):",
        supabase.supabaseKey.substring(0, 10),
      );

      // 2. Test auth endpoint
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        setStatus({
          loading: false,
          message: `Auth endpoint error: ${authError.message}`,
          success: false,
          details: JSON.stringify(authError, null, 2),
        });
        return;
      }

      // 3. Test RPC functionality
      setStatus({ loading: true, message: "Testing RPC functionality..." });

      try {
        const { data: rpcData, error: rpcError } =
          await supabase.rpc("version");

        if (rpcError) {
          setStatus({
            loading: false,
            message: `RPC error: ${rpcError.message}`,
            success: false,
            details: JSON.stringify(rpcError, null, 2),
          });
          return;
        }

        console.log("RPC version result:", rpcData);
      } catch (rpcErr: any) {
        setStatus({
          loading: false,
          message: `RPC exception: ${rpcErr.message}`,
          success: false,
          details: JSON.stringify(rpcErr, null, 2),
        });
        return;
      }

      // 4. Test direct SQL execution
      setStatus({ loading: true, message: "Testing SQL execution..." });

      try {
        const { data: sqlData, error: sqlError } = await supabase.rpc(
          "execute_sql",
          {
            sql: "SELECT current_timestamp;",
          },
        );

        if (sqlError) {
          setStatus({
            loading: false,
            message: `SQL execution error: ${sqlError.message}`,
            success: false,
            details: JSON.stringify(sqlError, null, 2),
          });
          return;
        }

        console.log("SQL execution result:", sqlData);
      } catch (sqlErr: any) {
        setStatus({
          loading: false,
          message: `SQL execution exception: ${sqlErr.message}`,
          success: false,
          details: JSON.stringify(sqlErr, null, 2),
        });
        return;
      }

      // 5. Test user creation directly with SQL
      setStatus({
        loading: true,
        message: "Testing user creation with SQL...",
      });

      const testUserId = crypto.randomUUID();
      const testEmail = `test-${Date.now()}@example.com`;

      try {
        // Create users table if not exists
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;

        const { error: createTableError } = await supabase.rpc("execute_sql", {
          sql: createTableSql,
        });

        if (createTableError) {
          setStatus({
            loading: false,
            message: `Create table error: ${createTableError.message}`,
            success: false,
            details: JSON.stringify(createTableError, null, 2),
          });
          return;
        }

        // Insert test user
        const insertUserSql = `
          INSERT INTO public.users (id, email, created_at, updated_at)
          VALUES ('${testUserId}', '${testEmail}', NOW(), NOW())
          RETURNING id, email;
        `;

        const { data: insertData, error: insertError } = await supabase.rpc(
          "execute_sql",
          {
            sql: insertUserSql,
          },
        );

        if (insertError) {
          setStatus({
            loading: false,
            message: `Insert user error: ${insertError.message}`,
            success: false,
            details: JSON.stringify(insertError, null, 2),
          });
          return;
        }

        console.log("Insert user result:", insertData);
      } catch (userErr: any) {
        setStatus({
          loading: false,
          message: `User creation exception: ${userErr.message}`,
          success: false,
          details: JSON.stringify(userErr, null, 2),
        });
        return;
      }

      // All tests passed
      setStatus({
        loading: false,
        message: "All authentication tests passed successfully!",
        success: true,
        details: `Successfully created test user with email: ${testEmail} and ID: ${testUserId}`,
      });
    } catch (error: any) {
      console.error("Auth debugger error:", error);
      setStatus({
        loading: false,
        message: `Error: ${error.message}`,
        success: false,
        details: JSON.stringify(error, null, 2),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Authentication Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This tool runs a series of tests to diagnose authentication issues
          with your Supabase setup.
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

        {status.details && (
          <div className="mt-2 p-3 bg-muted/50 rounded-md overflow-auto max-h-40 text-xs font-mono">
            {status.details}
          </div>
        )}

        <Button onClick={testAuth} disabled={status.loading}>
          {status.loading ? "Running Tests..." : "Run Authentication Tests"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthDebugger;
