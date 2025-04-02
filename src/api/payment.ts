// This file contains functions for handling payments and license verification

import { supabase } from "../lib/supabaseClient";

// Types for license information
export interface LicenseInfo {
  createdTime: number;
  licenseId: string;
  itemId: string;
  sku: string;
  userId: string;
  state: "ACTIVE" | "EXPIRED" | "PENDING" | "INVALID";
  accessLevel: "FREE_TRIAL" | "FULL";
  maxAgeSecs?: number;
}

// Store license information in Supabase
export async function storeLicenseInfo(
  userId: string,
  licenseInfo: LicenseInfo,
) {
  try {
    console.log("Storing license info for user:", userId);

    const subscriptionData = {
      user_id: userId,
      subscription_id: licenseInfo.licenseId,
      status: licenseInfo.state.toLowerCase(),
      current_period_start: new Date(licenseInfo.createdTime).toISOString(),
      current_period_end: licenseInfo.maxAgeSecs
        ? new Date(
            licenseInfo.createdTime + licenseInfo.maxAgeSecs * 1000,
          ).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 year if not specified
      license_data: licenseInfo,
      access_level: licenseInfo.accessLevel,
    };

    console.log("Upserting license data:", subscriptionData);

    const { data: result, error } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, { onConflict: "user_id" })
      .select();

    if (error) {
      console.error("Error updating license info:", error);
      throw error;
    }

    console.log("License info updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error in storeLicenseInfo:", error);
    throw error;
  }
}

// Get license information from Supabase
export async function getLicenseInfo(
  userId: string,
): Promise<LicenseInfo | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("license_data")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No data found
        console.log("No license found for user:", userId);
        return null;
      }
      console.error("Error fetching license info:", error);
      throw error;
    }

    return data?.license_data || null;
  } catch (error) {
    console.error("Error in getLicenseInfo:", error);
    return null;
  }
}

// Update license state in Supabase
export async function updateLicenseState(
  userId: string,
  state: "ACTIVE" | "EXPIRED" | "PENDING" | "INVALID",
) {
  try {
    // First get the current license data
    const licenseInfo = await getLicenseInfo(userId);
    if (!licenseInfo) {
      console.warn(
        "Cannot update license state: No license found for user",
        userId,
      );
      return false;
    }

    // Update the state
    licenseInfo.state = state;

    // Store the updated license info
    await storeLicenseInfo(userId, licenseInfo);
    return true;
  } catch (error) {
    console.error("Error updating license state:", error);
    return false;
  }
}
