import React from "react";
import ReactDOM from "react-dom/client";
import ApiKeySetup from "./components/ApiKeySetup";
import "./index.css";

const Options = () => {
  const handleSaveKeys = (keys: {
    claude: string;
    gemini: string;
    defaultLLM: string;
  }) => {
    chrome.storage.sync.set(
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

  React.useEffect(() => {
    // Load saved keys from Chrome storage
    chrome.storage.sync.get(
      ["claudeKey", "geminiKey", "defaultLLM"],
      (result) => {
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
          Lightning Bolt Bug Zapper
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Configure your API keys for Claude and Gemini to use with the
          extension.
        </p>
      </header>

      <main className="w-full max-w-md">
        <ApiKeySetup
          onSave={handleSaveKeys}
          initialKeys={initialKeys}
          showSuccessMessage={false}
        />
      </main>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>Lightning Bolt Bug Zapper v1.0</p>
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>,
);
