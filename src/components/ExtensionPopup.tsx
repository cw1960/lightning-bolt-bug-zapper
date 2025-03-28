import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Wand2, Settings, Zap } from "lucide-react";
import SelectionStage from "./SelectionStage";
import CapturedContent from "./CapturedContent";
import LLMSelector from "./LLMSelector";
import FixResult from "./FixResult";
import LoadingIndicator from "./LoadingIndicator";

interface ExtensionPopupProps {
  onClose?: () => void;
}

const ExtensionPopup = ({ onClose = () => {} }: ExtensionPopupProps) => {
  // State for tracking the current workflow stage
  const [currentStage, setCurrentStage] = useState<
    "selection" | "processing" | "result"
  >("selection");

  // State for tracking selection status
  const [isErrorSelected, setIsErrorSelected] = useState(false);
  const [isCodeSelected, setIsCodeSelected] = useState(false);

  // State for captured content
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [codeSchema, setCodeSchema] = useState<string>("");

  // State for LLM selection
  const [selectedLLM, setSelectedLLM] = useState<string>("claude");
  const [apiKeysConfigured, setApiKeysConfigured] = useState<boolean>(false);

  // State for fixed code result
  const [fixedCode, setFixedCode] = useState<string>("");

  // Check if API keys are configured
  useEffect(() => {
    // In a real extension, this would check Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(
        ["claudeKey", "geminiKey", "defaultLLM"],
        (result) => {
          const hasClaudeKey = !!result.claudeKey;
          const hasGeminiKey = !!result.geminiKey;
          setApiKeysConfigured(hasClaudeKey || hasGeminiKey);

          if (result.defaultLLM) {
            setSelectedLLM(result.defaultLLM);
          } else if (hasClaudeKey) {
            setSelectedLLM("claude");
          } else if (hasGeminiKey) {
            setSelectedLLM("gemini");
          }
        },
      );
    }
  }, []);

  // Listen for messages from content script
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      const messageListener = (message: any) => {
        if (message.type === "SELECTION_COMPLETE") {
          if (message.selectionType === "error") {
            setErrorMessage(message.content);
            setIsErrorSelected(true);
          } else if (message.selectionType === "code") {
            setCodeSchema(message.content);
            setIsCodeSelected(true);
          }
        } else if (message.type === "SELECTION_CANCELLED") {
          // Do nothing, user cancelled selection
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);

      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, []);

  // Handlers for selection buttons
  const handleSelectError = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
          chrome.runtime.sendMessage({
            type: "ACTIVATE_SELECTION",
            selectionType: "error",
          });
        }
      });
    } else {
      // Fallback for development/demo
      console.log("Selecting error message...");
      setTimeout(() => {
        setErrorMessage(
          "TypeError: Cannot read properties of undefined (reading 'map')\nAt line 15 in UserList component",
        );
        setIsErrorSelected(true);
      }, 500);
    }
  };

  const handleSelectCode = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
          chrome.runtime.sendMessage({
            type: "ACTIVATE_SELECTION",
            selectionType: "code",
          });
        }
      });
    } else {
      // Fallback for development/demo
      console.log("Selecting code schema...");
      setTimeout(() => {
        setCodeSchema(
          `const UserList = () => {\n  const [users, setUsers] = useState();\n\n  useEffect(() => {\n    fetchUsers().then(data => setUsers(data));\n  }, []);\n\n  return (\n    <div className="user-list">\n      <h2>User List</h2>\n      {users.map(user => (\n        <div key={user.id} className="user-item">\n          {user.name}\n        </div>\n      ))}\n    </div>\n  );\n};`,
        );
        setIsCodeSelected(true);
      }, 500);
    }
  };

  const handleLLMChange = (llm: string) => {
    setSelectedLLM(llm);
  };

  const handleGenerateFix = () => {
    // Change to processing stage
    setCurrentStage("processing");

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          type: "GENERATE_FIX",
          data: {
            errorMessage,
            codeSchema,
            selectedLLM,
          },
        },
        (response) => {
          if (response && response.success) {
            setFixedCode(response.data);
            setCurrentStage("result");
          } else {
            // Handle error
            setFixedCode(
              `Error: ${response?.error || "Failed to generate fix"}`,
            );
            setCurrentStage("result");
          }
        },
      );
    } else {
      // Fallback for development/demo
      console.log(`Generating fix using ${selectedLLM}...`);
      console.log("Error message:", errorMessage);
      console.log("Code schema:", codeSchema);

      // Simulate API call delay
      setTimeout(() => {
        // Simulate receiving a fixed code response
        setFixedCode(
          `const UserList = () => {\n  const [users, setUsers] = useState([]);\n\n  useEffect(() => {\n    fetchUsers().then(data => setUsers(data));\n  }, []);\n\n  return (\n    <div className="user-list">\n      <h2>User List</h2>\n      {users.map(user => (\n        <div key={user.id} className="user-item">\n          {user.name}\n        </div>\n      ))}\n    </div>\n  );\n};`,
        );

        // Change to result stage
        setCurrentStage("result");
      }, 3000);
    }
  };

  const handleCopyFix = () => {
    navigator.clipboard
      .writeText(fixedCode)
      .then(() => {
        console.log("Fix copied to clipboard");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  const handleReset = () => {
    // Reset all state to initial values
    setCurrentStage("selection");
    setIsErrorSelected(false);
    setIsCodeSelected(false);
    setErrorMessage("");
    setCodeSchema("");
    setFixedCode("");
  };

  const openOptionsPage = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open("/options.html", "_blank");
    }
  };

  return (
    <div className="extension-popup bg-background rounded-lg border border-border overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-secondary/30 p-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-bolt-500" />
          <h2 className="text-base font-semibold text-foreground">
            Lightning Bolt Bug Zapper
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={openOptionsPage}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="extension-popup-content p-4 space-y-4">
        {!apiKeysConfigured ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
            <Wand2 className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Please configure your API keys in the extension settings to get
              started.
            </p>
            <Button onClick={openOptionsPage}>Configure API Keys</Button>
          </div>
        ) : currentStage === "selection" ? (
          <>
            <SelectionStage
              onSelectError={handleSelectError}
              onSelectCode={handleSelectCode}
              isErrorSelected={isErrorSelected}
              isCodeSelected={isCodeSelected}
            />

            {(isErrorSelected || isCodeSelected) && (
              <CapturedContent
                errorMessage={isErrorSelected ? errorMessage : undefined}
                codeSchema={isCodeSelected ? codeSchema : undefined}
              />
            )}

            {isErrorSelected && isCodeSelected && (
              <>
                <Separator />
                <LLMSelector
                  selectedLLM={selectedLLM}
                  onLLMChange={handleLLMChange}
                />

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateFix}
                >
                  Generate Fix
                </Button>
              </>
            )}
          </>
        ) : currentStage === "processing" ? (
          <LoadingIndicator
            message={`Processing with ${selectedLLM === "claude" ? "Claude 3.7" : "Gemini 2.5"}...`}
            isLoading={true}
          />
        ) : (
          <>
            <FixResult fixedCode={fixedCode} onCopyFix={handleCopyFix} />

            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Start Over
              </Button>
              <Button
                className="flex-1"
                onClick={() => window.open("https://bolt.new", "_blank")}
              >
                Go to Bolt.new
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-secondary/30 p-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Lightning Bolt Bug Zapper v1.0 • Capture errors and fix them with AI
        </p>
      </div>
    </div>
  );
};

export default ExtensionPopup;
