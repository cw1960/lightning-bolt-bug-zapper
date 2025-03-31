// Background script for Lightning Bolt Bug Zapper extension

// Browser compatibility detection
const BROWSER = (function detectBrowser() {
  const userAgent = navigator.userAgent;

  if (userAgent.indexOf("Firefox") > -1) {
    return "firefox";
  } else if (userAgent.indexOf("Edge") > -1 || userAgent.indexOf("Edg") > -1) {
    return "edge";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "safari";
  } else {
    return "unknown";
  }
})();

// Use appropriate browser API
const browserAPI = typeof browser !== "undefined" ? browser : chrome;

// Extension version for compatibility checks
const EXTENSION_VERSION = "1.0.0";

// Cache for API keys to reduce storage reads
let apiKeyCache = null;

// Listen for messages from content script or popup
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_COMPATIBILITY") {
    sendResponse({
      success: true,
      browser: BROWSER,
      version: EXTENSION_VERSION,
      features: {
        storage: typeof browserAPI.storage !== "undefined",
        runtime: typeof browserAPI.runtime !== "undefined",
        scripting: typeof browserAPI.scripting !== "undefined",
        activeTab: typeof browserAPI.tabs !== "undefined",
      },
    });
    return true;
  }

  if (message.type === "CHECK_BOLT_COMPATIBILITY") {
    checkBoltCompatibility()
      .then((result) => {
        sendResponse({ success: true, ...result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === "GENERATE_FIX") {
    generateFix(message.data)
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async sendResponse
  }

  if (message.type === "GET_API_KEYS") {
    // Use cached keys if available
    if (apiKeyCache) {
      sendResponse(apiKeyCache);
      return true;
    }

    browserAPI.storage.sync.get(
      ["claudeKey", "geminiKey", "defaultLLM"],
      (result) => {
        // Cache the result
        apiKeyCache = {
          claudeKey: result.claudeKey || "",
          geminiKey: result.geminiKey || "",
          defaultLLM: result.defaultLLM || "claude",
        };
        sendResponse(apiKeyCache);
      },
    );
    return true; // Required for async sendResponse
  }
});

// Listen for storage changes to update cache
browserAPI.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && apiKeyCache) {
    if (changes.claudeKey)
      apiKeyCache.claudeKey = changes.claudeKey.newValue || "";
    if (changes.geminiKey)
      apiKeyCache.geminiKey = changes.geminiKey.newValue || "";
    if (changes.defaultLLM)
      apiKeyCache.defaultLLM = changes.defaultLLM.newValue || "claude";
  }
});

// Function to generate fix using selected LLM
async function generateFix(data) {
  const { errorMessage, codeSchema, selectedLLM } = data;

  // Get API keys - use cache if available
  let keys;
  if (apiKeyCache) {
    keys = apiKeyCache;
  } else {
    keys = await new Promise((resolve) => {
      browserAPI.storage.sync.get(["claudeKey", "geminiKey"], (result) => {
        // Update cache
        if (!apiKeyCache)
          apiKeyCache = {
            claudeKey: result.claudeKey || "",
            geminiKey: result.geminiKey || "",
            defaultLLM: "claude",
          };
        resolve(result);
      });
    });
  }

  if (selectedLLM === "claude" && !keys.claudeKey) {
    throw new Error(
      "INVALID_API_KEY: Claude API key not found. Please set it in the extension options.",
    );
  }

  if (selectedLLM === "gemini" && !keys.geminiKey) {
    throw new Error(
      "INVALID_API_KEY: Gemini API key not found. Please set it in the extension options.",
    );
  }

  // Call the appropriate API based on selected LLM
  if (selectedLLM === "claude") {
    return callClaudeAPI(errorMessage, codeSchema, keys.claudeKey);
  } else {
    return callGeminiAPI(errorMessage, codeSchema, keys.geminiKey);
  }
}

// Function to call Claude API
async function callClaudeAPI(errorMessage, codeSchema, apiKey) {
  const MAX_RETRIES = 2;
  let retries = 0;

  // Prepare the prompt once outside the retry loop
  const prompt = `Error: ${errorMessage}\n\nCode:\n\`\`\`\n${codeSchema}\n\`\`\`\n\nFix the code. Return only the fixed code.`;

  // Prepare request options once outside the retry loop
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-7-sonnet-20240229",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  };

  while (retries <= MAX_RETRIES) {
    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      requestOptions.signal = controller.signal;

      const response = await fetch(
        "https://api.anthropic.com/v1/messages",
        requestOptions,
      );
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 401) {
          // Specific error for invalid API key that will trigger options page prompt
          throw new Error(
            "INVALID_API_KEY: Your Claude API key is invalid or expired. Please update it in the extension settings.",
          );
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Please try again in a few minutes.",
          );
        } else if (response.status >= 500) {
          if (retries < MAX_RETRIES) {
            retries++;
            // Exponential backoff: 2^retries * 1000ms (2s, then 4s)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retries) * 1000),
            );
            continue;
          }
          throw new Error(
            "Claude API service is currently unavailable. Please try again later.",
          );
        }

        // Handle other errors with more specific messages if available
        const errorMessage =
          data.error?.message ||
          "Unknown error occurred while calling Claude API";
        throw new Error(errorMessage);
      }

      // Extract code from Claude's response
      if (!data.content || !data.content[0] || !data.content[0].text) {
        throw new Error("Received invalid response format from Claude API");
      }

      const content = data.content[0].text;
      const codeMatch = content.match(
        /\`\`\`(?:javascript|typescript|jsx|tsx)?([\s\S]*?)\`\`\`/s,
      );
      return codeMatch ? codeMatch[1].trim() : content.trim();
    } catch (error) {
      // Handle network errors and timeouts
      if (error.name === "AbortError") {
        if (retries < MAX_RETRIES) {
          retries++;
          continue;
        }
        throw new Error(
          "Request to Claude API timed out. Please check your internet connection and try again.",
        );
      }

      // Handle fetch errors (network issues)
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        if (retries < MAX_RETRIES) {
          retries++;
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retries) * 1000),
          );
          continue;
        }
        throw new Error(
          "Network error when connecting to Claude API. Please check your internet connection.",
        );
      }

      // If we've tried MAX_RETRIES times or it's not a retryable error, throw the error
      console.error("Claude API error:", error);
      throw error;
    }
  }
}

// Function to call Gemini API
async function callGeminiAPI(errorMessage, codeSchema, apiKey) {
  const MAX_RETRIES = 2;
  let retries = 0;

  // Prepare the prompt once outside the retry loop
  const prompt = `Error: ${errorMessage}\n\nCode:\n\`\`\`\n${codeSchema}\n\`\`\`\n\nFix the code. Return only the fixed code.`;

  // Prepare request options once outside the retry loop
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2000,
      },
    }),
  };

  while (retries <= MAX_RETRIES) {
    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      requestOptions.signal = controller.signal;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" +
          apiKey,
        requestOptions,
      );

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 400) {
          const errorMsg = data.error?.message || "";
          if (errorMsg.includes("API key")) {
            // Specific error for invalid API key that will trigger options page prompt
            throw new Error(
              "INVALID_API_KEY: Your Gemini API key is invalid. Please update it in the extension settings.",
            );
          }
          throw new Error("Bad request: " + errorMsg);
        } else if (response.status === 403) {
          // Specific error for unauthorized API key that will trigger options page prompt
          throw new Error(
            "INVALID_API_KEY: Your Gemini API key is not authorized. Please check your API key permissions in the extension settings.",
          );
        } else if (response.status === 429) {
          throw new Error(
            "Rate limit exceeded. Please try again in a few minutes.",
          );
        } else if (response.status >= 500) {
          if (retries < MAX_RETRIES) {
            retries++;
            // Exponential backoff: 2^retries * 1000ms (2s, then 4s)
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, retries) * 1000),
            );
            continue;
          }
          throw new Error(
            "Gemini API service is currently unavailable. Please try again later.",
          );
        }

        const errorMessage =
          data.error?.message ||
          "Unknown error occurred while calling Gemini API";
        throw new Error(errorMessage);
      }

      // Validate response format
      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        throw new Error("Received invalid response format from Gemini API");
      }

      // Check for content safety issues
      if (data.candidates[0].finishReason === "SAFETY") {
        throw new Error(
          "The request was blocked due to safety concerns. Please modify your error or code input.",
        );
      }

      // Extract code from Gemini's response
      const content = data.candidates[0].content.parts[0].text;
      const codeMatch = content.match(
        /\`\`\`(?:javascript|typescript|jsx|tsx)?([\s\S]*?)\`\`\`/s,
      );
      return codeMatch ? codeMatch[1].trim() : content.trim();
    } catch (error) {
      // Handle network errors and timeouts
      if (error.name === "AbortError") {
        if (retries < MAX_RETRIES) {
          retries++;
          continue;
        }
        throw new Error(
          "Request to Gemini API timed out. Please check your internet connection and try again.",
        );
      }

      // Handle fetch errors (network issues)
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        if (retries < MAX_RETRIES) {
          retries++;
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retries) * 1000),
          );
          continue;
        }
        throw new Error(
          "Network error when connecting to Gemini API. Please check your internet connection.",
        );
      }

      // If we've tried MAX_RETRIES times or it's not a retryable error, throw the error
      console.error("Gemini API error:", error);
      throw error;
    }
  }
}

// Function to check compatibility with bolt.new
async function checkBoltCompatibility() {
  try {
    // This would typically make a request to bolt.new to check for changes
    // For now, we'll just return a static result
    return {
      isCompatible: true,
      lastChecked: new Date().toISOString(),
      knownSelectors: {
        errorElements: [".error", ".exception", '[role="alert"]'],
        codeElements: ["pre", "code", ".code", ".syntax"],
      },
    };
  } catch (error) {
    console.error("Error checking bolt.new compatibility:", error);
    throw error;
  }
}

// Function to log compatibility issues
function logCompatibilityIssue(issue) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    browser: BROWSER,
    version: EXTENSION_VERSION,
    issue,
  };

  // Store in local storage for later analysis
  browserAPI.storage.local.get(["compatibilityLogs"], (result) => {
    const logs = result.compatibilityLogs || [];
    logs.push(logEntry);

    // Keep only the last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }

    browserAPI.storage.local.set({ compatibilityLogs: logs });
  });

  console.warn("Compatibility issue logged:", logEntry);
}
