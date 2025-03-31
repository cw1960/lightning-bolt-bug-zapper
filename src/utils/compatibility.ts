/**
 * Compatibility utilities for Lightning Bolt Bug Zapper extension
 * Helps ensure the extension works across browsers and with bolt.new
 */

// Browser detection utility
export const detectBrowser = (): string => {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Firefox") > -1) {
    return "firefox";
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    return "samsung";
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    return "opera";
  } else if (userAgent.indexOf("Edge") > -1 || userAgent.indexOf("Edg") > -1) {
    return "edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "safari";
  } else {
    return "unknown";
  }
};

// Feature detection for browser APIs
export const checkBrowserFeatures = (): Record<string, boolean> => {
  return {
    storage: typeof chrome !== "undefined" && !!chrome.storage,
    runtime: typeof chrome !== "undefined" && !!chrome.runtime,
    scripting: typeof chrome !== "undefined" && !!chrome.scripting,
    tabs: typeof chrome !== "undefined" && !!chrome.tabs,
    // Add more feature checks as needed
  };
};

// Polyfill for browser API differences
export const getBrowserAPI = () => {
  // Use the standardized browser API if available (Firefox, etc.)
  if (typeof browser !== "undefined") {
    return browser;
  }

  // Fall back to chrome API
  return chrome;
};

// Check if we're on bolt.new
export const isBoltDotNew = (): boolean => {
  return (
    window.location.hostname === "bolt.new" ||
    window.location.hostname.endsWith(".bolt.new")
  );
};

// Monitor for DOM changes on bolt.new that might affect our selectors
export const setupBoltDotNewMonitor = (
  callback: (mutations: MutationRecord[]) => void,
): MutationObserver | null => {
  if (!isBoltDotNew()) return null;

  const observer = new MutationObserver(callback);

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "id", "style"],
  });

  return observer;
};

// Version compatibility check
export const checkVersionCompatibility = async (): Promise<boolean> => {
  try {
    // This would typically check against a remote endpoint
    // For now, we'll just return true
    return true;
  } catch (error) {
    console.error("Version compatibility check failed:", error);
    return false;
  }
};
