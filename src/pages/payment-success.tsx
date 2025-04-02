import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { useAuth } from "../lib/authContext";

// This page is now used for Chrome Web Store payment success confirmation
const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setIsSubscribed } = useAuth();
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-redirect to extension after successful license verification
  useEffect(() => {
    if (success && !loading) {
      // Short delay to ensure state updates are complete
      const timer = setTimeout(() => {
        handleContinue();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, loading]);

  useEffect(() => {
    const verifyLicense = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check for license parameters from Chrome Web Store
        const params = new URLSearchParams(location.search);
        const licenseToken =
          params.get("license_token") || params.get("license_id");
        const userId = params.get("user_id");

        if (licenseToken) {
          console.log(`License verification with token: ${licenseToken}`);
          setLicenseId(licenseToken);

          // Store the license token in Chrome storage
          if (typeof chrome !== "undefined" && chrome.storage) {
            // If we have a user ID from the URL, use it
            if (userId) {
              chrome.storage.sync.set({ userId }, () => {
                console.log("User ID stored in Chrome storage");
              });
            }

            // Store the license token
            chrome.storage.sync.set({ licenseToken }, () => {
              console.log("License token stored in Chrome storage");
            });

            // Verify the license with the background script
            chrome.runtime.sendMessage(
              { type: "CHECK_LICENSE" },
              (response) => {
                if (response && response.success) {
                  console.log(
                    "License verified successfully:",
                    response.licenseStatus,
                  );
                  setSuccess(true);
                  setIsSubscribed(true); // Update auth context
                  localStorage.setItem("userSubscriptionStatus", "active");

                  // Notify any open extension popups that the license status has changed
                  chrome.runtime.sendMessage({
                    type: "LICENSE_STATUS_UPDATED",
                    licenseStatus: response.licenseStatus,
                  });
                } else {
                  console.error("Failed to verify license:", response?.error);
                  setError("Failed to verify license. Please contact support.");
                }
                setLoading(false);
              },
            );
          } else {
            // For development/demo mode when not running as an extension
            console.log("Development mode: Simulating license verification");

            // Store in localStorage for development
            localStorage.setItem("licenseToken", licenseToken);
            if (userId) localStorage.setItem("userId", userId);

            setSuccess(true);
            setIsSubscribed(true);
            localStorage.setItem("userSubscriptionStatus", "active");
            setLoading(false);
          }
        } else {
          // Check if we're coming back from the Chrome Web Store without a license token
          // This could happen if the user cancelled the purchase
          const fromStore = params.get("from_store") === "true";

          if (fromStore) {
            setError(
              "No license information received. The purchase may have been cancelled.",
            );
          } else {
            setError(
              "No license information found. Please purchase a license from the Chrome Web Store.",
            );
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in license verification:", err);
        setError("An unexpected error occurred. Please contact support.");
        setLoading(false);
      }
    };

    verifyLicense();
  }, [location, user, setIsSubscribed]);

  const handleContinue = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");

    if (redirect === "extension") {
      // Redirect back to the extension using chrome extension API
      if (window.chrome && chrome.runtime) {
        chrome.runtime.sendMessage({ type: "LICENSE_VERIFIED" });
        window.close(); // Close this tab as we're redirecting to the extension
      } else {
        // Fallback for when not in extension context
        navigate("/instructions");
      }
    } else {
      navigate("/instructions");
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div
              className={`h-16 w-16 rounded-full ${error ? "bg-red-100" : "bg-green-100"} flex items-center justify-center`}
            >
              {error ? (
                <AlertCircle className="h-8 w-8 text-red-600" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            {error ? "License Verification Issue" : "License Verified!"}
          </CardTitle>
          <CardDescription className="text-center">
            {error
              ? "There was an issue verifying your license."
              : "Thank you for your purchase. Your account has been upgraded."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground mb-4">
              Verifying your license...
            </p>
          ) : error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-center text-muted-foreground mb-4">
              Your license is now active. You have full access to all premium
              features of Lightning Bolt Bug Zapper.
            </p>
          )}
          {licenseId && !error && (
            <p className="text-xs text-center text-muted-foreground">
              License ID: {licenseId}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Continue to Instructions"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
