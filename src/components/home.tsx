import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Zap, Settings, Info, CreditCard } from "lucide-react";
import ExtensionPopup from "./ExtensionPopup";
import SelectionOverlay from "./SelectionOverlay";
import ApiKeySetup from "./ApiKeySetup";
import Payment from "./Payment";
import UserMenu from "./UserMenu";
import { useAuth } from "../lib/authContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("extension");
  const [selectionOverlayActive, setSelectionOverlayActive] = useState(false);
  const [selectionType, setSelectionType] = useState<"error" | "code">("error");

  // Simulate selection overlay activation
  const handleActivateSelectionOverlay = (type: "error" | "code") => {
    setSelectionType(type);
    setSelectionOverlayActive(true);
  };

  // Handle selection from overlay
  const handleSelection = (content: string, element: HTMLElement) => {
    console.log(`Selected ${selectionType}:`, content);
    setSelectionOverlayActive(false);
  };

  // Cancel selection
  const handleCancelSelection = () => {
    setSelectionOverlayActive(false);
  };

  // Navigate to subscription page
  const handleOpenSubscription = () => {
    navigate("/payment");
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <img src="/icons/icon48.png" alt="Logo" className="h-8 w-8" />
            Lightning Bolt Bug Zapper
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Quickly capture error messages and code schemas from Bolt.new, then
            leverage powerful LLMs to generate fixes with minimal clicks.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {!isSubscribed && (
            <Button
              onClick={handleOpenSubscription}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade to Pro
            </Button>
          )}
          <UserMenu
            onOpenSettings={() => setActiveTab("setup")}
            onOpenSubscription={handleOpenSubscription}
          />
        </div>
      </header>

      <main className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-1/2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Extension Demo</CardTitle>
              <CardDescription>
                This simulates how the Chrome extension would appear when
                activated.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center p-6 bg-secondary/30 rounded-b-lg">
              <ExtensionPopup />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selection Overlay Demo</CardTitle>
              <CardDescription>
                Click the buttons below to simulate the element selection mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => handleActivateSelectionOverlay("error")}
                  variant="outline"
                  className="flex-1 border-red-200 hover:bg-red-50"
                >
                  Simulate Error Selection
                </Button>
                <Button
                  onClick={() => handleActivateSelectionOverlay("code")}
                  variant="outline"
                  className="flex-1 border-blue-200 hover:bg-blue-50"
                >
                  Simulate Code Selection
                </Button>
              </div>
              <div className="bg-secondary/30 p-4 rounded-lg text-sm text-muted-foreground">
                <p>
                  When activated in the real extension, users can click directly
                  on error messages and code blocks in Bolt.new to capture them
                  without manual copying.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-1/2 space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="setup">
                <Settings className="h-4 w-4 mr-2" />
                API Setup
              </TabsTrigger>
              <TabsTrigger value="subscription">
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="about">
                <Info className="h-4 w-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="setup" className="space-y-4">
              <ApiKeySetup />
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Payment userId={user?.id} />
            </TabsContent>

            <TabsContent value="about" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About Lightning Bolt Bug Zapper</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Lightning Bolt Bug Zapper is a Chrome extension designed to
                    help developers quickly fix errors in Bolt.new by:
                  </p>

                  <ul className="list-disc pl-5 space-y-2">
                    <li>Capturing error messages with a single click</li>
                    <li>Selecting code blocks directly from the page</li>
                    <li>
                      Leveraging powerful LLMs (Claude 3.7 or Gemini 2.5) to
                      generate fixes
                    </li>
                    <li>
                      Providing a streamlined workflow with minimal interaction
                    </li>
                  </ul>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">How It Works:</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>
                        Click the extension icon when you encounter an error
                      </li>
                      <li>
                        Use the selection tools to capture the error message and
                        code
                      </li>
                      <li>Choose your preferred LLM provider</li>
                      <li>Generate a fix with a single click</li>
                      <li>Copy the corrected code to your clipboard</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-900/10 rounded-lg">
                  <h3 className="font-medium mb-2">Element Selection UI</h3>
                  <p className="text-sm">
                    Click directly on error messages and code blocks to capture
                    them without manual copying
                  </p>
                </div>

                <div className="p-4 bg-green-900/10 rounded-lg">
                  <h3 className="font-medium mb-2">Streamlined Workflow</h3>
                  <p className="text-sm">
                    Simple popup interface guides users through the entire error
                    fixing process
                  </p>
                </div>

                <div className="p-4 bg-purple-900/10 rounded-lg">
                  <h3 className="font-medium mb-2">Background Processing</h3>
                  <p className="text-sm">
                    Service worker handles API calls to selected LLM using
                    securely stored API keys
                  </p>
                </div>

                <div className="p-4 bg-yellow-900/10 rounded-lg">
                  <h3 className="font-medium mb-2">Minimal Interaction</h3>
                  <p className="text-sm">
                    Eliminates manual screenshots, copying/pasting, and prompt
                    writing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Selection overlay for demonstration */}
      {selectionOverlayActive && (
        <SelectionOverlay
          isActive={selectionOverlayActive}
          selectionType={selectionType}
          onSelect={handleSelection}
          onCancel={handleCancelSelection}
        />
      )}
    </div>
  );
};

export default Home;
