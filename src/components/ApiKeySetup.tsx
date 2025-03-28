import React, { useState } from "react";
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
import { AlertCircle, CheckCircle2, Key, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";

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
  const [claudeKey, setClaudeKey] = useState(initialKeys.claude);
  const [geminiKey, setGeminiKey] = useState(initialKeys.gemini);
  const [defaultLLM, setDefaultLLM] = useState<string>(initialKeys.defaultLLM);
  const [isSaved, setIsSaved] = useState(showSuccessMessage);
  const [isError, setIsError] = useState(false);

  const handleSave = () => {
    if (!claudeKey && !geminiKey) {
      setIsError(true);
      return;
    }

    setIsError(false);
    setIsSaved(true);
    onSave({ claude: claudeKey, gemini: geminiKey, defaultLLM });

    // Reset success message after 3 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-bolt-500" />
          API Key Setup
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your API keys for Claude and Gemini to use with the Lightning
          Bolt Bug Zapper.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="claude-key" className="text-sm font-medium">
            Claude 3.7 API Key
          </Label>
          <Input
            id="claude-key"
            type="password"
            placeholder="Enter your Anthropic API key"
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            className="bg-secondary/50 border-input focus:border-bolt-500 focus:ring-bolt-500/20"
          />
          <p className="text-xs text-muted-foreground">
            Get your key at{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bolt-400 hover:text-bolt-300"
            >
              console.anthropic.com
            </a>
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gemini-key" className="text-sm font-medium">
            Gemini 2.5 API Key
          </Label>
          <Input
            id="gemini-key"
            type="password"
            placeholder="Enter your Google AI API key"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="bg-secondary/50 border-input focus:border-bolt-500 focus:ring-bolt-500/20"
          />
          <p className="text-xs text-muted-foreground">
            Get your key at{" "}
            <a
              href="https://ai.google.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bolt-400 hover:text-bolt-300"
            >
              ai.google.dev
            </a>
          </p>
        </div>
        <div className="space-y-2 pt-2">
          <Label className="text-sm font-medium">Default LLM Provider</Label>
          <RadioGroup
            value={defaultLLM}
            onValueChange={setDefaultLLM}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2 rounded-md p-2 hover:bg-secondary/50 transition-colors">
              <RadioGroupItem
                value="claude"
                id="claude"
                disabled={!claudeKey}
                className="border-input text-bolt-500"
              />
              <Label
                htmlFor="claude"
                className={cn(
                  "cursor-pointer",
                  !claudeKey && "text-muted-foreground opacity-50",
                )}
              >
                Claude 3.7
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md p-2 hover:bg-secondary/50 transition-colors">
              <RadioGroupItem
                value="gemini"
                id="gemini"
                disabled={!geminiKey}
                className="border-input text-bolt-500"
              />
              <Label
                htmlFor="gemini"
                className={cn(
                  "cursor-pointer",
                  !geminiKey && "text-muted-foreground opacity-50",
                )}
              >
                Gemini 2.5
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
          <Alert className="mt-4 border-green-800/20 bg-green-900/10 text-green-400">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>API keys saved successfully!</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          className="w-full bg-bolt-600 hover:bg-bolt-700 text-white"
        >
          Save API Keys
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySetup;
