(function(){const _=document.createElement("link").relList;if(_&&_.supports&&_.supports("modulepreload"))return;for(const p of document.querySelectorAll('link[rel="modulepreload"]'))F(p);new MutationObserver(p=>{for(const f of p)if(f.type==="childList")for(const A of f.addedNodes)A.tagName==="LINK"&&A.rel==="modulepreload"&&F(A)}).observe(document,{childList:!0,subtree:!0});function O(p){const f={};return p.integrity&&(f.integrity=p.integrity),p.referrerPolicy&&(f.referrerPolicy=p.referrerPolicy),p.crossOrigin==="use-credentials"?f.credentials="include":p.crossOrigin==="anonymous"?f.credentials="omit":f.credentials="same-origin",f}function F(p){if(p.ep)return;p.ep=!0;const f=O(p);fetch(p.href,f)}})();const re=5;!window.supabase&&typeof supabase>"u"?console.error("Supabase client is not initialized! Make sure supabase-bundle.js is loaded before popup.js"):console.log("Supabase client is available:",typeof supabase<"u"?"Global scope":"Window scope");document.addEventListener("DOMContentLoaded",function(){const E=document.getElementById("app"),_=document.getElementById("getStartedBtn");O(),F(),_&&_.addEventListener("click",function(){W()});function O(){console.log("Showing loading screen"),E.innerHTML=`
      <div class="loading-screen">
        <img src="splash-image.png" alt="Logo" style="max-width: 120px; margin-bottom: 20px;">
        <div class="loading-spinner"></div>
      </div>
    `}function F(){console.log("Checking if user is logged in (simplified approach)"),chrome.storage.local.get(["user_logged_in","user_id","display_name"],function(r){console.log("Storage check result:",r),r.user_logged_in===!0?(console.log("User is logged in"),p(r.user_id,r.display_name)):(console.log("User is not logged in, showing splash screen"),f())})}async function p(r,a){console.log("Checking if user has API keys");try{const{data:s,error:i}=await supabase.from("api_keys").select("provider, api_key").eq("user_id",r).execute();if(console.log("API keys check result:",s),i){console.error("Error checking API keys:",i),B(a);return}!s||s.length===0?(console.log("No API keys found, showing API instructions"),B(a)):(console.log("API keys found, showing dashboard"),H(a,s))}catch(s){console.error("Error in checkUserApiKeys:",s),B(a)}}function f(){console.log("Showing splash screen"),E.innerHTML=`
      <div class="splash-screen">
        <img src="splash-image.png" alt="Logo">
        <h1>Lightning Bolt Bug Zapper</h1>
        <p>Quickly fix errors from Bolt.new</p>
        <div class="button-group">
          <button id="getStartedBtn" class="primary-button">Get Started</button>
          <button id="signInBtn" class="secondary-button">Sign In</button>
        </div>
      </div>
    `,document.getElementById("getStartedBtn").addEventListener("click",function(){W()}),document.getElementById("signInBtn").addEventListener("click",function(){A()})}function A(){console.log("Showing sign in screen"),E.innerHTML=`
      <div class="signin-screen">
        <h2>Sign In</h2>
        <p>Welcome back! Sign in to continue using the Bug Zapper</p>
        
        <div class="form-group">
          <label for="signInEmail">Email</label>
          <input type="email" id="signInEmail" placeholder="Enter your email">
        </div>
        
        <div class="form-group">
          <label for="signInPassword">Password</label>
          <input type="password" id="signInPassword" placeholder="Enter your password">
        </div>
        
        <div id="signin-error-message" class="error-message"></div>
        
        <div class="button-group">
          <button id="backToSplashBtn" class="secondary-button">Back</button>
          <button id="signInSubmitBtn" class="primary-button">Sign In</button>
        </div>
      </div>
    `,document.getElementById("backToSplashBtn").addEventListener("click",function(){f()}),document.getElementById("signInSubmitBtn").addEventListener("click",async function(){var t;const r=document.getElementById("signInEmail").value.trim(),a=document.getElementById("signInPassword").value,s=document.getElementById("signin-error-message");if(!r||!a){s.textContent="Please enter both email and password";return}const i=document.getElementById("signInSubmitBtn");i.textContent="Signing in...",i.disabled=!0,s.textContent="";try{const{data:l,error:g}=await supabase.auth.signIn(r,a);if(g)throw g;if(l&&l.user)console.log("User signed in:",l.user),chrome.storage.local.set({user_id:l.user.id,display_name:((t=l.user.user_metadata)==null?void 0:t.display_name)||"",user_email:r,user_logged_in:!0},function(){var y;console.log("User data saved to storage after sign in"),p(l.user.id,((y=l.user.user_metadata)==null?void 0:y.display_name)||"")});else throw new Error("Failed to sign in")}catch(l){console.error("Error signing in:",l),s.textContent=l.message||"Invalid email or password",i.textContent="Sign In",i.disabled=!1}})}function W(){console.log("Showing onboarding step 1"),E.innerHTML=`
      <div class="onboarding-step">
        <h2>Welcome to Lightning Bolt</h2>
        <p>Let's get to know you better</p>
        <div class="form-group">
          <label for="firstName">What's your first name?</label>
          <input type="text" id="firstName" placeholder="Enter your first name">
        </div>
        <div id="error-message" class="error-message"></div>
        <button id="nextStep1" class="primary-button">Next</button>
      </div>
    `;const r=document.getElementById("nextStep1"),a=document.getElementById("firstName"),s=document.getElementById("error-message");r.addEventListener("click",function(){const i=a.value.trim();if(!i){s.textContent="Please enter your first name";return}chrome.storage.local.set({firstName:i},function(){console.log("First name saved:",i),q()})})}function q(){console.log("Showing onboarding step 2"),E.innerHTML=`
      <div class="onboarding-step">
        <h2>Your Email</h2>
        <p>We'll use this to sign you in</p>
        <div class="form-group">
          <label for="email">Email address</label>
          <input type="email" id="email" placeholder="Enter your email">
        </div>
        <div id="error-message" class="error-message"></div>
        <div class="button-group">
          <button id="backStep2" class="secondary-button">Back</button>
          <button id="nextStep2" class="primary-button">Next</button>
        </div>
      </div>
    `;const r=document.getElementById("nextStep2"),a=document.getElementById("backStep2"),s=document.getElementById("email"),i=document.getElementById("error-message");a.addEventListener("click",function(){W()}),r.addEventListener("click",function(){const l=s.value.trim();if(!l||!t(l)){i.textContent="Please enter a valid email address";return}chrome.storage.local.set({email:l},function(){console.log("Email saved:",l),ie()})});function t(l){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l)}}function ie(){console.log("Showing onboarding step 3"),E.innerHTML=`
      <div class="onboarding-step">
        <h2>Create Password</h2>
        <p>Make it secure</p>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" placeholder="Create a password">
        </div>
        <div id="error-message" class="error-message"></div>
        <div class="button-group">
          <button id="backStep3" class="secondary-button">Back</button>
          <button id="completeSetup" class="primary-button">Complete Setup</button>
        </div>
      </div>
    `;const r=document.getElementById("completeSetup"),a=document.getElementById("backStep3"),s=document.getElementById("password"),i=document.getElementById("error-message");a.addEventListener("click",function(){q()}),r.addEventListener("click",async function(){const t=s.value;if(!t||t.length<6){i.textContent="Password must be at least 6 characters";return}chrome.storage.local.get(["firstName","email"],async function(l){const g=l.firstName,y=l.email;console.log("Signing up with:",g,y),r.textContent="Creating account...",r.disabled=!0,i.textContent="";try{console.log("Signing up with:",g,y);const{data:u,error:b}=await supabase.auth.signUp({email:y,password:t,options:{data:{display_name:g}}});if(b)throw console.error("Error signing up:",b),b;if(u&&u.user)console.log("User created successfully:",u.user),chrome.storage.local.set({user_id:u.user.id,display_name:g,user_email:y,user_created_at:new Date().toISOString(),user_logged_in:!0},function(){console.log("User data saved to chrome.storage"),se()});else throw new Error("Failed to create account")}catch(u){console.error("Error signing up:",u),i.textContent=u.message||"Error creating account",r.textContent="Complete Setup",r.disabled=!1}})})}function se(){console.log("Showing success screen"),E.innerHTML=`
      <div class="success-screen">
        <h2>Success!</h2>
        <p>Your account has been created</p>
        <div class="success-icon">✓</div>
      </div>
    `,setTimeout(function(){chrome.storage.local.get(["display_name"],function(r){B(r.display_name)})},1500)}function B(r){console.log("Showing API instructions screen for:",r),E.innerHTML=`
      <div class="api-instructions-screen">
        <h2>API Instructions</h2>
        <p>Welcome to the Lightning Bolt Bug Zapper extension ${r||""}. Before you can start zapping those Bolt.new bugs and errors, you need to provide me with at least one of the following:</p>
        
        <p>Your Anthropic Claude 3.7 Sonnet API Key, and/or your Google Gemini 2.5 API Key. Please enter the key(s) below and we'll move on to the next step.</p>
        
        <div class="form-group">
          <label for="anthropicKey">Anthropic Claude 3.7 Sonnet API Key:</label>
          <input type="password" id="anthropicKey" placeholder="Enter your Anthropic API key" class="api-key-input">
          <button id="showHideAnthropicKey" class="show-hide-btn">Show</button>
        </div>
        
        <div class="form-group">
          <label for="geminiKey">Google Gemini 2.5 API Key:</label>
          <input type="password" id="geminiKey" placeholder="Enter your Gemini API key" class="api-key-input">
          <button id="showHideGeminiKey" class="show-hide-btn">Show</button>
        </div>
        
        <div id="api-error-message" class="error-message"></div>
        
        <button id="addApiKeysBtn" class="primary-button">Add my API Key(s)</button>
        <button id="signOutBtn" class="secondary-button sign-out">Sign Out</button>
      </div>
    `;const a=document.getElementById("addApiKeysBtn"),s=document.getElementById("anthropicKey"),i=document.getElementById("geminiKey"),t=document.getElementById("api-error-message"),l=document.getElementById("signOutBtn"),g=document.getElementById("showHideAnthropicKey"),y=document.getElementById("showHideGeminiKey");g.addEventListener("click",function(){s.type==="password"?(s.type="text",g.textContent="Hide"):(s.type="password",g.textContent="Show")}),y.addEventListener("click",function(){i.type==="password"?(i.type="text",y.textContent="Hide"):(i.type="password",y.textContent="Show")}),a.addEventListener("click",async function(){const u=s.value.trim(),b=i.value.trim();if(!u&&!b){t.textContent="Please provide at least one API key";return}chrome.storage.local.get(["user_id","display_name","user_email"],async function(P){const I=P.user_id,M=P.display_name,T=P.user_email;if(!I){t.textContent="User ID not found. Please sign out and sign in again.";return}a.textContent="Saving...",a.disabled=!0,t.textContent="";try{try{if(console.log("Ensuring profile exists for user before adding API keys"),supabase.auth.ensureProfileExists){const{error:c}=await supabase.auth.ensureProfileExists(I,M,T);c&&console.warn("Warning ensuring profile exists:",c)}else{console.warn("ensureProfileExists method not available, trying direct profile creation");try{const{error:c}=await supabase.from("profiles").upsert({id:I,display_name:M,email:T,created_at:new Date().toISOString(),updated_at:new Date().toISOString()});c&&console.warn("Direct profile creation warning:",c)}catch(c){console.warn("Direct profile creation error:",c)}}}catch(c){console.warn("Profile creation skipped:",c)}console.log("Proceeding with API key operations");const v=new Date().toISOString(),S=[];if(u)try{const{data:c,error:k}=await supabase.from("api_keys").select("id").eq("user_id",I).eq("provider","anthropic").execute();if(k)throw console.error("Error checking for existing Anthropic key:",k),new Error("Error checking existing API keys");if(c&&c.length>0){const{error:w}=await supabase.from("api_keys").update({api_key:u,updated_at:v}).eq("id",c[0].id);if(w)throw console.error("Error updating Anthropic key:",w),new Error("Error updating Anthropic API key: "+w.message);console.log("Updated existing Anthropic API key")}else S.push({user_id:I,provider:"anthropic",api_key:u,created_at:v,updated_at:v})}catch(c){throw console.error("Error processing Anthropic key:",c),c}if(b)try{const{data:c,error:k}=await supabase.from("api_keys").select("id").eq("user_id",I).eq("provider","gemini").execute();if(k)throw console.error("Error checking for existing Gemini key:",k),new Error("Error checking existing API keys");if(c&&c.length>0){const{error:w}=await supabase.from("api_keys").update({api_key:b,updated_at:v}).eq("id",c[0].id);if(w)throw console.error("Error updating Gemini key:",w),new Error("Error updating Gemini API key: "+w.message);console.log("Updated existing Gemini API key")}else S.push({user_id:I,provider:"gemini",api_key:b,created_at:v,updated_at:v})}catch(c){throw console.error("Error processing Gemini key:",c),c}if(S.length>0){console.log("Inserting new API keys:",S.length);const{error:c}=await supabase.from("api_keys").insert(S);if(c){if(console.error("Error inserting API keys:",c),c.message&&c.message.includes("violates foreign key constraint")){t.textContent="Your profile might not be fully set up. Please sign out and sign in again.",a.textContent="Add my API Key(s)",a.disabled=!1;return}throw c}console.log("New API keys inserted successfully")}const{data:x,error:L}=await supabase.from("api_keys").select("provider, api_key").eq("user_id",I).execute();if(L)throw console.error("Error fetching API keys:",L),new Error("Error retrieving API keys");console.log("API keys saved successfully"),chrome.storage.sync.set({claudeKey:u||"",geminiKey:b||"",defaultLLM:u?"claude":"gemini"},function(){console.log("API keys cached in Chrome storage.sync for background script"),chrome.storage.local.set({claudeKey:u||"",geminiKey:b||"",defaultLLM:u?"claude":"gemini"},function(){console.log("API keys also cached in Chrome storage.local as backup"),ae(M,x||[])})})}catch(v){console.error("Error saving API keys:",v),t.textContent=v.message||"Error saving API keys",a.textContent="Add my API Key(s)",a.disabled=!1}})}),l&&l.addEventListener("click",async function(){try{console.log("Signing out user"),await supabase.auth.signOut(),chrome.storage.local.remove(["firstName","email","user_id","display_name","user_email","user_created_at","supabase_session","user_logged_in"],function(){console.log("User data and logged_in flag cleared from storage"),location.reload()})}catch(u){console.error("Error signing out:",u)}})}function ae(r,a){console.log("Showing API key success screen"),E.innerHTML=`
      <div class="success-screen">
        <h2>API Key(s) Successfully Added!</h2>
        <div class="success-icon">✓</div>
      </div>
    `,setTimeout(function(){H(r,a)},1500)}function H(r,a){console.log("Showing dashboard screen for:",r),console.log("With API keys:",a);const s=a.find(l=>l.provider==="anthropic"),i=a.find(l=>l.provider==="gemini");let t={step:"ready",error:null,code:null,fileInfo:null,fixedCode:null,fixSuccessful:null,preferredLLM:s?"claude":i?"gemini":null};chrome.runtime.sendMessage({type:"GET_FREE_TRIAL_USAGE"},l=>{let g="";if(l&&l.success){const e=l.usageCount||0,o=l.remaining||0;g=`
          <div class="free-trial-info">
            <p>Free Trial: <span class="trial-count">${e}/${re}</span> fixes used</p>
            <div class="trial-progress">
              <div class="trial-bar" style="width: ${e/re*100}%"></div>
            </div>
            <p class="trial-remaining">${o} free ${o===1?"fix":"fixes"} remaining</p>
          </div>
        `}E.innerHTML=`
        <div class="dashboard-screen">
          <h2>Dashboard</h2>
          <p>Welcome back, ${r||""}!</p>
          
          <div class="api-keys-summary">
            <h3>Your API Keys</h3>
            <ul>
              <li>
                <strong>Anthropic Claude 3.7 Sonnet:</strong> 
                ${s?'<span class="status-active">Active</span>':'<span class="status-missing">Not added</span>'}
                ${s?'<button id="editAnthropicKey" class="edit-key-btn">Edit</button>':'<button id="addAnthropicKey" class="add-key-btn">Add</button>'}
              </li>
              <li>
                <strong>Google Gemini 2.5:</strong> 
                ${i?'<span class="status-active">Active</span>':'<span class="status-missing">Not added</span>'}
                ${i?'<button id="editGeminiKey" class="edit-key-btn">Edit</button>':'<button id="addGeminiKey" class="add-key-btn">Add</button>'}
              </li>
            </ul>
          </div>
          
          <div class="dashboard-actions">
            <h3>Bug Zapper</h3>
            <p>Follow these steps to fix errors on bolt.new:</p>
            <ol>
              <li>Navigate to <a href="https://bolt.new" target="_blank">bolt.new</a></li>
              <li>When you encounter an error, click the extension icon</li>
              <li>Click "Capture Error" to analyze the issue</li>
              <li>Apply the suggested fix to resolve your problem</li>
            </ol>
            ${g}
            <button id="captureErrorBtn" class="primary-button">Capture Error</button>
          </div>
          
          <div id="capture-progress" class="capture-progress hidden">
            <h3>Capture Progress</h3>
            <div class="progress-steps">
              <div class="progress-step" data-step="error_capture">
                <div class="step-indicator">1</div>
                <div class="step-label">Select Error</div>
              </div>
              <div class="progress-step" data-step="code_capture">
                <div class="step-indicator">2</div>
                <div class="step-label">Select Code</div>
              </div>
              <div class="progress-step" data-step="preview">
                <div class="step-indicator">3</div>
                <div class="step-label">Preview</div>
              </div>
              <div class="progress-step" data-step="result">
                <div class="step-indicator">4</div>
                <div class="step-label">Fix</div>
              </div>
            </div>
          </div>
          
          <div id="capture-preview" class="capture-preview hidden">
            <h3>Capture Preview</h3>
            
            <div class="preview-section">
              <h4>Error Message</h4>
              <div id="error-preview" class="code-preview"></div>
            </div>
            
            <div class="preview-section">
              <h4>Code Context</h4>
              <div id="code-preview" class="code-preview"></div>
            </div>
            
            <div class="preview-actions">
              <button id="restartCaptureBtn" class="secondary-button">Restart Capture</button>
              <button id="processFixBtn" class="primary-button">Generate Fix</button>
            </div>
          </div>
          
          <div id="fix-result" class="fix-result hidden">
            <h3>Generated Fix</h3>
            
            <div class="model-selection">
              <label for="modelSelector">AI Model:</label>
              <select id="modelSelector">
                ${s?'<option value="claude" '+(t.preferredLLM==="claude"?"selected":"")+">Claude 3.7 Sonnet</option>":""}
                ${i?'<option value="gemini" '+(t.preferredLLM==="gemini"?"selected":"")+">Gemini 2.5</option>":""}
                ${s&&i?'<option value="both">Compare Both</option>':""}
              </select>
            </div>
            
            <div id="single-model-result" class="model-result">
              <h4>Fixed Code</h4>
              <div id="fixed-code-preview" class="code-preview"></div>
              
              <div class="fix-actions">
                <button id="copyFixBtn" class="secondary-button">Copy to Clipboard</button>
                <button id="applyFixBtn" class="primary-button">Apply Fix</button>
              </div>
            </div>
            
            <div id="compare-models-result" class="compare-models hidden">
              <div class="model-column">
                <h4>Claude 3.7 Sonnet</h4>
                <div id="claude-fix-preview" class="code-preview"></div>
                <button id="applyClaudeFixBtn" class="primary-button">Apply This Fix</button>
              </div>
              
              <div class="model-column">
                <h4>Gemini 2.5</h4>
                <div id="gemini-fix-preview" class="code-preview"></div>
                <button id="applyGeminiFixBtn" class="primary-button">Apply This Fix</button>
              </div>
            </div>
            
            <div class="fix-feedback hidden" id="fix-feedback">
              <h4>Did this fix work?</h4>
              <div class="feedback-buttons">
                <button id="feedbackYesBtn" class="feedback-button">👍 Yes</button>
                <button id="feedbackNoBtn" class="feedback-button">👎 No</button>
              </div>
            </div>
            
            <button id="newCaptureBtn" class="secondary-button">New Capture</button>
          </div>
          
          <button id="signOutBtn" class="secondary-button sign-out">Sign Out</button>
        </div>
      `,le();const y=document.getElementById("captureErrorBtn"),u=document.getElementById("signOutBtn"),b=document.getElementById("capture-progress"),P=document.getElementById("capture-preview"),I=document.getElementById("fix-result"),M=document.getElementById("error-preview"),T=document.getElementById("code-preview"),v=document.getElementById("restartCaptureBtn"),S=document.getElementById("processFixBtn"),x=document.getElementById("modelSelector"),L=document.getElementById("single-model-result"),c=document.getElementById("compare-models-result"),k=document.getElementById("fixed-code-preview"),w=document.getElementById("claude-fix-preview"),G=document.getElementById("gemini-fix-preview"),R=document.getElementById("copyFixBtn"),z=document.getElementById("applyFixBtn"),Y=document.getElementById("applyClaudeFixBtn"),j=document.getElementById("applyGeminiFixBtn"),Z=document.getElementById("newCaptureBtn"),N=document.getElementById("fix-feedback"),Q=document.getElementById("feedbackYesBtn"),V=document.getElementById("feedbackNoBtn"),X=document.getElementById("editAnthropicKey"),J=document.getElementById("editGeminiKey"),ee=document.getElementById("addAnthropicKey"),te=document.getElementById("addGeminiKey");X&&X.addEventListener("click",function(){B(r)}),J&&J.addEventListener("click",function(){B(r)}),ee&&ee.addEventListener("click",function(){B(r)}),te&&te.addEventListener("click",function(){B(r)});function h(){document.querySelectorAll(".progress-step").forEach(e=>{e.dataset.step===t.step?e.classList.add("active"):e.classList.remove("active");const o=["ready","error_capture","code_capture","preview","processing","result"],n=o.indexOf(t.step);o.indexOf(e.dataset.step)<n?e.classList.add("completed"):e.classList.remove("completed")}),b.classList.toggle("hidden",t.step==="ready"),P.classList.toggle("hidden",t.step!=="preview"),I.classList.toggle("hidden",t.step!=="result"),t.error&&(M.textContent=t.error),t.code&&(T.textContent=t.code),x&&x.value==="both"?(L.classList.add("hidden"),c.classList.remove("hidden")):x&&(L.classList.remove("hidden"),c.classList.add("hidden")),chrome.storage.local.set({captureWorkflowState:t})}chrome.runtime.onMessage.addListener(function(e,o,n){return e.type==="ERROR_CAPTURED"?(console.log("Error captured:",e.errorMessage),t.error=e.errorMessage,t.step="code_capture",h(),n({success:!0}),!0):e.type==="CODE_CAPTURED"?(console.log("Code captured:",e.codeContent),t.code=e.codeContent,t.fileInfo=e.fileStructure,t.step="preview",h(),n({success:!0}),!0):(e.type==="SELECTION_CANCELLED"&&(console.log("Selection cancelled"),t.step==="error_capture"&&(t.step="ready"),h(),n({success:!0})),!0)}),y&&y.addEventListener("click",function(){t={step:"error_capture",error:null,code:null,fileInfo:null,fixedCode:null,fixSuccessful:null,preferredLLM:s?"claude":i?"gemini":null},h(),chrome.tabs.query({active:!0,currentWindow:!0},function(e){if(e&&e.length>0)try{chrome.tabs.sendMessage(e[0].id,{action:"startCaptureWorkflow"},function(o){chrome.runtime.lastError?(console.error(chrome.runtime.lastError),C("Could not connect to the page. Make sure you're on bolt.new and refresh the page.")):o&&o.success?console.log("Capture workflow started"):C("Failed to start capture. Please try again.")})}catch(o){console.error("Error sending message:",o),C("An error occurred. Please try again.")}else C("No active tab found. Please open bolt.new in the current window.")})}),v&&v.addEventListener("click",function(){t.step="error_capture",t.error=null,t.code=null,t.fileInfo=null,h(),chrome.tabs.query({active:!0,currentWindow:!0},function(e){e&&e.length>0&&chrome.tabs.sendMessage(e[0].id,{action:"startCaptureWorkflow"})})}),S&&S.addEventListener("click",function(){if(!t.error||!t.code){C("Both error and code must be captured before generating a fix.");return}t.step="processing",h(),U(t.preferredLLM).then(e=>{if(t.fixedCode={},t.fixedCode[t.preferredLLM]=e,t.step="result",t.preferredLLM==="claude"?(k.textContent=e,w.textContent=e):(k.textContent=e,G.textContent=e),s&&i){const o=t.preferredLLM==="claude"?"gemini":"claude";U(o).then(n=>{t.fixedCode[o]=n,o==="claude"?w.textContent=n:G.textContent=n}).catch(n=>{console.error(`Error from ${o}:`,n),o==="claude"?w.textContent=`Error generating fix with Claude: ${n.message}`:G.textContent=`Error generating fix with Gemini: ${n.message}`})}h()}).catch(e=>{if(console.error("Error generating fix:",e),e.message.includes("PREMIUM_REQUIRED")){ce(),t.step="preview",h();return}if(e.message.includes("API key")&&s&&i){const o=t.preferredLLM==="claude"?"gemini":"claude";console.log(`Trying fallback LLM: ${o}`),U(o).then(n=>{t.fixedCode={},t.fixedCode[o]=n,t.step="result",o==="claude"?(k.textContent=n,w.textContent=n):(k.textContent=n,G.textContent=n),h()}).catch(n=>{console.error(`Fallback LLM ${o} also failed:`,n),C(`Error generating fix: ${e.message}. Fallback also failed: ${n.message}`),t.step="preview",h()})}else C(`Error generating fix: ${e.message}`),t.step="preview",h()})});async function U(e){return new Promise((o,n)=>{chrome.runtime.sendMessage({type:"GENERATE_FIX",data:{errorMessage:t.error,codeSchema:t.code,selectedLLM:e}},d=>{chrome.runtime.lastError?n(new Error(chrome.runtime.lastError.message)):d.success?o(d.data):n(new Error(d.error||"Unknown error"))})})}x&&x.addEventListener("change",function(){this.value==="both"?(L.classList.add("hidden"),c.classList.remove("hidden")):(L.classList.remove("hidden"),c.classList.add("hidden"),t.fixedCode&&t.fixedCode[this.value]&&(k.textContent=t.fixedCode[this.value]))}),R&&R.addEventListener("click",function(){const e=x.value==="both"?t.preferredLLM:x.value,o=t.fixedCode[e];if(o){const n=document.createElement("textarea");n.value=o,document.body.appendChild(n),n.select(),document.execCommand("copy"),document.body.removeChild(n),this.textContent="Copied!",setTimeout(()=>{this.textContent="Copy to Clipboard"},2e3)}});function $(e,o){chrome.tabs.query({active:!0,currentWindow:!0},function(n){n&&n.length>0&&chrome.tabs.sendMessage(n[0].id,{action:"applyFix",fixedCode:e,originalCode:t.code,model:o},function(d){if(chrome.runtime.lastError)console.error(chrome.runtime.lastError),C("Error applying fix. Please try copying the code instead.");else if(d&&d.success)t.fixApplied=!0,N.classList.remove("hidden"),setTimeout(()=>{de()},2e3);else{C("Could not apply fix automatically. The code has been copied to your clipboard.");const m=document.createElement("textarea");m.value=e,document.body.appendChild(m),m.select(),document.execCommand("copy"),document.body.removeChild(m)}})})}z&&z.addEventListener("click",function(){const e=x.value==="both"?t.preferredLLM:x.value,o=t.fixedCode[e];o&&$(o,e)}),Y&&Y.addEventListener("click",function(){const e=t.fixedCode.claude;e&&$(e,"claude")}),j&&j.addEventListener("click",function(){const e=t.fixedCode.gemini;e&&$(e,"gemini")}),Z&&Z.addEventListener("click",function(){t={step:"error_capture",error:null,code:null,fileInfo:null,fixedCode:null,fixSuccessful:null,preferredLLM:s?"claude":i?"gemini":null},h(),chrome.tabs.query({active:!0,currentWindow:!0},function(e){e&&e.length>0&&chrome.tabs.sendMessage(e[0].id,{action:"startCaptureWorkflow"})})}),Q&&Q.addEventListener("click",function(){t.fixSuccessful=!0,oe("positive"),ne()}),V&&V.addEventListener("click",function(){t.fixSuccessful=!1,oe("negative"),ne()});function de(){chrome.tabs.query({active:!0,currentWindow:!0},function(e){e&&e.length>0&&chrome.tabs.sendMessage(e[0].id,{action:"monitorForErrors"},function(o){chrome.runtime.lastError?console.error(chrome.runtime.lastError):o&&o.success&&(t.fixSuccessful=!o.hasErrors,o.hasErrors&&console.log("Errors still present after fix:",o.errorMessages))})})}function oe(e){chrome.storage.local.get(["user_id"],async function(o){const n=o.user_id;if(!n){console.error("User ID not found");return}try{const d={user_id:n,error_message:t.error,code_context:t.code,fixed_code:JSON.stringify(t.fixedCode),selected_model:x.value,feedback_type:e,timestamp:new Date().toISOString()},{error:m}=await supabase.from("fix_feedback").insert([d]);m?console.error("Error saving feedback:",m):console.log("Feedback saved successfully")}catch(d){console.error("Error in saveFeedback:",d)}})}function ne(){N.innerHTML="<p>Thank you for your feedback!</p>",setTimeout(()=>{N.classList.add("hidden")},3e3)}function C(e){const o=document.createElement("div");o.className="error-notification",o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},5e3)}function le(){if(!document.getElementById("capture-workflow-styles")){const e=document.createElement("style");e.id="capture-workflow-styles",e.textContent=`
            /* Progress bar styles */
            .capture-progress {
              margin: 20px 0;
            }
            
            .progress-steps {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
            }
            
            .progress-step {
              display: flex;
              flex-direction: column;
              align-items: center;
              position: relative;
              flex: 1;
            }
            
            .progress-step:not(:last-child)::after {
              content: '';
              position: absolute;
              width: calc(100% - 30px);
              height: 2px;
              background-color: #e0e0e0;
              top: 15px;
              left: calc(50% + 15px);
              z-index: 1;
            }
            
            .progress-step.active .step-indicator {
              background-color: #3b82f6;
              color: white;
            }
            
            .progress-step.completed .step-indicator {
              background-color: #10b981;
              color: white;
            }
            
            .progress-step.completed::after {
              background-color: #10b981;
            }
            
            .progress-step.active::after {
              background-color: #e0e0e0;
            }
            
            .step-indicator {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background-color: #f3f4f6;
              border: 2px solid #e0e0e0;
              display: flex;
              justify-content: center;
              align-items: center;
              font-weight: bold;
              z-index: 2;
            }
            
            .step-label {
              margin-top: 8px;
              font-size: 12px;
            }
            
            /* Preview styles */
            .capture-preview, .fix-result {
              margin: 20px 0;
            }
            
            .preview-section {
              margin-bottom: 15px;
            }
            
            .code-preview {
              background-color: #f3f4f6;
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              padding: 10px;
              max-height: 150px;
              overflow-y: auto;
              font-family: monospace;
              white-space: pre-wrap;
              font-size: 12px;
              color: #1f2937;
            }
            
            .preview-actions, .fix-actions {
              display: flex;
              justify-content: space-between;
              margin-top: 15px;
            }
            
            /* Model selection styles */
            .model-selection {
              margin-bottom: 15px;
            }
            
            .compare-models {
              display: flex;
              gap: 15px;
            }
            
            .model-column {
              flex: 1;
              display: flex;
              flex-direction: column;
            }
            
            .model-column h4 {
              margin-top: 0;
            }
            
            .model-column .code-preview {
              flex: 1;
              min-height: 200px;
            }
            
            .feedback-buttons {
              display: flex;
              gap: 10px;
              margin-top: 10px;
            }
            
            .feedback-button {
              padding: 8px 12px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
            
            .error-notification {
              position: fixed;
              bottom: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #ef4444;
              color: white;
              padding: 10px 20px;
              border-radius: 4px;
              z-index: 1000;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }
            
            .hidden {
              display: none;
            }
            
            /* Trial usage styles */
            .free-trial-info {
              margin: 15px 0;
              padding: 12px;
              background-color: #f0f9ff;
              border-radius: 6px;
              border-left: 4px solid #3b82f6;
              font-size: 14px;
            }
            
            .trial-count {
              font-weight: bold;
              color: #1e40af;
            }
            
            .trial-progress {
              height: 8px;
              background-color: #e0e7ff;
              border-radius: 4px;
              margin: 10px 0;
              overflow: hidden;
            }
            
            .trial-bar {
              height: 100%;
              background: linear-gradient(90deg, #3b82f6, #6366f1);
              border-radius: 4px;
              transition: width 0.3s ease;
            }
            
            .trial-remaining {
              font-size: 0.9em;
              color: #4b5563;
              margin-bottom: 0;
            }
            
            /* Premium modal styles */
            .premium-modal {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
            }
            
            .premium-modal-content {
              background-color: white;
              padding: 24px;
              border-radius: 8px;
              max-width: 400px;
              width: 90%;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .premium-modal-content h3 {
              margin-top: 0;
              color: #3b82f6;
              font-size: 18px;
            }
            
            .premium-actions {
              display: flex;
              justify-content: space-between;
              margin-top: 24px;
            }
          `,document.head.appendChild(e)}}u&&u.addEventListener("click",async function(){try{console.log("Signing out user"),await supabase.auth.signOut(),chrome.storage.local.remove(["firstName","email","user_id","display_name","user_email","user_created_at","supabase_session","user_logged_in"],function(){console.log("User data and logged_in flag cleared from storage"),location.reload()})}catch(e){console.error("Error signing out:",e)}});const K=document.createElement("button");K.className="secondary-button",K.textContent="Reset Workflow",K.style.marginTop="10px",K.addEventListener("click",function(){t={step:"ready",error:null,code:null,fileInfo:null,fixedCode:null,fixSuccessful:null,preferredLLM:s?"claude":i?"gemini":null},h(),chrome.tabs.query({active:!0,currentWindow:!0},function(e){e&&e.length>0&&chrome.tabs.sendMessage(e[0].id,{action:"resetCaptureState"})}),chrome.storage.local.remove(["captureWorkflowState","captureState"])}),document.querySelector(".dashboard-actions").appendChild(K);let ue=new Promise(e=>{chrome.storage.local.get(["captureWorkflowState","captureState"],function(o){if(o.captureWorkflowState)console.log("Found captureWorkflowState in storage:",o.captureWorkflowState),e(o.captureWorkflowState);else if(o.captureState){console.log("Found captureState in storage:",o.captureState);const n=o.captureState,d={step:n.currentStep==="error"?"error_capture":n.currentStep==="code"?"code_capture":n.currentStep==="preview"?"preview":"ready",error:n.error,code:n.code,fileInfo:n.fileStructure,fixedCode:null,fixSuccessful:n.fixSuccessful,preferredLLM:s?"claude":i?"gemini":null};e(d)}else e(null)})}),pe=new Promise(e=>{chrome.tabs.query({active:!0,currentWindow:!0},function(o){if(o&&o.length>0)try{chrome.tabs.sendMessage(o[0].id,{action:"getCaptureState"},function(n){if(chrome.runtime.lastError||!n){e(null);return}if(n.success&&n.state){console.log("Got state from content script:",n.state);const d=n.state,m={step:d.currentStep==="error"?"error_capture":d.currentStep==="code"?"code_capture":d.currentStep==="preview"?"preview":"ready",error:d.error,code:d.code,fileInfo:d.fileStructure,fixedCode:null,fixSuccessful:d.fixSuccessful,preferredLLM:s?"claude":i?"gemini":null};e(m)}else e(null)})}catch(n){console.error("Error sending message:",n),e(null)}else e(null)})});Promise.all([ue,pe]).then(([e,o])=>{const n=["ready","error_capture","code_capture","preview","processing","result"];let d=t;if(e&&o){const m=n.indexOf(e.step);n.indexOf(o.step)>m?d=o:d=e}else e?d=e:o&&(d=o);t=d,console.log("Using final state:",t),h(),chrome.tabs.query({active:!0,currentWindow:!0},function(m){if(m&&m.length>0)try{chrome.tabs.sendMessage(m[0].id,{action:"checkConnection"},function(D){})}catch(D){console.error("Error sending connection check:",D)}})});function ge(){if(console.log("Syncing API keys to Chrome storage..."),!a||a.length===0){console.log("No API keys to sync to storage");return}const e=a.find(d=>d.provider==="anthropic"),o=a.find(d=>d.provider==="gemini");console.log("Found API keys to sync:",e?"Anthropic (present)":"Anthropic (not found)",o?"Gemini (present)":"Gemini (not found)");const n={claudeKey:e?e.api_key:"",geminiKey:o?o.api_key:"",defaultLLM:e?"claude":o?"gemini":"claude"};chrome.storage.sync.set(n,function(){console.log("API keys synced to chrome.storage.sync from database"),chrome.storage.local.set(n,function(){console.log("API keys also synced to chrome.storage.local as backup"),chrome.storage.sync.get(["claudeKey","geminiKey"],function(d){console.log("Verification - API keys in sync storage:",d.claudeKey?"Claude key present":"Claude key missing",d.geminiKey?"Gemini key present":"Gemini key missing")})})})}ge()})}function ce(){const r=document.createElement("div");r.className="premium-modal",r.innerHTML=`
      <div class="premium-modal-content">
        <h3>Free Trial Limit Reached</h3>
        <p>You have used all 5 of your free trial fixes.</p>
        <p>To continue using Lightning Bolt Bug Zapper, please upgrade to premium.</p>
        <div class="premium-actions">
          <button id="upgradePremiumBtn" class="primary-button">Upgrade Now</button>
          <button id="closePremiumModalBtn" class="secondary-button">Close</button>
        </div>
      </div>
    `,document.body.appendChild(r);const a=document.querySelector("#capture-workflow-styles"),s=`
      .premium-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .premium-modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      .premium-modal-content h3 {
        margin-top: 0;
        color: #3b82f6;
      }
      
      .premium-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
      }
    `;a&&(a.textContent+=s),document.getElementById("upgradePremiumBtn").addEventListener("click",function(){chrome.runtime.sendMessage({type:"PURCHASE_LICENSE"},function(i){i&&i.success&&i.url?chrome.tabs.create({url:i.url}):showError("Could not open upgrade page. Please try again later."),r.remove()})}),document.getElementById("closePremiumModalBtn").addEventListener("click",function(){r.remove()})}});
