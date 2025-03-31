// This file would be used in a server environment, not in the browser extension
// For the extension, we'll create API endpoints that will be called from the extension

import { supabase } from "../lib/supabaseClient";

const POLAR_ACCESS_TOKEN =
  "polar_oat_mf5aJz1c7jlNp2g8oG06JL3fh5vK1x7brkwWO0YsHsz";
const POLAR_API_URL = "https://api.polar.sh/v1";

// Create a checkout session with Polar
export async function createCheckoutSession(userId: string) {
  try {
    // Get user details from Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // Create checkout session with Polar
    const response = await fetch(`${POLAR_API_URL}/checkout/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment-cancel`,
        customer_email: userData.email,
        metadata: {
          user_id: userId,
        },
        subscription_plan_id: "your-subscription-plan-id", // Replace with your actual plan ID
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create checkout session");
    }

    const checkoutData = await response.json();
    return checkoutData;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

// Create a customer portal session
export async function createCustomerPortalSession(userId: string) {
  try {
    // Get subscription from Supabase
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("customer_id")
      .eq("user_id", userId)
      .single();

    if (subscriptionError) throw subscriptionError;

    // Create portal session with Polar
    const response = await fetch(`${POLAR_API_URL}/customer/portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        customer_id: subscriptionData.customer_id,
        return_url: window.location.origin,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create portal session");
    }

    const portalData = await response.json();
    return portalData;
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    throw error;
  }
}

// Handle webhook events from Polar
export async function handleWebhookEvent(event: any) {
  const eventType = event.type;
  const data = event.data;

  switch (eventType) {
    case "subscription.created":
    case "subscription.updated":
      await updateSubscription(data);
      break;
    case "subscription.deleted":
      await cancelSubscription(data);
      break;
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return { success: true };
}

// Update subscription in Supabase
async function updateSubscription(data: any) {
  const userId = data.metadata?.user_id;
  if (!userId) return;

  const subscriptionData = {
    user_id: userId,
    subscription_id: data.id,
    customer_id: data.customer,
    status: data.status,
    plan_id: data.plan.id,
    current_period_start: new Date(
      data.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(data.current_period_end * 1000).toISOString(),
    cancel_at_period_end: data.cancel_at_period_end,
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "user_id" });

  if (error) {
    console.error("Error updating subscription:", error);
  }
}

// Cancel subscription in Supabase
async function cancelSubscription(data: any) {
  const userId = data.metadata?.user_id;
  if (!userId) return;

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", userId);

  if (error) {
    console.error("Error canceling subscription:", error);
  }
}
