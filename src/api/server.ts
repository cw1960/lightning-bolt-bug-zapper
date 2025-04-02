// This file contains server-side API handlers for the extension

import { supabase } from "../lib/supabaseClient";
import { getLicenseInfo, updateLicenseState } from "./payment";

// Handle license verification requests
export async function handleVerifyLicense(request: Request) {
  try {
    // Parse the request body
    const { userId, licenseToken } = await request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get the user's license info from Supabase
    const licenseInfo = await getLicenseInfo(userId);

    // If we have a license token, verify it with Chrome Web Store API
    // This would be done in the background script in a real extension
    // Here we're just simulating the response
    if (licenseToken) {
      console.log(
        "License token provided, would verify with Chrome Web Store API",
      );
      // In a real implementation, this would call the Chrome Web Store API
      // and update the license info in Supabase based on the response
    }

    // Return the license info
    return new Response(
      JSON.stringify({
        success: true,
        licenseInfo: licenseInfo || {
          state: "FREE_TRIAL",
          accessLevel: "FREE_TRIAL",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error verifying license:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to verify license" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
