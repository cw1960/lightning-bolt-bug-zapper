import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import ApiKeySetup from "./components/ApiKeySetup";
import CompatibilityChecker from "./components/CompatibilityChecker";
import "./index.css";
import { Brain, Code, Zap } from "lucide-react";

// Use appropriate browser API
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

const Options = () => {
  const handleSaveKeys = (keys: {
    claude: string;
    gemini: string;
    defaultLLM: string;
  }) => {
    browserAPI.storage.sync.set(
      {
        claudeKey: keys.claude,
        geminiKey: keys.gemini,
        defaultLLM: keys.defaultLLM,
      },
      () => {
        console.log("API keys saved to Chrome storage");
      },
    );
  };

  const [initialKeys, setInitialKeys] = React.useState({
    claude: "",
    gemini: "",
    defaultLLM: "claude",
  });

  const [showCompatibility, setShowCompatibility] = useState(false);

  React.useEffect(() => {
    // Load saved keys from Chrome storage
    browserAPI.storage.sync.get(
      ["claudeKey", "geminiKey", "defaultLLM"],
      (result) => {
        console.log("Loaded keys from Chrome storage:", {
          claudeKey: result.claudeKey ? "[PRESENT]" : "[NOT FOUND]",
          geminiKey: result.geminiKey ? "[PRESENT]" : "[NOT FOUND]",
          defaultLLM: result.defaultLLM || "[NOT FOUND]",
        });

        setInitialKeys({
          claude: result.claudeKey || "",
          gemini: result.geminiKey || "",
          defaultLLM: result.defaultLLM || "claude",
        });
      },
    );
  }, []);

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center">
      <header className="w-full max-w-md mb-8 text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2 mb-2">
          <img src="/icons/icon48.png" alt="Logo" className="h-6 w-6" />
          Lightning Bolt Bug Zapper
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Configure your API keys for Claude and Gemini to use with the
          extension.
        </p>
      </header>

      <div className="w-full max-w-md mb-6 bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
        <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
          <Brain className="h-4 w-4" /> Getting Started
        </h2>
        <ol className="text-xs text-blue-600 list-decimal pl-5 space-y-2">
          <li>
            <strong>Claude API Key:</strong> Get your API key from{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800"
            >
              Anthropic Console
            </a>
          </li>
          <li>
            <strong>Gemini API Key:</strong> Get your API key from{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800"
            >
              Google AI Studio
            </a>
          </li>
          <li>
            <strong>Default Model:</strong> Select which model to use by default
            when generating fixes
          </li>
          <li>
            <strong>Save:</strong> Click the Save button when you're done to
            store your settings securely
          </li>
        </ol>
      </div>

      <main className="w-full max-w-md bg-background border border-border rounded-lg p-6 shadow-sm">
        <ApiKeySetup
          onSave={handleSaveKeys}
          initialKeys={initialKeys}
          showSuccessMessage={true}
        />
      </main>

      <div className="w-full max-w-md mt-6 bg-secondary/30 border border-border rounded-md p-4">
        <h2 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Code className="h-4 w-4" /> How to Use the Extension
        </h2>
        <ol className="text-xs text-muted-foreground list-decimal pl-5 space-y-2">
          <li>
            Click the extension icon when you encounter an error in Bolt.new
          </li>
          <li>Use the "Select Error Message" button to capture the error</li>
          <li>
            Use the "Select Code Block" button to capture the problematic code
          </li>
          <li>Choose your preferred AI model (Claude or Gemini)</li>
          <li>Click "Generate Fix" to get an AI-powered solution</li>
          <li>Review, edit if needed, and copy the fixed code</li>
        </ol>
      </div>

      <div className="w-full max-w-md mt-6 border-t pt-6">
        <button
          onClick={() => setShowCompatibility(!showCompatibility)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-4"
        >
          {showCompatibility
            ? "Hide Compatibility Info"
            : "Show Compatibility Info"}
        </button>

        {showCompatibility && <CompatibilityChecker />}
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>Lightning Bolt Bug Zapper v1.0</p>
        <p className="mt-1">
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Visit Bolt.new
          </a>
        </p>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
