import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import {
  Wand2,
  Settings,
  Zap,
  Brain,
  CreditCard,
  Lock,
  AlertTriangle,
} from "lucide-react";
import SelectionStage from "./SelectionStage";
import CapturedContent from "./CapturedContent";
import LLMSelector from "./LLMSelector";
import FixResult from "./FixResult";
import LoadingIndicator from "./LoadingIndicator";
import { useAuth } from "../lib/authContext";

interface ExtensionPopupProps {
  onClose?: () => void;
}

const ExtensionPopup = ({ onClose = () => {} }: ExtensionPopupProps) => {
  const { isSubscribed, freeTrialFixesUsed, incrementFreeTrialFixes } =
    useAuth();
  const FREE_TRIAL_LIMIT = 5;

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

  // State for license status
  const [licenseStatus, setLicenseStatus] = useState<{
    state: string;
    accessLevel: string;
  }>({ state: "FREE_TRIAL", accessLevel: "FREE_TRIAL" });

  // State for fixed code result
  const [fixedCode, setFixedCode] = useState<string>("");
  const [editedFixedCode, setEditedFixedCode] = useState<string>("");

  // State for error handling and messages
  const [errorState, setErrorState] = useState<{
    message: string;
    isVisible: boolean;
    type?: "success" | "error";
  }>({ message: "", isVisible: false, type: "error" });

  // Alias for better readability
  const setMessage = setErrorState;

  // Check if API keys are configured and license status
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

      // Check license status
      if (chrome.runtime) {
        chrome.runtime.sendMessage({ type: "CHECK_LICENSE" }, (response) => {
          if (response && response.success && response.licenseStatus) {
            setLicenseStatus(response.licenseStatus);
          }
        });
      }
    } else {
      // For development/demo, set to true
      setApiKeysConfigured(true);
      // For development/demo, simulate license status
      setLicenseStatus({ state: "FREE_TRIAL", accessLevel: "FREE_TRIAL" });
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
        } else if (message.type === "LICENSE_STATUS_UPDATED") {
          // Update license status when it changes
          setLicenseStatus(message.licenseStatus);
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
          chrome.tabs.sendMessage(activeTab.id, {
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
          chrome.tabs.sendMessage(activeTab.id, {
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

  const handlePurchaseLicense = () => {
    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "PURCHASE_LICENSE" }, (response) => {
        if (response && response.success) {
          if (response.url) {
            // Open Chrome Web Store in a new tab
            window.open(response.url, "_blank");
          }
          setMessage({
            type: "success",
            message:
              response.message ||
              "Please complete the purchase in the Chrome Web Store.",
            isVisible: true,
          });
        } else {
          setMessage({
            type: "error",
            message:
              response?.error ||
              "Failed to initiate purchase. Please try again.",
            isVisible: true,
          });
        }
      });
    } else {
      // Fallback for development/demo
      window.open(
        "https://chrome.google.com/webstore/detail/lightning-bolt-bug-zapper",
        "_blank",
      );
      setMessage({
        type: "success",
        message: "Demo mode: Redirecting to Chrome Web Store",
        isVisible: true,
      });
    }
  };

  const handleGenerateFix = () => {
    // Check if user has a premium license
    if (
      licenseStatus.state !== "ACTIVE" &&
      licenseStatus.accessLevel !== "FULL" &&
      licenseStatus.state !== "FREE_TRIAL"
    ) {
      setMessage({
        type: "error",
        message:
          "Your free trial has ended. Please purchase a license to continue using premium features.",
        isVisible: true,
      });
      // Show purchase dialog
      handlePurchaseLicense();
      return;
    }

    // Check if user is on free trial but has used up their quota
    if (licenseStatus.state === "FREE_TRIAL" && !isSubscribed) {
      if (freeTrialFixesUsed >= FREE_TRIAL_LIMIT) {
        setMessage({
          type: "error",
          message: `You've reached the limit of ${FREE_TRIAL_LIMIT} fixes in free trial mode. Please purchase a license to continue.`,
          isVisible: true,
        });
        // Show purchase dialog
        handlePurchaseLicense();
        return;
      }
    }

    // Show visual feedback before changing to processing stage
    const generateButton = document.querySelector(".generate-fix-button");
    if (generateButton) {
      generateButton.classList.add("animate-pulse");
      setTimeout(() => {
        setCurrentStage("processing");
      }, 300);
    } else {
      setCurrentStage("processing");
    }

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
            setEditedFixedCode(response.data); // Initialize edited code with the generated fix
            setCurrentStage("result");
            // Increment free trial usage if in free trial mode
            if (licenseStatus.state === "FREE_TRIAL" && !isSubscribed) {
              incrementFreeTrialFixes();
            }
            // Clear any previous error
            setErrorState({ message: "", isVisible: false });
          } else {
            // Handle error
            const errorMessage = response?.error || "Failed to generate fix";

            // Check if this is an API key error
            if (errorMessage.includes("INVALID_API_KEY")) {
              // Remove the prefix for display
              const cleanMessage = errorMessage.replace(
                "INVALID_API_KEY: ",
                "",
              );
              setErrorState({
                message: cleanMessage,
                isVisible: true,
              });
              // Automatically open options page for API key errors
              setTimeout(() => {
                if (typeof chrome !== "undefined" && chrome.runtime) {
                  chrome.runtime.openOptionsPage();
                }
              }, 1500);
            } else if (errorMessage.includes("PREMIUM_REQUIRED")) {
              // Premium license required error
              setErrorState({
                message:
                  "This feature requires a premium license. Please purchase a license to continue.",
                isVisible: true,
              });
            } else {
              setErrorState({ message: errorMessage, isVisible: true });
            }

            setCurrentStage("selection"); // Return to selection stage on error
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
        // Simulate API response - randomly show success or error for demo purposes
        const showError = Math.random() > 0.7; // 30% chance to show error in demo mode

        if (showError) {
          // Simulate an error response
          const errorMessages = [
            "Rate limit exceeded. Please try again in a few minutes.",
            "Invalid API key. Please update your API key in the extension settings.",
            "Network error when connecting to API. Please check your internet connection.",
            "API service is currently unavailable. Please try again later.",
          ];
          const randomError =
            errorMessages[Math.floor(Math.random() * errorMessages.length)];
          setErrorState({ message: randomError, isVisible: true });
          setCurrentStage("selection"); // Return to selection stage on error
        } else {
          // Simulate receiving a fixed code response
          const fixedCodeResponse = `const UserList = () => {\n  const [users, setUsers] = useState([]);\n\n  useEffect(() => {\n    fetchUsers().then(data => setUsers(data));\n  }, []);\n\n  return (\n    <div className="user-list">\n      <h2>User List</h2>\n      {users.map(user => (\n        <div key={user.id} className="user-item">\n          {user.name}\n        </div>\n      ))}\n    </div>\n  );\n};`;

          setFixedCode(fixedCodeResponse);
          setEditedFixedCode(fixedCodeResponse); // Initialize edited code with the generated fix
          setErrorState({ message: "", isVisible: false }); // Clear any errors
          setCurrentStage("result");

          // Increment free trial usage if in free trial mode
          if (licenseStatus.state === "FREE_TRIAL" && !isSubscribed) {
            incrementFreeTrialFixes();
          }
        }
      }, 2000);
    }
  };

  const handleUpdateFix = (updatedCode: string) => {
    setEditedFixedCode(updatedCode);
  };

  const handleCopyFix = () => {
    navigator.clipboard
      .writeText(editedFixedCode)
      .then(() => {
        console.log("Fix copied to clipboard");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  const handleSaveFix = (fixName: string, code: string) => {
    // In a real extension, this would save to Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get(["savedFixes"], (result) => {
        const savedFixes = result.savedFixes || [];
        const newFix = {
          id: Date.now().toString(),
          name: fixName,
          code: code,
          date: new Date().toISOString(),
        };

        chrome.storage.local.set(
          { savedFixes: [...savedFixes, newFix] },
          () => {
            console.log("Fix saved to Chrome storage");
            setMessage({
              type: "success",
              message: `Fix "${fixName}" saved successfully!`,
              isVisible: true,
            });

            setTimeout(() => {
              setMessage({ ...errorState, isVisible: false });
            }, 3000);
          },
        );
      });
    } else {
      // For development/demo
      console.log("Saving fix:", { name: fixName, code });
      setMessage({
        type: "success",
        message: `Demo mode: Fix "${fixName}" saved successfully!`,
        isVisible: true,
      });

      setTimeout(() => {
        setMessage({ ...errorState, isVisible: false });
      }, 3000);
    }
  };

  const handleReset = () => {
    // Reset all state to initial values
    setCurrentStage("selection");
    setIsErrorSelected(false);
    setIsCodeSelected(false);
    setErrorMessage("");
    setCodeSchema("");
    setFixedCode("");
    setEditedFixedCode("");
    setErrorState({ message: "", isVisible: false });
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
          <img src="/icons/icon16.png" alt="Logo" className="h-5 w-5" />
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
        {/* License Status Banner */}
        {licenseStatus.state !== "ACTIVE" &&
          licenseStatus.accessLevel !== "FULL" && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {licenseStatus.state === "FREE_TRIAL"
                      ? "Free Trial Mode"
                      : "License Required"}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {licenseStatus.state === "FREE_TRIAL"
                      ? `${freeTrialFixesUsed}/${FREE_TRIAL_LIMIT} fixes used. Upgrade to unlock unlimited fixes.`
                      : "Your trial has ended. Purchase a license to continue using premium features."}
                  </p>
                  {licenseStatus.state === "FREE_TRIAL" &&
                    freeTrialFixesUsed >= FREE_TRIAL_LIMIT - 1 && (
                      <p className="text-xs flex items-center gap-1 text-red-500 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        {freeTrialFixesUsed >= FREE_TRIAL_LIMIT
                          ? "Trial limit reached! Purchase to continue."
                          : "Only 1 fix remaining in your trial!"}
                      </p>
                    )}
                </div>
                <Button
                  size="sm"
                  onClick={handlePurchaseLicense}
                  className="flex items-center gap-1"
                >
                  <CreditCard className="h-3 w-3" />
                  {licenseStatus.state === "FREE_TRIAL"
                    ? "Upgrade"
                    : "Purchase"}
                </Button>
              </div>
            </div>
          )}

        {!apiKeysConfigured ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
            <Wand2 className="h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              Please configure your API keys in the extension settings to get
              started.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-3">
              <p className="text-sm text-blue-600 font-medium">
                Getting Started:
              </p>
              <ol className="text-xs text-blue-600 list-decimal pl-5 mt-1 space-y-1">
                <li>Click the button below to open settings</li>
                <li>Enter your Claude and/or Gemini API keys</li>
                <li>Select your preferred default model</li>
                <li>Return to this popup to start fixing bugs</li>
              </ol>
            </div>
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

            {/* Always show CapturedContent with guidance messages when nothing is selected */}
            <CapturedContent
              errorMessage={isErrorSelected ? errorMessage : undefined}
              codeSchema={isCodeSelected ? codeSchema : undefined}
            />

            <Separator className="my-4" />

            {errorState.isVisible && (
              <div
                className={`bg-${errorState.type === "success" ? "green" : "destructive"}/15 border border-${errorState.type === "success" ? "green" : "destructive"} text-${errorState.type === "success" ? "green" : "destructive"}-600 px-4 py-3 rounded-md mb-4`}
              >
                <p className="text-sm font-medium">
                  {errorState.type === "success" ? "Success" : "Error"}:{" "}
                  {errorState.message}
                </p>
              </div>
            )}

            <LLMSelector
              selectedLLM={selectedLLM}
              onLLMChange={handleLLMChange}
            />

            <Button
              className="w-full relative generate-fix-button"
              size="lg"
              onClick={handleGenerateFix}
              disabled={
                !isErrorSelected ||
                !isCodeSelected ||
                (licenseStatus.state === "FREE_TRIAL" &&
                  freeTrialFixesUsed >= FREE_TRIAL_LIMIT)
              }
              variant={
                isErrorSelected && isCodeSelected ? "default" : "outline"
              }
            >
              {!isErrorSelected && !isCodeSelected ? (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Select Error and Code to Continue
                </span>
              ) : !isErrorSelected ? (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Select Error Message to Continue
                </span>
              ) : !isCodeSelected ? (
                <span className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  Select Code Block to Continue
                </span>
              ) : licenseStatus.state === "FREE_TRIAL" &&
                freeTrialFixesUsed >= FREE_TRIAL_LIMIT ? (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Trial Limit Reached
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 mr-1" />
                  Generate Fix
                </span>
              )}
            </Button>

            {(!isErrorSelected || !isCodeSelected) && (
              <div className="bg-secondary/50 border border-border rounded-md p-3 mt-3">
                <p className="text-xs text-foreground font-medium text-center">
                  Workflow Steps:
                </p>
                <ol className="text-xs text-muted-foreground list-decimal pl-5 mt-1 space-y-1">
                  <li
                    className={
                      isErrorSelected ? "line-through text-green-500" : ""
                    }
                  >
                    Select error message on the page
                  </li>
                  <li
                    className={
                      isCodeSelected
                        ? "line-through text-green-500"
                        : isErrorSelected
                          ? ""
                          : "text-muted-foreground/50"
                    }
                  >
                    Select code block on the page
                  </li>
                  <li
                    className={
                      isErrorSelected && isCodeSelected
                        ? ""
                        : "text-muted-foreground/50"
                    }
                  >
                    Choose AI model and generate fix
                  </li>
                  <li className="text-muted-foreground/50">
                    Review, edit, and copy the solution
                  </li>
                </ol>
              </div>
            )}
          </>
        ) : currentStage === "processing" ? (
          <>
            <div className="mb-4 bg-secondary/30 border border-border rounded-md p-3">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                {selectedLLM === "claude" ? (
                  <Zap className="h-4 w-4 text-purple-600" />
                ) : (
                  <Brain className="h-4 w-4 text-blue-600" />
                )}
                {selectedLLM === "claude" ? "Claude 3.7" : "Gemini 2.5"} is
                analyzing your code
              </h3>
              <p className="text-xs text-muted-foreground">
                The AI is examining your error message and code to identify the
                root cause and generate an optimal fix.
              </p>
            </div>
            <LoadingIndicator
              message={`Processing with ${selectedLLM === "claude" ? "Claude 3.7" : "Gemini 2.5"}`}
              isLoading={true}
            />
          </>
        ) : (
          <>
            <FixResult
              fixedCode={editedFixedCode}
              onCopyFix={handleCopyFix}
              onUpdateFix={handleUpdateFix}
              onSaveFix={handleSaveFix}
            />

            <div className="mt-4 space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3">
                <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Fix Generated Successfully
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Review the solution above, make any needed adjustments, and
                  copy it to your clipboard.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 flex items-center gap-2"
                  onClick={handleReset}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M1.84998 7.49998C1.84998 4.66458 4.05979 2.34998 6.89998 2.34998C9.74017 2.34998 11.95 4.66458 11.95 7.49998C11.95 10.3354 9.74017 12.65 6.89998 12.65C5.32952 12.65 3.92047 11.9429 2.96235 10.8145"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                    <path
                      d="M0.949951 5.09998L1.74995 7.49998L4.14995 6.69998"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                  Start Over
                </Button>
                <div className="flex-1 flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 flex items-center gap-2"
                    onClick={handlePurchaseLicense}
                  >
                    <CreditCard className="h-4 w-4" />
                    {licenseStatus.state === "ACTIVE"
                      ? "Manage License"
                      : "Get License"}
                  </Button>
                  <Button
                    className="flex-1 flex items-center gap-2"
                    onClick={() => window.open("https://bolt.new", "_blank")}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                    >
                      <path
                        d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3L6.5 3C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    Go to Bolt.new
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-secondary/30 p-2 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Lightning Bolt Bug Zapper v1.0 •
          {licenseStatus.state === "ACTIVE" ? (
            <span className="text-green-500 font-medium">Premium License</span>
          ) : licenseStatus.state === "FREE_TRIAL" ? (
            <span>
              {freeTrialFixesUsed}/{FREE_TRIAL_LIMIT} Free Trial Fixes Used
            </span>
          ) : (
            <span className="text-amber-500 font-medium">License Required</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default ExtensionPopup;
