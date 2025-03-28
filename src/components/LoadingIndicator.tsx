import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  message?: string;
  isLoading?: boolean;
}

const LoadingIndicator = ({
  message = "Processing your request with AI...",
  isLoading = true,
}: LoadingIndicatorProps) => {
  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-background rounded-lg border border-border w-full">
      <div className="relative">
        <Loader2 className="h-12 w-12 text-bolt-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 bg-bolt-500 rounded-full"></div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground">
          This may take a few moments depending on the complexity of the error.
        </p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
