import {
  handleCreateCheckout,
  handleCustomerPortal,
  handleWebhook,
} from "./server";

// This file sets up API routes for the application
// In a real application, these would be server-side routes
// For this demo, we'll simulate them in the browser

export async function setupApiRoutes() {
  // Create a simple router
  const router = {
    "/api/create-checkout": handleCreateCheckout,
    "/api/customer-portal": handleCustomerPortal,
    "/api/webhook": handleWebhook,
  };

  // Intercept fetch requests to our API routes
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === "string" ? input : input.url;

    // Check if this is one of our API routes
    const handler = Object.entries(router).find(([route]) =>
      url.includes(route),
    );

    if (handler) {
      const [_, handlerFn] = handler;
      // Create a Request object to pass to the handler
      const request = new Request(url, init);
      return handlerFn(request);
    }

    // Otherwise, use the original fetch
    return originalFetch(input, init);
  };
}
