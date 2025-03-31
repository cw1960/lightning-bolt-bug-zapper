import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { cn } from "../lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Key,
  Sparkles,
  Zap,
  Brain,
  Info,
} from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/authContext";

interface ApiKeySetupProps {
  onSave?: (keys: {
    claude: string;
    gemini: string;
    defaultLLM: string;
  }) => void;
  initialKeys?: {
    claude: string;
    gemini: string;
    defaultLLM: string;
  };
  showSuccessMessage?: boolean;
}

const ApiKeySetup = ({
  onSave = () => {},
  initialKeys = {
    claude: "",
    gemini: "",
    defaultLLM: "claude",
  },
  showSuccessMessage = false,
}: ApiKeySetupProps) => {
  const { user } = useAuth();
  const [claudeKey, setClaudeKey] = useState(initialKeys.claude);
  const [geminiKey, setGeminiKey] = useState(initialKeys.gemini);
  const [defaultLLM, setDefaultLLM] = useState<string>(initialKeys.defaultLLM);
  const [isSaved, setIsSaved] = useState(showSuccessMessage);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load API keys from database if user is logged in
  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      console.log("Loading API keys for user:", user?.id);

      // Check if we're in demo mode
      const isDemoMode =
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (isDemoMode) {
        console.log("Demo mode: Using local storage for API keys");
        const claudeKeyFromStorage = localStorage.getItem("claudeApiKey") || "";
        const geminiKeyFromStorage = localStorage.getItem("geminiApiKey") || "";
        const defaultModelFromStorage =
          localStorage.getItem("defaultLLM") || "claude";

        setClaudeKey(claudeKeyFromStorage);
        setGeminiKey(geminiKeyFromStorage);
        setDefaultLLM(defaultModelFromStorage);
        return;
      }

      // Production mode - load from Supabase
      const { data, error } = await supabase
        .from("api_keys")
        .select("provider, api_key")
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error loading API keys:", error);
        return;
      }

      if (data && data.length > 0) {
        console.log("API keys loaded:", data.length);

        // Find Claude and Gemini keys
        const claudeKeyData = data.find((key) => key.provider === "claude");
        const geminiKeyData = data.find((key) => key.provider === "gemini");

        if (claudeKeyData) setClaudeKey(claudeKeyData.api_key);
        if (geminiKeyData) setGeminiKey(geminiKeyData.api_key);

        // Set default LLM based on available keys
        if (claudeKeyData) {
          setDefaultLLM("claude");
        } else if (geminiKeyData) {
          setDefaultLLM("gemini");
        }
      } else {
        console.log("No API keys found for user");
      }
    } catch (error) {
      console.error("Error in loadApiKeys:", error);
    }
  };

  const handleSave = async () => {
    if (!claudeKey && !geminiKey) {
      setIsError(true);
      return;
    }

    setIsError(false);
    setLoading(true);

    try {
      // Check if we're in demo mode
      const isDemoMode =
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (isDemoMode || !user) {
        // For demo purposes, store in localStorage
        if (claudeKey) localStorage.setItem("claudeApiKey", claudeKey);
        if (geminiKey) localStorage.setItem("geminiApiKey", geminiKey);
        localStorage.setItem("defaultLLM", defaultLLM);

        console.log("Demo mode: Saved API keys to localStorage");

        // Call the onSave callback
        onSave({
          claude: claudeKey,
          gemini: geminiKey,
          defaultLLM,
        });

        setIsSaved(true);
        setLoading(false);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setIsSaved(false);
        }, 3000);

        return;
      }

      // Production mode - save to Supabase
      console.log("Saving API keys to Supabase for user:", user.id);

      // First, delete existing keys for this user
      const { error: deleteError } = await supabase
        .from("api_keys")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting existing API keys:", deleteError);
        throw deleteError;
      }

      // Insert new keys if provided
      const keysToInsert = [];

      if (claudeKey) {
        keysToInsert.push({
          user_id: user.id,
          provider: "claude",
          api_key: claudeKey,
        });
      }

      if (geminiKey) {
        keysToInsert.push({
          user_id: user.id,
          provider: "gemini",
          api_key: geminiKey,
        });
      }

      if (keysToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("api_keys")
          .insert(keysToInsert);

        if (insertError) {
          console.error("Error inserting API keys:", insertError);
          throw insertError;
        }
      }

      // Save default LLM preference to user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { defaultLLM },
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        throw updateError;
      }

      console.log("API keys saved successfully");

      // Call the onSave callback
      onSave({
        claude: claudeKey,
        gemini: geminiKey,
        defaultLLM,
      });

      setIsSaved(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error saving API keys:", error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          API Key Setup
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your API keys for Claude and Gemini to use with the Lightning
          Bolt Bug Zapper.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label
              htmlFor="claude-key"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Zap className="h-4 w-4 text-purple-600" />
              Claude API Key
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Get your Claude API key from the Anthropic Console
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Key className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="claude-key"
              type="password"
              placeholder="Enter your Anthropic API key"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              className="pl-8 bg-secondary/50 border-input focus:border-primary focus:ring-primary/20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Get your key at{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              console.anthropic.com
            </a>
          </p>
          {claudeKey.trim() !== "" && (
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Claude API key provided
            </p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label
              htmlFor="gemini-key"
              className="text-sm font-medium flex items-center gap-2"
            >
              <Brain className="h-4 w-4 text-blue-600" />
              Gemini API Key
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Get your Gemini API key from Google AI Studio
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Key className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="gemini-key"
              type="password"
              placeholder="Enter your Google AI API key"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="pl-8 bg-secondary/50 border-input focus:border-primary focus:ring-primary/20"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Get your key at{" "}
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              ai.google.dev
            </a>
          </p>
          {geminiKey.trim() !== "" && (
            <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Gemini API key provided
            </p>
          )}
        </div>
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-medium">Default LLM Provider</Label>
          <RadioGroup
            value={defaultLLM}
            onValueChange={setDefaultLLM}
            className="flex flex-col space-y-2"
          >
            <div
              className={`flex items-center space-x-2 rounded-md border p-2 hover:bg-secondary/50 transition-colors ${defaultLLM === "claude" ? "bg-secondary/50 border-primary/50" : ""} ${claudeKey.trim() === "" ? "opacity-50" : ""}`}
            >
              <RadioGroupItem
                value="claude"
                id="claude"
                disabled={!claudeKey}
                className="border-input text-primary"
              />
              <Label
                htmlFor="claude"
                className={cn(
                  "flex items-center cursor-pointer w-full",
                  !claudeKey && "text-muted-foreground opacity-50",
                )}
              >
                <Zap className="h-4 w-4 mr-2 text-purple-600" />
                <span>Claude 3.7</span>
              </Label>
            </div>

            <div
              className={`flex items-center space-x-2 rounded-md border p-2 hover:bg-secondary/50 transition-colors ${defaultLLM === "gemini" ? "bg-secondary/50 border-primary/50" : ""} ${geminiKey.trim() === "" ? "opacity-50" : ""}`}
            >
              <RadioGroupItem
                value="gemini"
                id="gemini"
                disabled={!geminiKey}
                className="border-input text-primary"
              />
              <Label
                htmlFor="gemini"
                className={cn(
                  "flex items-center cursor-pointer w-full",
                  !geminiKey && "text-muted-foreground opacity-50",
                )}
              >
                <Brain className="h-4 w-4 mr-2 text-blue-600" />
                <span>Gemini 2.5</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {isError && (
          <Alert
            variant="destructive"
            className="mt-4 border-destructive/20 bg-destructive/10"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please enter at least one API key to continue.
            </AlertDescription>
          </Alert>
        )}

        {isSaved && (
          <Alert className="mt-4 border-green-800/20 bg-green-900/10 text-green-400 animate-in fade-in slide-in-from-top-5 duration-300">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <div>
                <p className="font-medium">API keys saved successfully!</p>
                <p className="text-xs">
                  Your keys are securely stored in Chrome storage.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          className="w-full relative group"
          disabled={(!claudeKey && !geminiKey) || loading}
        >
          <span className="flex items-center gap-2">
            {(claudeKey || geminiKey) && !loading && (
              <span className="absolute left-0 inset-y-0 flex items-center justify-center w-8 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            )}
            <span>{loading ? "Saving..." : "Save API Keys"}</span>
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySetup;
