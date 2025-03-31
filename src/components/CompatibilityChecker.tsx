import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface CompatibilityStatus {
  browser: string;
  isCompatible: boolean;
  version: string;
  features?: Record<string, boolean>;
  boltCompatible?: boolean;
  lastChecked?: string;
}

export default function CompatibilityChecker() {
  const [status, setStatus] = useState<CompatibilityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCompatibility = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check browser compatibility
      const browserAPI = typeof browser !== "undefined" ? browser : chrome;

      const browserResult = await new Promise<any>((resolve) => {
        browserAPI.runtime.sendMessage(
          { type: "CHECK_COMPATIBILITY" },
          (response) => {
            if (browserAPI.runtime.lastError) {
              throw new Error(browserAPI.runtime.lastError.message);
            }
            resolve(response);
          },
        );
      });

      // Check bolt.new compatibility
      const boltResult = await new Promise<any>((resolve) => {
        browserAPI.runtime.sendMessage(
          { type: "CHECK_BOLT_COMPATIBILITY" },
          (response) => {
            if (browserAPI.runtime.lastError) {
              throw new Error(browserAPI.runtime.lastError.message);
            }
            resolve(response);
          },
        );
      });

      setStatus({
        ...browserResult,
        boltCompatible: boltResult.isCompatible,
        lastChecked: boltResult.lastChecked,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check compatibility on component mount
    checkCompatibility();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Compatibility Check Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={checkCompatibility}
          disabled={loading}
        >
          {loading ? "Checking..." : "Try Again"}
        </Button>
      </Alert>
    );
  }

  if (!status) {
    return (
      <div className="p-4 border rounded-md bg-muted">
        <p className="text-center text-muted-foreground">
          {loading
            ? "Checking compatibility..."
            : "No compatibility information available"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Compatibility Status</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={checkCompatibility}
          disabled={loading}
        >
          {loading ? "Checking..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Browser:</span>
          <span className="font-medium capitalize">{status.browser}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Extension Version:</span>
          <span className="font-medium">{status.version}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Browser Compatibility:</span>
          <span className="flex items-center">
            {status.isCompatible ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">Compatible</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600 font-medium">Not Compatible</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">bolt.new Compatibility:</span>
          <span className="flex items-center">
            {status.boltCompatible ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">Compatible</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-600 font-medium">Not Compatible</span>
              </>
            )}
          </span>
        </div>

        {status.lastChecked && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last Checked:</span>
            <span className="font-medium">
              {new Date(status.lastChecked).toLocaleString()}
            </span>
          </div>
        )}

        {status.features && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Required Features:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(status.features).map(([feature, supported]) => (
                <div key={feature} className="flex items-center">
                  {supported ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={supported ? "text-green-600" : "text-red-600"}
                  >
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
