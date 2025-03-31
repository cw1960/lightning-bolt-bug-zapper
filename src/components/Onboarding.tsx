import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2, User, Key } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/authContext";

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Check if we're in demo mode
  const isDemoMode =
    !import.meta.env.VITE_SUPABASE_URL ||
    !import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!firstName) {
      setMessage({
        type: "error",
        text: "Please enter your first name",
      });
      setLoading(false);
      return;
    }

    if (!claudeApiKey && !geminiApiKey) {
      setMessage({
        type: "error",
        text: "Please enter at least one API key",
      });
      setLoading(false);
      return;
    }

    try {
      if (isDemoMode) {
        // For demo purposes, simulate successful data storage
        setTimeout(() => {
          // Store in local storage for demo
          localStorage.setItem("firstName", firstName);
          if (claudeApiKey) localStorage.setItem("claudeApiKey", claudeApiKey);
          if (geminiApiKey) localStorage.setItem("geminiApiKey", geminiApiKey);

          setMessage({
            type: "success",
            text: "Information saved successfully!",
          });

          // Wait 1.5 seconds then redirect to home
          setTimeout(() => {
            navigate("/");
          }, 1500);
        }, 1000);
        return;
      }

      // Production mode - store in Supabase
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { firstName },
      });

      if (updateError) throw updateError;

      // Store API keys in user_settings table
      const { error: settingsError } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            claude_api_key: claudeApiKey || null,
            gemini_api_key: geminiApiKey || null,
          },
          { onConflict: "user_id" },
        );

      if (settingsError) throw settingsError;

      setMessage({
        type: "success",
        text: "Information saved successfully!",
      });

      // Wait 1.5 seconds then redirect to home
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      console.error("Onboarding error:", error);
      setMessage({
        type: "error",
        text:
          error.message || "An error occurred while saving your information",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md mx-auto bg-card border-border">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <User className="h-5 w-5 text-primary" />
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Just a few more details to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name (Display Name)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 pb-1">
              <p className="text-sm text-muted-foreground">
                Enter at least one API key to use the extension:
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="claudeApiKey" className="flex items-center gap-1">
                <span>Anthropic Claude API Key</span>
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="claudeApiKey"
                type="password"
                placeholder="sk-ant-api..."
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your key at{" "}
                <a
                  href="https://console.anthropic.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  console.anthropic.com/keys
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geminiApiKey" className="flex items-center gap-1">
                <span>Google Gemini API Key</span>
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="geminiApiKey"
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your key at{" "}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  aistudio.google.com/app/apikey
                </a>
              </p>
            </div>

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

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? "Saving..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
