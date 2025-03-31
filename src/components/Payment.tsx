import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, CheckCircle2, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

interface PaymentProps {
  userId?: string;
  onSubscriptionChange?: (isPro: boolean) => void;
}

const Payment = ({ userId, onSubscriptionChange = () => {} }: PaymentProps) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      fetchSubscription();
    }
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSubscription(data);
        onSubscriptionChange(data.status === "active");
      }
    } catch (error: any) {
      console.error("Error fetching subscription:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!userId) {
      setMessage({
        type: "error",
        text: "Please sign in to subscribe",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Create a checkout session with Polar
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create checkout session",
        );
      }

      const { checkoutUrl } = await response.json();

      // For demo purposes, simulate a successful payment
      if (window.location.pathname === "/payment") {
        // Simulate successful payment and redirect to instructions
        setTimeout(() => {
          window.location.href = "/instructions";
        }, 1500);
      } else {
        // Redirect to Polar checkout in production
        window.location.href = checkoutUrl;
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred during checkout",
      });
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!userId || !subscription) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Get customer portal URL
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create portal session");
      }

      const { portalUrl } = await response.json();

      // Redirect to customer portal
      window.location.href = portalUrl;
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-card border-border">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="h-5 w-5 text-primary" />
          {subscription?.status === "active"
            ? "Pro Subscription"
            : "Upgrade to Pro"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {subscription?.status === "active"
            ? "You have access to all premium features"
            : "Get unlimited access to all premium features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.status === "active" ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4">
            <p className="text-sm text-green-600 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Active Subscription
            </p>
            <p className="text-xs text-green-600 mt-1">
              Your subscription is active until{" "}
              {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary/30 border border-border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Pro Features
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Unlimited error fixes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Priority API access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Advanced code analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  Save and organize fixes
                </li>
              </ul>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
              <p className="text-sm font-medium mb-1">Pro Subscription</p>
              <p className="text-xl font-bold mb-1">
                $9.99{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / month
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
          </div>
        )}

        {message && (
          <Alert
            className={`mt-4 ${message.type === "success" ? "border-green-800/20 bg-green-900/10 text-green-400" : "border-destructive/20 bg-destructive/10"}`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {subscription?.status === "active" ? (
          <Button
            onClick={handleManageSubscription}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Loading..." : "Manage Subscription"}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            className="w-full"
            disabled={loading || !userId}
          >
            {loading
              ? "Loading..."
              : userId
                ? "Subscribe Now"
                : "Sign in to Subscribe"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default Payment;
