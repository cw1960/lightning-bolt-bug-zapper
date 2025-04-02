// Simple payment client for the application
// This replaces the Polar integration with a simpler approach

import { supabase } from "./supabaseClient";

// Check if a user has an active subscription
export async function checkSubscriptionStatus(userId: string) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No subscription found
        return { isActive: false };
      }
      throw error;
    }

    return { isActive: data?.status === "active" };
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return { isActive: false, error };
  }
}

// Create a subscription record
export async function createSubscription(userId: string) {
  try {
    const subscriptionData = {
      user_id: userId,
      subscription_id: `sub_${Date.now()}`,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 30 days
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating subscription:", error);
    return { success: false, error };
  }
}
