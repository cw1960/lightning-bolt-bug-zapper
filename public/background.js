// Background script for Lightning Bolt Bug Zapper extension

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    chrome.storage.sync.get(
      ["claudeKey", "geminiKey", "defaultLLM"],
      (result) => {
        sendResponse({
          claudeKey: result.claudeKey || "",
          geminiKey: result.geminiKey || "",
          defaultLLM: result.defaultLLM || "claude",
        });
      },
    );
    return true; // Required for async sendResponse
  }
});

// Function to generate fix using selected LLM
async function generateFix(data) {
  const { errorMessage, codeSchema, selectedLLM } = data;

  // Get API keys from storage
  const keys = await new Promise((resolve) => {
    chrome.storage.sync.get(["claudeKey", "geminiKey"], resolve);
  });

  if (selectedLLM === "claude" && !keys.claudeKey) {
    throw new Error(
      "Claude API key not found. Please set it in the extension options.",
    );
  }

  if (selectedLLM === "gemini" && !keys.geminiKey) {
    throw new Error(
      "Gemini API key not found. Please set it in the extension options.",
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
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `I'm getting the following error in my JavaScript/TypeScript code:\n\n${errorMessage}\n\nHere's the code that's causing the error:\n\n\`\`\`\n${codeSchema}\n\`\`\`\n\nPlease fix the code to resolve the error. Only provide the fixed code without explanations.`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Error calling Claude API");
    }

    // Extract code from Claude's response
    const content = data.content[0].text;
    const codeMatch = content.match(
      /\`\`\`(?:javascript|typescript|jsx|tsx)?([\s\S]*?)\`\`\`/s,
    );
    return codeMatch ? codeMatch[1].trim() : content.trim();
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
}

// Function to call Gemini API
async function callGeminiAPI(errorMessage, codeSchema, apiKey) {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `I'm getting the following error in my JavaScript/TypeScript code:\n\n${errorMessage}\n\nHere's the code that's causing the error:\n\n\`\`\`\n${codeSchema}\n\`\`\`\n\nPlease fix the code to resolve the error. Only provide the fixed code without explanations.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Error calling Gemini API");
    }

    // Extract code from Gemini's response
    const content = data.candidates[0].content.parts[0].text;
    const codeMatch = content.match(
      /\`\`\`(?:javascript|typescript|jsx|tsx)?([\s\S]*?)\`\`\`/s,
    );
    return codeMatch ? codeMatch[1].trim() : content.trim();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}
