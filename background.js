const A=function(){const i=navigator.userAgent;return i.indexOf("Firefox")>-1?"firefox":i.indexOf("Edge")>-1||i.indexOf("Edg")>-1?"edge":i.indexOf("Chrome")>-1?"chrome":i.indexOf("Safari")>-1?"safari":"unknown"}(),d=typeof browser<"u"?browser:chrome,P="1.0.0";let h=null,w=null;

// Initialize free trial usage counter
let freeTrialUsageCount = null;
const FREE_TRIAL_LIMIT = 5;

// Initialize API key cache with check in both sync and local storage
function initializeApiKeyCache() {
  console.log('Initializing API key cache...');
  
  // First check sync storage
  d.storage.sync.get(["claudeKey", "geminiKey", "defaultLLM"], syncResult => {
    // Check if we have keys in sync storage
    if (syncResult.claudeKey || syncResult.geminiKey) {
      console.log('Found API keys in sync storage:', 
        syncResult.claudeKey ? 'Claude key present' : 'Claude key missing',
        syncResult.geminiKey ? 'Gemini key present' : 'Gemini key missing'
      );
      
      h = {
        claudeKey: syncResult.claudeKey || "",
        geminiKey: syncResult.geminiKey || "",
        defaultLLM: syncResult.defaultLLM || "claude"
      };
      return;
    }
    
    // If not in sync, check local storage as fallback
    console.log('No API keys found in sync storage, checking local storage...');
    d.storage.local.get(["claudeKey", "geminiKey", "defaultLLM"], localResult => {
      if (localResult.claudeKey || localResult.geminiKey) {
        console.log('Found API keys in local storage:', 
          localResult.claudeKey ? 'Claude key present' : 'Claude key missing',
          localResult.geminiKey ? 'Gemini key present' : 'Gemini key missing'
        );
        
        h = {
          claudeKey: localResult.claudeKey || "",
          geminiKey: localResult.geminiKey || "",
          defaultLLM: localResult.defaultLLM || "claude"
        };
        
        // Also save these to sync storage for consistency
        d.storage.sync.set({
          claudeKey: localResult.claudeKey || "",
          geminiKey: localResult.geminiKey || "",
          defaultLLM: localResult.defaultLLM || "claude"
        }, () => {
          console.log('Synced API keys from local to sync storage');
        });
      } else {
        console.log('No API keys found in either storage');
        h = {
          claudeKey: "",
          geminiKey: "",
          defaultLLM: "claude"
        };
      }
    });
  });
}

// Call the initialization function when the extension loads
initializeApiKeyCache();

// Function to get free trial usage count
async function getFreeTrialUsage() {
  if (freeTrialUsageCount !== null) {
    return freeTrialUsageCount;
  }
  
  return new Promise((resolve) => {
    d.storage.local.get(['freeTrialUsageCount'], (result) => {
      freeTrialUsageCount = result.freeTrialUsageCount || 0;
      resolve(freeTrialUsageCount);
    });
  });
}

// Function to increment free trial usage
async function incrementFreeTrialUsage() {
  const currentCount = await getFreeTrialUsage();
  const newCount = currentCount + 1;
  freeTrialUsageCount = newCount;
  d.storage.local.set({ freeTrialUsageCount: newCount });
  return newCount;
}

d.runtime.onMessage.addListener((r,i,n)=>{if(r.type==="CHECK_COMPATIBILITY")return n({success:!0,browser:A,version:P,features:{storage:typeof d.storage<"u",runtime:typeof d.runtime<"u",scripting:typeof d.scripting<"u",activeTab:typeof d.tabs<"u"}}),!0;if(r.type==="CHECK_BOLT_COMPATIBILITY")return x().then(t=>{n({success:!0,...t})}).catch(t=>{n({success:!1,error:t.message})}),!0;if(r.type==="GENERATE_FIX")return p().then(async (t)=>{
  // Check license status
  if(t.state!=="ACTIVE"&&t.accessLevel!=="FULL"){
    // If not premium, check free trial usage
    const usageCount = await getFreeTrialUsage();
    if(usageCount < FREE_TRIAL_LIMIT) {
      // Still have free uses, increment and allow
      await incrementFreeTrialUsage();
      console.log(`Using free trial fix ${usageCount + 1}/${FREE_TRIAL_LIMIT}`);
      L(r.data).then(e=>{
        n({success:!0, data:e, freeTrialUsed: true, freeTrialRemaining: FREE_TRIAL_LIMIT - (usageCount + 1)});
      }).catch(e=>{
        n({success:!1,error:e.message});
      });
    } else {
      // Free trial used up
      n({
        success:!1,
        error:"PREMIUM_REQUIRED: This feature requires a premium license. Please purchase a license to continue.",
        freeTrialUsed: true,
        freeTrialRemaining: 0
      });
    }
    return true;
  }
  
  // Premium user
  L(r.data).then(e=>{
    n({success:!0,data:e});
  }).catch(e=>{
    n({success:!1,error:e.message});
  });
  return true;
}).catch(t=>{n({success:!1,error:t.message})}),!0;if(r.type==="GET_FREE_TRIAL_USAGE")return getFreeTrialUsage().then(usageCount => {
  n({
    success: true,
    usageCount,
    remaining: Math.max(0, FREE_TRIAL_LIMIT - usageCount)
  });
}).catch(err => {
  n({success: false, error: err.message});
}),!0;if(r.type==="GET_API_KEYS")return h?(console.log("Returning cached API keys:", 
  h.claudeKey ? "Claude key present" : "Claude key missing",
  h.geminiKey ? "Gemini key present" : "Gemini key missing"),
  n(h),!0):(
  // Enhanced key lookup in both storage areas
  console.log("API keys not cached, checking storage..."),
  d.storage.sync.get(["claudeKey","geminiKey","defaultLLM"], syncResult => {
    if (syncResult.claudeKey || syncResult.geminiKey) {
      console.log("Found API keys in sync storage");
      h = {
        claudeKey: syncResult.claudeKey || "",
        geminiKey: syncResult.geminiKey || "",
        defaultLLM: syncResult.defaultLLM || "claude"
      };
      n(h);
    } else {
      // If not in sync, try local storage
      console.log("No keys in sync storage, checking local storage");
      d.storage.local.get(["claudeKey","geminiKey","defaultLLM"], localResult => {
        h = {
          claudeKey: localResult.claudeKey || "",
          geminiKey: localResult.geminiKey || "",
          defaultLLM: localResult.defaultLLM || "claude"
        };
        
        // If found in local but not in sync, push to sync for consistency
        if ((localResult.claudeKey || localResult.geminiKey) && 
            !(syncResult.claudeKey || syncResult.geminiKey)) {
          console.log("Syncing keys from local to sync storage");
          d.storage.sync.set({
            claudeKey: localResult.claudeKey || "",
            geminiKey: localResult.geminiKey || "",
            defaultLLM: localResult.defaultLLM || "claude"
          });
        }
        
        console.log("Returning API keys from storage:", 
          h.claudeKey ? "Claude key present" : "Claude key missing",
          h.geminiKey ? "Gemini key present" : "Gemini key missing");
        n(h);
      });
    }
  }),!0);if(r.type==="CHECK_LICENSE")return p().then(t=>{n({success:!0,licenseStatus:t})}).catch(t=>{n({success:!1,error:t.message})}),!0;if(r.type==="PURCHASE_LICENSE")return T().then(t=>{n({success:!0,...t})}).catch(t=>{n({success:!1,error:t.message})}),!0});d.storage.onChanged.addListener((r,i)=>{i==="sync"&&h&&(r.claudeKey&&(h.claudeKey=r.claudeKey.newValue||""),r.geminiKey&&(h.geminiKey=r.geminiKey.newValue||""),r.defaultLLM&&(h.defaultLLM=r.defaultLLM.newValue||"claude")),i==="sync"&&r.licenseInfo&&(w=r.licenseInfo.newValue)});async function p(){var r,i,n;if(w){const t=Date.now(),e=w.maxAgeSecs?w.createdTime+w.maxAgeSecs*1e3:1/0;if(t<e&&w.state==="ACTIVE")return w}try{const t=await new Promise(c=>{d.storage.sync.get(["userId"],o=>{c(o)})});if(!t.userId)return{state:"FREE_TRIAL",accessLevel:"FREE_TRIAL"};const e=await new Promise(c=>{d.storage.sync.get(["licenseToken"],o=>{c(o)})});if(typeof chrome<"u"&&chrome.identity&&chrome.identity.getAuthToken)try{const c=await new Promise((o,l)=>{chrome.identity.getAuthToken({interactive:!1},a=>{chrome.runtime.lastError?(console.error("Auth token error:",chrome.runtime.lastError),l(chrome.runtime.lastError)):o(a)})});if(e.licenseToken){const l=((i=(r=chrome.runtime.getManifest().oauth2)==null?void 0:r.client_id)==null?void 0:i.split(".")[0])||"";if(!l)throw console.error("No item ID found in manifest"),new Error("No item ID found in manifest");const a=await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${l}/licenses/${e.licenseToken}`,{headers:{Authorization:`Bearer ${c}`,"Content-Type":"application/json"}});if(!a.ok)throw new Error(`License verification failed: ${a.status}`);const s=await a.json(),u={createdTime:Date.parse(s.createdTime),licenseId:e.licenseToken,itemId:l,sku:s.sku||"premium",userId:t.userId,state:((n=s.result)==null?void 0:n.toLowerCase())||"FREE_TRIAL",accessLevel:s.accessLevel||"FREE_TRIAL",maxAgeSecs:s.maxAgeSecs};return w=u,d.storage.sync.set({licenseInfo:u}),u}}catch(c){console.error("Error verifying license with Chrome Web Store API:",c)}try{const o=await(await fetch("/api/verify-license",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:t.userId,licenseToken:e.licenseToken})})).json();if(!o.success)throw new Error(o.error||"Failed to verify license");return w=o.licenseInfo,d.storage.sync.set({licenseInfo:o.licenseInfo}),o.licenseInfo}catch(c){console.error("Error checking license with backend:",c)}return{state:"FREE_TRIAL",accessLevel:"FREE_TRIAL"}}catch(t){return console.error("Error checking license status:",t),{state:"FREE_TRIAL",accessLevel:"FREE_TRIAL"}}}async function T(){var r,i;try{const n=chrome.runtime.id;if(!(((i=(r=chrome.runtime.getManifest().oauth2)==null?void 0:r.client_id)==null?void 0:i.split(".")[0])||""))throw console.error("No item ID found in manifest"),new Error("No item ID found in manifest");if(typeof chrome<"u"&&chrome.identity){const c=`https://chrome.google.com/webstore/detail/${n}`,o=await new Promise(s=>{chrome.tabs.query({active:!0,currentWindow:!0},u=>{s(u)})}),l=await new Promise(s=>{d.storage.sync.get(["userId"],u=>{s(u)})});let a=chrome.runtime.getURL("index.html");return l.userId&&(a+=`?user_id=${l.userId}&redirect=extension`),{message:"Please complete the purchase in the Chrome Web Store.",url:c,returnUrl:a}}return{message:"Please purchase a license from the Chrome Web Store.",url:"https://chrome.google.com/webstore/category/extensions"}}catch(n){throw console.error("Error initiating license purchase:",n),n}}

// Enhanced error analysis and fix generation
async function L(r) {
  const {errorMessage: i, codeSchema: n, selectedLLM: t} = r;
  
  // Generate better prompt based on error analysis
  const enhancedPrompt = generateEnhancedPrompt(i, n);
  
  // Get API keys
  let e;
  if (h) {
    e = h;
  } else {
    e = await new Promise(c => {
      d.storage.sync.get(["claudeKey", "geminiKey"], o => {
        h || (h = {
          claudeKey: o.claudeKey || "",
          geminiKey: o.geminiKey || "",
          defaultLLM: "claude"
        });
        c(o);
      });
    });
  }
  
  // Validate API key availability
  if (t === "claude" && !e.claudeKey) {
    throw new Error("INVALID_API_KEY: Claude API key not found. Please set it in the extension options.");
  }
  if (t === "gemini" && !e.geminiKey) {
    throw new Error("INVALID_API_KEY: Gemini API key not found. Please set it in the extension options.");
  }
  
  // Call the selected model
  try {
    if (t === "claude") {
      return await k(enhancedPrompt, e.claudeKey);
    } else {
      return await C(enhancedPrompt, e.geminiKey);
    }
  } catch (error) {
    console.error(`Error from ${t}:`, error);
    
    // If we have both keys and one fails, try the other
    if (error.message.includes("API key") && e.claudeKey && e.geminiKey) {
      console.log(`${t} API failed. Trying fallback model...`);
      const fallbackModel = t === "claude" ? "gemini" : "claude";
      const fallbackKey = fallbackModel === "claude" ? e.claudeKey : e.geminiKey;
      
      try {
        // Use the fallback model
        const result = fallbackModel === "claude" 
          ? await k(enhancedPrompt, fallbackKey) 
          : await C(enhancedPrompt, fallbackKey);
          
        console.log(`Fallback to ${fallbackModel} successful`);
        return result;
      } catch (fallbackError) {
        console.error(`Fallback ${fallbackModel} also failed:`, fallbackError);
        throw new Error(`${t} error: ${error.message}. Fallback to ${fallbackModel} also failed: ${fallbackError.message}`);
      }
    }
    
    // If no fallback available or fallback failed
    throw error;
  }
}

// Generate enhanced prompt based on error analysis
function generateEnhancedPrompt(errorMessage, codeSchema) {
  // Analyze the error message for patterns
  const errorPatterns = {
    syntax: /syntax error|unexpected token|unexpected identifier|unterminated string/i,
    reference: /reference error|is not defined|cannot access|before initialization/i,
    type: /type error|is not a function|cannot read prop|null|undefined/i,
    import: /cannot find module|failed to resolve|import error|export not found/i,
    network: /network error|fetch failed|api error|connection|timeout/i,
    permission: /permission denied|unauthorized|forbidden|access denied/i,
    validation: /validation failed|invalid input|constraint violation|required field/i
  };
  
  // Identify error category
  let errorCategory = "unknown";
  for (const [category, pattern] of Object.entries(errorPatterns)) {
    if (pattern.test(errorMessage)) {
      errorCategory = category;
      break;
    }
  }
  
  // Create context-specific instructions based on error type
  let specificInstructions = "";
  switch (errorCategory) {
    case "syntax":
      specificInstructions = "Focus on fixing syntax errors, checking for missing braces, parentheses, semicolons, or quotes.";
      break;
    case "reference":
      specificInstructions = "Check for undefined variables, ensure all referenced variables are properly declared and in scope.";
      break;
    case "type":
      specificInstructions = "Verify data types, ensure proper null checks, and fix type mismatches.";
      break;
    case "import":
      specificInstructions = "Verify import/export paths, module names, and ensure modules are properly installed.";
      break;
    case "network":
      specificInstructions = "Check API endpoints, request formats, and add proper error handling for network operations.";
      break;
    case "permission":
      specificInstructions = "Ensure proper authentication, check access permissions, and verify security constraints.";
      break;
    case "validation":
      specificInstructions = "Validate input data, check for required fields, and ensure proper data formatting.";
      break;
    default:
      specificInstructions = "Analyze the error and code to identify the root cause.";
  }
  
  // Build enhanced prompt
  const prompt = `I need help fixing an error in my code for bolt.new.

Error Message:
\`\`\`
${errorMessage}
\`\`\`

Current Code:
\`\`\`
${codeSchema}
\`\`\`

${specificInstructions}

Please analyze the error and code carefully. Fix the issue while maintaining the original code structure and functionality.

Return ONLY the complete fixed code without explanations or markdown formatting. The solution should be ready to use without modification.`;

  return prompt;
}

async function k(r, n) {
  var l;
  let e = 0;
  const o = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": n,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-7-sonnet-20240229",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: r
      }]
    })
  };
  
  for (; e <= 2;) {
    try {
      const a = new AbortController,
        s = setTimeout(() => a.abort(), 3e4);
      o.signal = a.signal;
      const u = await fetch("https://api.anthropic.com/v1/messages", o);
      clearTimeout(s);
      const m = await u.json();
      
      if (!u.ok) {
        if (u.status === 401)
          throw new Error("INVALID_API_KEY: Your Claude API key is invalid or expired. Please update it in the extension settings.");
        if (u.status === 429)
          throw new Error("Rate limit exceeded. Please try again in a few minutes.");
        if (u.status >= 500) {
          if (e < 2) {
            e++, await new Promise(g => setTimeout(g, Math.pow(2, e) * 1e3));
            continue
          }
          throw new Error("Claude API service is currently unavailable. Please try again later.")
        }
        const E = ((l = m.error) == null ? void 0 : l.message) || "Unknown error occurred while calling Claude API";
        throw new Error(E)
      }
      
      if (!m.content || !m.content[0] || !m.content[0].text)
        throw new Error("Received invalid response format from Claude API");
        
      const f = m.content[0].text,
        y = f.match(/\`\`\`(?:javascript|typescript|jsx|tsx)?([\s\S]*?)\`\`\`/s);
        
      return y ? y[1].trim() : f.trim()
    } catch (a) {
      if (a.name === "AbortError") {
        if (e < 2) {
          e++;
          continue
        }
        throw new Error("Request to Claude API timed out. Please check your internet connection and try again.")
      }
      if (a.message.includes("Failed to fetch") || a.message.includes("NetworkError")) {
        if (e < 2) {
          e++, await new Promise(s => setTimeout(s, Math.pow(2, e) * 1e3));
          continue
        }
        throw new Error("Network error when connecting to Claude API. Please check your internet connection.")
      }
      throw console.error("Claude API error:", a), a
    }
  }
}

async function C(r, n) {
  var l, a;
  let e = 0;
  const o = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: r
        }]
      }],
      generationConfig: {
        temperature: .1,
        maxOutputTokens: 2e3
      }
    })
  };
  
  for (; e <= 2;) {
    try {
      const s = new AbortController,
        u = setTimeout(() => s.abort(), 3e4);
      o.signal = s.signal;
      const m = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + n, o);
      clearTimeout(u);
      const f = await m.json();
      
      if (!m.ok) {
        if (m.status === 400) {
          const I = ((l = f.error) == null ? void 0 : l.message) || "";
          throw I.includes("API key") ? new Error("INVALID_API_KEY: Your Gemini API key is invalid. Please update it in the extension settings.") : new Error("Bad request: " + I)
        } else {
          if (m.status === 403)
            throw new Error("INVALID_API_KEY: Your Gemini API key is not authorized. Please check your API key permissions in the extension settings.");
          if (m.status === 429)
            throw new Error("Rate limit exceeded. Please try again in a few minutes.");
          if (m.status >= 500) {
            if (e < 2) {
              e++, await new Promise(I => setTimeout(I, Math.pow(2, e) * 1e3));
              continue
            }
            throw new Error("Gemini API service is currently unavailable. Please try again later.")
          }
        }
        const g = ((a = f.error) == null ? void 0 : a.message) || "Unknown error occurred while calling Gemini API";
        throw new Error(g)
      }
      
      if (!f.candidates || !f.candidates[0] || !f.candidates[0].content || !f.candidates[0].content.parts || !f.candidates[0].content.parts[0])
        throw new Error("Received invalid response format from Gemini API");
        
      if (f.candidates[0].finishReason === "SAFETY")
        throw new Error("The request was blocked due to safety concerns. Please modify your error or code input.");
        
      const y = f.candidates[0].content.parts[0].text,
        E = y.match(/\`\`\`(?:javascript|typescript|jsx|tsx)?([\s\S]*?)\`\`\`/s);
        
      return E ? E[1].trim() : y.trim()
    } catch (s) {
      if (s.name === "AbortError") {
        if (e < 2) {
          e++;
          continue
        }
        throw new Error("Request to Gemini API timed out. Please check your internet connection and try again.")
      }
      if (s.message.includes("Failed to fetch") || s.message.includes("NetworkError")) {
        if (e < 2) {
          e++, await new Promise(u => setTimeout(u, Math.pow(2, e) * 1e3));
          continue
        }
        throw new Error("Network error when connecting to Gemini API. Please check your internet connection.")
      }
      throw console.error("Gemini API error:", s), s
    }
  }
}

async function x() {
  try {
    return {
      isCompatible: !0,
      lastChecked: new Date().toISOString(),
      knownSelectors: {
        errorElements: [".error", ".exception", '[role="alert"]', ".error-message", ".validation-error", "[aria-invalid='true']"],
        codeElements: ["pre", "code", ".code", ".syntax", ".monaco-editor", ".cm-editor", ".ace_editor", "[class*='editor']"]
      }
    }
  } catch (r) {
    throw console.error("Error checking bolt.new compatibility:", r), r
  }
}
