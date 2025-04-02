import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { CheckCircle2, MousePointer, Code, Zap } from "lucide-react";

const Instructions = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center">
      <Card className="w-full max-w-3xl bg-card border-border">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">You're All Set!</CardTitle>
          <CardDescription className="text-muted-foreground">
            Thank you for subscribing to Lightning Bolt Bug Zapper. Here's how
            to use the extension.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-secondary/30 rounded-lg p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm font-bold">
                  1
                </span>
                Capture Error Messages
              </h3>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  When you encounter an error in Bolt.new, click the extension
                  icon in your browser toolbar.
                </p>
                <div className="flex items-center gap-2 bg-blue-500/10 p-3 rounded-md">
                  <MousePointer className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-blue-600">
                    Click "Select Error Message" and then click on the error in
                    the page
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm font-bold">
                  2
                </span>
                Capture Code Blocks
              </h3>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  After capturing the error, you need to select the code that's
                  causing the issue.
                </p>
                <div className="flex items-center gap-2 bg-blue-500/10 p-3 rounded-md">
                  <Code className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-blue-600">
                    Click "Select Code Block" and then click on the problematic
                    code
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm font-bold">
                  3
                </span>
                Generate and Apply Fixes
              </h3>
              <div className="ml-8 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Once both error and code are captured, you can generate an
                  AI-powered fix.
                </p>
                <div className="flex items-center gap-2 bg-green-500/10 p-3 rounded-md">
                  <Zap className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-green-600">
                    Click "Generate Fix", review the solution, and copy it to
                    your clipboard
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-600 mb-2">
              Pro Tips:
            </h4>
            <ul className="text-xs text-blue-600 space-y-2 list-disc pl-5">
              <li>You can edit the generated fix before applying it</li>
              <li>Save frequently used fixes for future reference</li>
              <li>For complex errors, try selecting different code sections</li>
              <li>
                You can switch between Claude and Gemini models for different
                results
              </li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Instructions;
