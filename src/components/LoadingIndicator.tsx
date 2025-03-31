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

  const [dots, setDots] = React.useState("");
  const [tipIndex, setTipIndex] = React.useState(0);

  const tips = [
    "Analyzing error patterns and code structure...",
    "Identifying potential fixes based on error type...",
    "Checking for common programming mistakes...",
    "Generating optimized solution...",
    "Formatting code according to best practices...",
  ];

  React.useEffect(() => {
    // Animate the dots
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    // Rotate through tips
    const tipsInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(tipsInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-background rounded-lg border border-border w-full">
      <div className="relative">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 bg-primary rounded-full"></div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium">
          {message}
          <span className="inline-block w-6 text-left">{dots}</span>
        </p>
        <p className="text-sm text-muted-foreground min-h-[40px] flex items-center justify-center">
          {tips[tipIndex]}
        </p>
        <div className="w-full bg-secondary/50 rounded-full h-1.5 mt-2">
          <div
            className="bg-primary h-1.5 rounded-full animate-pulse"
            style={{ width: `${(tipIndex + 1) * 20}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
