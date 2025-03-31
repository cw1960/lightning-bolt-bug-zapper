// This file contains server-side API handlers that would be implemented in a real backend
// For the extension, we'll create API routes that will be called from the extension

import {
  createCheckoutSession,
  createCustomerPortalSession,
  handleWebhookEvent,
} from "./payment";

// API route for creating a checkout session
export async function handleCreateCheckout(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const checkoutData = await createCheckoutSession(userId);

    return new Response(JSON.stringify({ checkoutUrl: checkoutData.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ message: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// API route for creating a customer portal session
export async function handleCustomerPortal(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const portalData = await createCustomerPortalSession(userId);

    return new Response(JSON.stringify({ portalUrl: portalData.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ message: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// API route for handling webhook events
export async function handleWebhook(req: Request) {
  try {
    const event = await req.json();
    await handleWebhookEvent(event);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ message: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
