import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2, UserCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

interface AuthProps {
  onAuthStateChange?: (session: any) => void;
}

const Auth = ({ onAuthStateChange = () => {} }: AuthProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const navigate = useNavigate();

  // Check if we're in demo mode
  const isDemoMode =
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    console.log(
      `Auth component mounted - ${isDemoMode ? "Demo" : "Production"} mode active`,
    );

    // In production mode, check connection
    if (!isDemoMode) {
      const checkConnection = async () => {
        try {
          console.log("Checking Supabase connection...");
          const { data, error } = await supabase
            .from("subscriptions")
            .select("count")
            .limit(1);
          if (error) {
            console.warn("Supabase connection check failed:", error);
          } else {
            console.log("Supabase connection successful");
          }
        } catch (err) {
          console.error("Failed to connect to Supabase:", err);
        }
      };

      checkConnection();
    }
  }, [isDemoMode]);

  // Force create tables on component mount
  useEffect(() => {
    if (!isDemoMode) {
      const setupTables = async () => {
        try {
          console.log("Pre-creating database tables...");
          // Create users table
          const createUsersTable = `
            CREATE TABLE IF NOT EXISTS public.users (
              id UUID PRIMARY KEY,
              email TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `;
          await supabase.rpc("execute_sql", { sql: createUsersTable });
          console.log("Users table created or verified");
        } catch (err) {
          console.error("Failed to pre-create tables:", err);
        }
      };
      setupTables();
    }
  }, [isDemoMode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log("Sign up attempt with email:", email);

    // Check if we're in demo mode
    const isDemoMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      if (isDemoMode) {
        console.log("Demo mode: Simulating successful signup");
        // For demo purposes, simulate a successful signup
        setTimeout(() => {
          setMessage({
            type: "success",
            text: "Successfully signed up!",
          });
          setLoading(false);

          // Create a mock session
          const mockSession = {
            user: {
              id: "demo-user-id",
              email: email,
              user_metadata: { name: "Demo User" },
            },
            access_token: "demo-access-token",
            refresh_token: "demo-refresh-token",
          };

          // Notify parent component about auth state change
          onAuthStateChange(mockSession);

          // Wait 2 seconds then redirect to onboarding page
          setTimeout(() => {
            // Use React Router navigation instead of direct window.location
            navigate("/onboarding");
          }, 2000);
        }, 1500);
        return;
      }

      console.log("Attempting to sign up with Supabase:", { email });

      try {
        console.log(
          "Calling supabase.auth.signUp with URL:",
          supabase.supabaseUrl,
        );
        console.log("Email redirect URL:", window.location.origin);

        console.log("Sending signup request with these options:", {
          email,
          emailRedirectTo: window.location.origin,
          metadata: { first_login: true },
        });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              first_login: true,
            },
          },
        });

        console.log("Sign up response:", {
          data: data
            ? {
                user: data.user
                  ? {
                      id: data.user.id,
                      email: data.user.email,
                      created_at: data.user.created_at,
                    }
                  : null,
                session: data.session ? "Session present" : "No session",
              }
            : "No data",
          error: error
            ? {
                message: error.message,
                status: error.status,
              }
            : "No error",
        });

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Successfully signed up!",
        });

        if (data.session) {
          console.log("Session created:", data.session.user.id);

          // Create a user record in the public schema
          try {
            // First ensure the table exists
            console.log("Ensuring users table exists before insert");
            const createUsersTable = `
              CREATE TABLE IF NOT EXISTS public.users (
                id UUID PRIMARY KEY,
                email TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
            `;
            await supabase.rpc("execute_sql", { sql: createUsersTable });

            // Now try the insert
            console.log("Attempting to insert user record");
            const { error: userError } = await supabase.from("users").upsert(
              {
                id: data.user.id,
                email: data.user.email,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );

            if (userError) {
              console.error("Error creating user record:", userError);

              // If the error is because the table doesn't exist
              if (
                userError.code === "PGRST116" ||
                (userError.message &&
                  userError.message.includes("does not exist"))
              ) {
                console.log(
                  "Users table may not exist, trying to create it...",
                );

                // Try to create the table
                const { error: createError } = await supabase.rpc(
                  "execute_sql",
                  {
                    sql: `
                    CREATE TABLE IF NOT EXISTS public.users (
                      id UUID PRIMARY KEY,
                      email TEXT,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                  `,
                  },
                );

                if (createError) {
                  console.error("Error creating users table:", createError);
                } else {
                  console.log("Users table created, trying insert again");

                  // Try insert again
                  const { error: retryError } = await supabase
                    .from("users")
                    .upsert(
                      {
                        id: data.user.id,
                        email: data.user.email,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );

                  if (retryError) {
                    console.error("Error on retry insert:", retryError);
                  } else {
                    console.log("User record created successfully on retry");
                  }
                }
              }
            } else {
              console.log("User record created successfully");
            }
          } catch (err: any) {
            console.error("Exception creating user record:", err);

            // If the error is because the table doesn't exist
            if (
              err.code === "PGRST116" ||
              (err.message && err.message.includes("does not exist"))
            ) {
              console.log("Users table may not exist, trying to create it...");

              try {
                // Try to create the table
                const { error: createError } = await supabase.rpc(
                  "execute_sql",
                  {
                    sql: `
                    CREATE TABLE IF NOT EXISTS public.users (
                      id UUID PRIMARY KEY,
                      email TEXT,
                      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                  `,
                  },
                );

                if (createError) {
                  console.error("Error creating users table:", createError);
                } else {
                  console.log("Users table created, trying insert again");

                  // Try insert again
                  const { error: retryError } = await supabase
                    .from("users")
                    .upsert(
                      {
                        id: data.user.id,
                        email: data.user.email,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "id" },
                    );

                  if (retryError) {
                    console.error("Error on retry insert:", retryError);
                  } else {
                    console.log("User record created successfully on retry");
                  }
                }
              } catch (createErr) {
                console.error("Failed to create users table:", createErr);
              }
            }
          }

          // Wait 2 seconds then redirect to onboarding page
          setTimeout(() => {
            onAuthStateChange(data.session);
            // Use React Router navigation instead of direct window.location
            navigate("/onboarding");
          }, 2000);
        } else {
          console.log("No session in response, user may need to confirm email");
          setMessage({
            type: "success",
            text: "Account created! Please check your email to confirm your registration.",
          });
        }
      } catch (apiError: any) {
        throw apiError;
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      setMessage({
        type: "error",
        text: error.message || "An error occurred during sign up",
      });
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log("Sign in attempt with email:", email);

    // Check if we're in demo mode
    const isDemoMode =
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      if (isDemoMode) {
        console.log("Demo mode: Simulating successful login");
        // For demo purposes, simulate a successful login
        setTimeout(() => {
          // Create a mock session
          const mockSession = {
            user: {
              id: "demo-user-id",
              email: email,
              user_metadata: { name: "Demo User" },
            },
            access_token: "demo-access-token",
            refresh_token: "demo-refresh-token",
          };

          setMessage({
            type: "success",
            text: "Demo mode: Successfully signed in!",
          });

          // Notify parent component about auth state change
          onAuthStateChange(mockSession);
          setLoading(false);

          // Navigate to home after successful sign in
          setTimeout(() => {
            navigate("/");
          }, 1500);
        }, 1500);
        return;
      }

      console.log("Attempting to sign in with Supabase:", { email });

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("Sign in response:", {
          data: data
            ? {
                user: data.user
                  ? {
                      id: data.user.id,
                      email: data.user.email,
                    }
                  : null,
                session: data.session ? "Session present" : "No session",
              }
            : "No data",
          error: error
            ? {
                message: error.message,
                status: error.status,
              }
            : "No error",
        });

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Successfully signed in!",
        });

        if (data.session) {
          console.log("Session created on sign in:", data.session.user.id);
          onAuthStateChange(data.session);
          // Navigate to home after successful sign in
          setTimeout(() => {
            navigate("/");
          }, 1500);
        }
      } catch (apiError: any) {
        throw apiError;
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      setMessage({
        type: "error",
        text: error.message || "An error occurred during sign in",
      });
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-xl">
          <UserCircle className="h-5 w-5 text-primary" />
          Authentication
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in or create an account to use Lightning Bolt Bug Zapper
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {message && (
          <Alert
            className={`mt-4 ${message.type === "success" ? "border-green-800/20 bg-green-900/10 text-green-400" : "border-destructive/20 bg-destructive/10"}`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default Auth;
