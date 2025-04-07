// Constants
const FREE_TRIAL_LIMIT = 5;

// Verify Supabase client is available
if (!window.supabase && typeof supabase === 'undefined') {
  console.error('Supabase client is not initialized! Make sure supabase-bundle.js is loaded before popup.js');
} else {
  console.log('Supabase client is available:', typeof supabase !== 'undefined' ? 'Global scope' : 'Window scope');
}

// Main popup functionality
document.addEventListener('DOMContentLoaded', function() {
  const appContainer = document.getElementById('app');
  const getStartedBtn = document.getElementById('getStartedBtn');
  
  // Initially show a loading screen
  showLoadingScreen();
  
  // Check if user is already logged in using a simpler, more direct approach
  checkIfUserIsLoggedIn();
  
  // Get Started button event handler
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function() {
      showOnboardingStep1();
    });
  }
  
  // Show loading screen while checking auth
  function showLoadingScreen() {
    console.log('Showing loading screen');
    appContainer.innerHTML = `
      <div class="loading-screen">
        <img src="splash-image.png" alt="Logo" style="max-width: 120px; margin-bottom: 20px;">
        <div class="loading-spinner"></div>
      </div>
    `;
  }
  
  // Simplified authentication check - just check if we have user_logged_in flag
  function checkIfUserIsLoggedIn() {
    console.log('Checking if user is logged in (simplified approach)');
    chrome.storage.local.get(['user_logged_in', 'user_id', 'display_name'], function(result) {
      console.log('Storage check result:', result);
      
      if (result.user_logged_in === true) {
        console.log('User is logged in');
        
        // Check if user has any API keys
        checkUserApiKeys(result.user_id, result.display_name);
      } else {
        console.log('User is not logged in, showing splash screen');
        showSplashScreen();
      }
    });
  }
  
  // Check if user has API keys
  async function checkUserApiKeys(userId, displayName) {
    console.log('Checking if user has API keys');
    try {
      // Try to fetch API keys for the user
      const { data: apiKeys, error } = await supabase
        .from('api_keys')
        .select('provider, api_key')
        .eq('user_id', userId)
        .execute();
        
      console.log('API keys check result:', apiKeys);
      
      if (error) {
        console.error('Error checking API keys:', error);
        // If there's an error, show API instructions anyway
        showAPIInstructionsScreen(displayName);
        return;
      }
      
      // If user has no API keys, show API instructions
      if (!apiKeys || apiKeys.length === 0) {
        console.log('No API keys found, showing API instructions');
        showAPIInstructionsScreen(displayName);
      } else {
        // User has API keys, show dashboard
        console.log('API keys found, showing dashboard');
        showDashboardScreen(displayName, apiKeys);
      }
    } catch (error) {
      console.error('Error in checkUserApiKeys:', error);
      showAPIInstructionsScreen(displayName);
    }
  }
  
  // Show splash screen
  function showSplashScreen() {
    console.log('Showing splash screen');
    appContainer.innerHTML = `
      <div class="splash-screen">
        <img src="splash-image.png" alt="Logo">
        <h1>Lightning Bolt Bug Zapper</h1>
        <p>Quickly fix errors from Bolt.new</p>
        <div class="button-group">
          <button id="getStartedBtn" class="primary-button">Get Started</button>
          <button id="signInBtn" class="secondary-button">Sign In</button>
        </div>
      </div>
    `;
    
    // Re-attach event listeners
    document.getElementById('getStartedBtn').addEventListener('click', function() {
      showOnboardingStep1();
    });
    
    document.getElementById('signInBtn').addEventListener('click', function() {
      showSignInScreen();
    });
  }
  
  // Sign In Screen
  function showSignInScreen() {
    console.log('Showing sign in screen');
    appContainer.innerHTML = `
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
    `;
    
    // Add event listeners
    document.getElementById('backToSplashBtn').addEventListener('click', function() {
      showSplashScreen();
    });
    
    document.getElementById('signInSubmitBtn').addEventListener('click', async function() {
      const email = document.getElementById('signInEmail').value.trim();
      const password = document.getElementById('signInPassword').value;
      const errorElement = document.getElementById('signin-error-message');
      
      // Validate input
      if (!email || !password) {
        errorElement.textContent = 'Please enter both email and password';
        return;
      }
      
      // Update button state
      const signInBtn = document.getElementById('signInSubmitBtn');
      signInBtn.textContent = 'Signing in...';
      signInBtn.disabled = true;
      errorElement.textContent = '';
      
      try {
        // Sign in with Supabase (using the signIn method instead of signInWithPassword)
        const { data, error } = await supabase.auth.signIn(email, password);
        
        if (error) {
          throw error;
        }
        
        if (data && data.user) {
          console.log('User signed in:', data.user);
          
          // Save user data to chrome.storage
          chrome.storage.local.set({
            user_id: data.user.id,
            display_name: data.user.user_metadata?.display_name || '',
            user_email: email,
            user_logged_in: true
          }, function() {
            console.log('User data saved to storage after sign in');
            
            // Check if user has API keys
            checkUserApiKeys(data.user.id, data.user.user_metadata?.display_name || '');
          });
        } else {
          throw new Error('Failed to sign in');
        }
      } catch (error) {
        console.error('Error signing in:', error);
        errorElement.textContent = error.message || 'Invalid email or password';
        signInBtn.textContent = 'Sign In';
        signInBtn.disabled = false;
      }
    });
  }
  
  // ---- Onboarding Flow Functions ----

  // Step 1: First Name
  function showOnboardingStep1() {
    console.log('Showing onboarding step 1');
    appContainer.innerHTML = `
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
    `;

    const nextBtn = document.getElementById('nextStep1');
    const firstNameInput = document.getElementById('firstName');
    const errorMessage = document.getElementById('error-message');

    nextBtn.addEventListener('click', function() {
      const firstName = firstNameInput.value.trim();
      if (!firstName) {
        errorMessage.textContent = 'Please enter your first name';
        return;
      }
      
      // Store first name and move to next step
      chrome.storage.local.set({firstName: firstName}, function() {
        console.log('First name saved:', firstName);
        showOnboardingStep2();
      });
    });
  }

  // Step 2: Email
  function showOnboardingStep2() {
    console.log('Showing onboarding step 2');
    appContainer.innerHTML = `
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
    `;

    const nextBtn = document.getElementById('nextStep2');
    const backBtn = document.getElementById('backStep2');
    const emailInput = document.getElementById('email');
    const errorMessage = document.getElementById('error-message');

    backBtn.addEventListener('click', function() {
      showOnboardingStep1();
    });

    nextBtn.addEventListener('click', function() {
      const email = emailInput.value.trim();
      if (!email || !isValidEmail(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        return;
      }
      
      // Store email and move to next step
      chrome.storage.local.set({email: email}, function() {
        console.log('Email saved:', email);
        showOnboardingStep3();
      });
    });

    function isValidEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
  }

  // Step 3: Password
  function showOnboardingStep3() {
    console.log('Showing onboarding step 3');
    appContainer.innerHTML = `
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
    `;

    const completeBtn = document.getElementById('completeSetup');
    const backBtn = document.getElementById('backStep3');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    backBtn.addEventListener('click', function() {
      showOnboardingStep2();
    });

    completeBtn.addEventListener('click', async function() {
      const password = passwordInput.value;
      if (!password || password.length < 6) {
        errorMessage.textContent = 'Password must be at least 6 characters';
        return;
      }
      
      // Get stored values
      chrome.storage.local.get(['firstName', 'email'], async function(result) {
        const firstName = result.firstName;
        const email = result.email;
        
        console.log('Signing up with:', firstName, email);
        
        // Update button state
        completeBtn.textContent = 'Creating account...';
        completeBtn.disabled = true;
        errorMessage.textContent = '';
        
        try {
          // Sign up with Supabase - simple implementation that works
          console.log('Signing up with:', firstName, email);
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: firstName
              }
            }
          });
          
          if (error) {
            console.error('Error signing up:', error);
            throw error;
          }
          
          if (data && data.user) {
            console.log('User created successfully:', data.user);
            
            // Store user data and set logged in flag
            chrome.storage.local.set({
              user_id: data.user.id,
              display_name: firstName,
              user_email: email,
              user_created_at: new Date().toISOString(),
              user_logged_in: true
            }, function() {
              console.log('User data saved to chrome.storage');
              showSuccessScreen();
            });
          } else {
            throw new Error('Failed to create account');
          }
        } catch (error) {
          console.error('Error signing up:', error);
          errorMessage.textContent = error.message || 'Error creating account';
          completeBtn.textContent = 'Complete Setup';
          completeBtn.disabled = false;
        }
      });
    });
  }

  // Success Screen
  function showSuccessScreen() {
    console.log('Showing success screen');
    appContainer.innerHTML = `
      <div class="success-screen">
        <h2>Success!</h2>
        <p>Your account has been created</p>
        <div class="success-icon">✓</div>
      </div>
    `;

    // After 1.5 seconds, show the API instructions
    setTimeout(function() {
      chrome.storage.local.get(['display_name'], function(result) {
        showAPIInstructionsScreen(result.display_name);
      });
    }, 1500);
  }

  // API Instructions Screen
  function showAPIInstructionsScreen(displayName) {
    console.log('Showing API instructions screen for:', displayName);
    appContainer.innerHTML = `
      <div class="api-instructions-screen">
        <h2>API Instructions</h2>
        <p>Welcome to the Lightning Bolt Bug Zapper extension ${displayName || ''}. Before you can start zapping those Bolt.new bugs and errors, you need to provide me with at least one of the following:</p>
        
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
    `;

    const addApiKeysBtn = document.getElementById('addApiKeysBtn');
    const anthropicKeyInput = document.getElementById('anthropicKey');
    const geminiKeyInput = document.getElementById('geminiKey');
    const errorMessage = document.getElementById('api-error-message');
    const signOutBtn = document.getElementById('signOutBtn');
    
    // Show/Hide password functionality
    const showHideAnthropicBtn = document.getElementById('showHideAnthropicKey');
    const showHideGeminiBtn = document.getElementById('showHideGeminiKey');
    
    showHideAnthropicBtn.addEventListener('click', function() {
      if (anthropicKeyInput.type === 'password') {
        anthropicKeyInput.type = 'text';
        showHideAnthropicBtn.textContent = 'Hide';
      } else {
        anthropicKeyInput.type = 'password';
        showHideAnthropicBtn.textContent = 'Show';
      }
    });
    
    showHideGeminiBtn.addEventListener('click', function() {
      if (geminiKeyInput.type === 'password') {
        geminiKeyInput.type = 'text';
        showHideGeminiBtn.textContent = 'Hide';
      } else {
        geminiKeyInput.type = 'password';
        showHideGeminiBtn.textContent = 'Show';
      }
    });

    addApiKeysBtn.addEventListener('click', async function() {
      const anthropicKey = anthropicKeyInput.value.trim();
      const geminiKey = geminiKeyInput.value.trim();
      
      // Check if at least one key is provided
      if (!anthropicKey && !geminiKey) {
        errorMessage.textContent = 'Please provide at least one API key';
        return;
      }
      
      // Get user ID from storage
      chrome.storage.local.get(['user_id', 'display_name', 'user_email'], async function(result) {
        const userId = result.user_id;
        const displayName = result.display_name;
        const email = result.user_email;
        
        if (!userId) {
          errorMessage.textContent = 'User ID not found. Please sign out and sign in again.';
          return;
        }
        
        // Update button state
        addApiKeysBtn.textContent = 'Saving...';
        addApiKeysBtn.disabled = true;
        errorMessage.textContent = '';
        
        try {
          // First, try to ensure a user profile exists
          try {
            console.log('Ensuring profile exists for user before adding API keys');
            
            // Check if the method exists
            if (supabase.auth.ensureProfileExists) {
              const { error: profileError } = await supabase.auth.ensureProfileExists(
                userId,
                displayName,
                email
              );
              
              if (profileError) {
                console.warn('Warning ensuring profile exists:', profileError);
                // Continue anyway - we'll create it in the database directly
              }
            } else {
              // Method doesn't exist, try direct creation
              console.warn('ensureProfileExists method not available, trying direct profile creation');
              try {
                const { error: directProfileError } = await supabase.from('profiles').upsert({
                  id: userId,
                  display_name: displayName,
                  email: email,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
                if (directProfileError) {
                  console.warn('Direct profile creation warning:', directProfileError);
                }
              } catch (directErr) {
                console.warn('Direct profile creation error:', directErr);
              }
            }
          } catch (profileErr) {
            // Don't let profile errors stop the API key process
            console.warn('Profile creation skipped:', profileErr);
          }
          
          console.log('Proceeding with API key operations');
          
          // Now add the API keys
          const now = new Date().toISOString();
          const keysToAdd = [];
          
          // Add Anthropic key if provided
          if (anthropicKey) {
            try {
              // Check if an Anthropic key already exists for this user
              const { data: existingAnthropicKey, error: anthQueryError } = await supabase
                .from('api_keys')
                .select('id')
                .eq('user_id', userId)
                .eq('provider', 'anthropic')
                .execute();
                
              if (anthQueryError) {
                console.error('Error checking for existing Anthropic key:', anthQueryError);
                throw new Error('Error checking existing API keys');
              }
                
              if (existingAnthropicKey && existingAnthropicKey.length > 0) {
                // Update existing key
                const { error: updateError } = await supabase
                  .from('api_keys')
                  .update({
                    api_key: anthropicKey,
                    updated_at: now
                  })
                  .eq('id', existingAnthropicKey[0].id);
                  
                if (updateError) {
                  console.error('Error updating Anthropic key:', updateError);
                  throw new Error('Error updating Anthropic API key: ' + updateError.message);
                }
                
                console.log('Updated existing Anthropic API key');
              } else {
                // Add new key
                keysToAdd.push({
                  user_id: userId,
                  provider: 'anthropic',
                  api_key: anthropicKey,
                  created_at: now,
                  updated_at: now
                });
              }
            } catch (error) {
              console.error('Error processing Anthropic key:', error);
              throw error;
            }
          }
          
          // Add Gemini key if provided
          if (geminiKey) {
            try {
              // Check if a Gemini key already exists for this user
              const { data: existingGeminiKey, error: gemQueryError } = await supabase
                .from('api_keys')
                .select('id')
                .eq('user_id', userId)
                .eq('provider', 'gemini')
                .execute();
                
              if (gemQueryError) {
                console.error('Error checking for existing Gemini key:', gemQueryError);
                throw new Error('Error checking existing API keys');
              }
                
              if (existingGeminiKey && existingGeminiKey.length > 0) {
                // Update existing key
                const { error: updateError } = await supabase
                  .from('api_keys')
                  .update({
                    api_key: geminiKey,
                    updated_at: now
                  })
                  .eq('id', existingGeminiKey[0].id);
                  
                if (updateError) {
                  console.error('Error updating Gemini key:', updateError);
                  throw new Error('Error updating Gemini API key: ' + updateError.message);
                }
                
                console.log('Updated existing Gemini API key');
              } else {
                // Add new key
                keysToAdd.push({
                  user_id: userId,
                  provider: 'gemini',
                  api_key: geminiKey,
                  created_at: now,
                  updated_at: now
                });
              }
            } catch (error) {
              console.error('Error processing Gemini key:', error);
              throw error;
            }
          }
          
          // Insert new API keys if any
          if (keysToAdd.length > 0) {
            console.log('Inserting new API keys:', keysToAdd.length);
            const { error: insertError } = await supabase
              .from('api_keys')
              .insert(keysToAdd);
            
            if (insertError) {
              console.error('Error inserting API keys:', insertError);
              // If the error is because the profile doesn't exist (foreign key constraint)
              if (insertError.message && insertError.message.includes('violates foreign key constraint')) {
                errorMessage.textContent = 'Your profile might not be fully set up. Please sign out and sign in again.';
                addApiKeysBtn.textContent = 'Add my API Key(s)';
                addApiKeysBtn.disabled = false;
                return;
              }
              throw insertError;
            }
            
            console.log('New API keys inserted successfully');
          }
          
          // Fetch all current API keys to display in dashboard
          const { data: allApiKeys, error: fetchKeysError } = await supabase
            .from('api_keys')
            .select('provider, api_key')
            .eq('user_id', userId)
            .execute();
          
          if (fetchKeysError) {
            console.error('Error fetching API keys:', fetchKeysError);
            throw new Error('Error retrieving API keys');
          }
          
          console.log('API keys saved successfully');
          
          // IMPORTANT: Also store API keys in Chrome storage for the background script
          chrome.storage.sync.set({
            claudeKey: anthropicKey || "",
            geminiKey: geminiKey || "",
            defaultLLM: anthropicKey ? "claude" : "gemini"
          }, function() {
            console.log('API keys cached in Chrome storage.sync for background script');
            
            // ALSO store in chrome.storage.local as a backup
            chrome.storage.local.set({
              claudeKey: anthropicKey || "",
              geminiKey: geminiKey || "",
              defaultLLM: anthropicKey ? "claude" : "gemini"
            }, function() {
              console.log('API keys also cached in Chrome storage.local as backup');
              
              // Show success message and navigate to dashboard
              showApiKeySuccessScreen(displayName, allApiKeys || []);
            });
          });
        } catch (error) {
          console.error('Error saving API keys:', error);
          errorMessage.textContent = error.message || 'Error saving API keys';
          addApiKeysBtn.textContent = 'Add my API Key(s)';
          addApiKeysBtn.disabled = false;
        }
      });
    });

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async function() {
        try {
          console.log('Signing out user');
          // Sign out from Supabase
          await supabase.auth.signOut();
          
          // Clear local storage - most importantly, remove the logged_in flag
          chrome.storage.local.remove([
            'firstName', 
            'email', 
            'user_id', 
            'display_name', 
            'user_email', 
            'user_created_at',
            'supabase_session',
            'user_logged_in'  // This is critical
          ], function() {
            console.log('User data and logged_in flag cleared from storage');
            // Go back to splash screen
            location.reload();
          });
        } catch (error) {
          console.error('Error signing out:', error);
        }
      });
    }
  }
  
  // API Key Success Screen
  function showApiKeySuccessScreen(displayName, apiKeys) {
    console.log('Showing API key success screen');
    appContainer.innerHTML = `
      <div class="success-screen">
        <h2>API Key(s) Successfully Added!</h2>
        <div class="success-icon">✓</div>
      </div>
    `;
    
    // After 1.5 seconds, navigate to dashboard
    setTimeout(function() {
      showDashboardScreen(displayName, apiKeys);
    }, 1500);
  }
  
  // Dashboard Screen
  function showDashboardScreen(displayName, apiKeys) {
    console.log('Showing dashboard screen for:', displayName);
    console.log('With API keys:', apiKeys);
    
    const anthropicKey = apiKeys.find(key => key.provider === 'anthropic');
    const geminiKey = apiKeys.find(key => key.provider === 'gemini');
    
    // Add capture workflow state
    let captureWorkflowState = {
      step: 'ready', // ready, error_capture, code_capture, preview, processing, result
      error: null,
      code: null,
      fileInfo: null,
      fixedCode: null,
      fixSuccessful: null,
      preferredLLM: anthropicKey ? 'claude' : (geminiKey ? 'gemini' : null)
    };
    
    // Get free trial usage
    chrome.runtime.sendMessage({type: "GET_FREE_TRIAL_USAGE"}, (response) => {
      let freeTrialUsage = '';
      if (response && response.success) {
        const usageCount = response.usageCount || 0;
        const remaining = response.remaining || 0;
        freeTrialUsage = `
          <div class="free-trial-info">
            <p>Free Trial: <span class="trial-count">${usageCount}/${FREE_TRIAL_LIMIT}</span> fixes used</p>
            <div class="trial-progress">
              <div class="trial-bar" style="width: ${(usageCount / FREE_TRIAL_LIMIT) * 100}%"></div>
            </div>
            <p class="trial-remaining">${remaining} free ${remaining === 1 ? 'fix' : 'fixes'} remaining</p>
          </div>
        `;
      }
      
      // Build HTML first so we have the DOM elements ready
      appContainer.innerHTML = `
        <div class="dashboard-screen">
          <h2>Dashboard</h2>
          <p>Welcome back, ${displayName || ''}!</p>
          
          <div class="api-keys-summary">
            <h3>Your API Keys</h3>
            <ul>
              <li>
                <strong>Anthropic Claude 3.7 Sonnet:</strong> 
                ${anthropicKey ? '<span class="status-active">Active</span>' : '<span class="status-missing">Not added</span>'}
                ${anthropicKey ? '<button id="editAnthropicKey" class="edit-key-btn">Edit</button>' : '<button id="addAnthropicKey" class="add-key-btn">Add</button>'}
              </li>
              <li>
                <strong>Google Gemini 2.5:</strong> 
                ${geminiKey ? '<span class="status-active">Active</span>' : '<span class="status-missing">Not added</span>'}
                ${geminiKey ? '<button id="editGeminiKey" class="edit-key-btn">Edit</button>' : '<button id="addGeminiKey" class="add-key-btn">Add</button>'}
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
            ${freeTrialUsage}
            <button id="captureErrorBtn" class="primary-button">Capture Error</button>
          </div>
          
          <div id="capture-progress" class="capture-progress hidden">
            <h3>Capture Progress</h3>
            <div class="progress-steps">
              <div class="progress-step" data-step="error_capture">
                <div class="step-indicator">1</div>
                <div class="step-label">Select Error</div>
              </div>
              <div class="progress-step" data-step="error_location">
                <div class="step-indicator">2</div>
                <div class="step-label">Locate Error</div>
              </div>
              <div class="progress-step" data-step="code_capture">
                <div class="step-indicator">3</div>
                <div class="step-label">Select Code</div>
              </div>
              <div class="progress-step" data-step="preview">
                <div class="step-indicator">4</div>
                <div class="step-label">Preview</div>
              </div>
              <div class="progress-step" data-step="result">
                <div class="step-indicator">5</div>
                <div class="step-label">Fix</div>
              </div>
            </div>
          </div>
          
          <div id="error-location" class="error-location hidden">
            <h3>Error Location</h3>
            <div class="preview-section">
              <h4>Error Message</h4>
              <div id="error-location-preview" class="code-preview"></div>
            </div>
            <div class="preview-actions">
              <button id="restartFromErrorLocationBtn" class="secondary-button">Restart Capture</button>
              <button id="skipToCodeCaptureBtn" class="primary-button">Continue to Code Capture</button>
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
                ${anthropicKey ? '<option value="claude" ' + (captureWorkflowState.preferredLLM === 'claude' ? 'selected' : '') + '>Claude 3.7 Sonnet</option>' : ''}
                ${geminiKey ? '<option value="gemini" ' + (captureWorkflowState.preferredLLM === 'gemini' ? 'selected' : '') + '>Gemini 2.5</option>' : ''}
                ${anthropicKey && geminiKey ? '<option value="both">Compare Both</option>' : ''}
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
      `;
      
      // Add CSS for new components
      addCaptureWorkflowStyles();
      
      const captureErrorBtn = document.getElementById('captureErrorBtn');
      const signOutBtn = document.getElementById('signOutBtn');
      
      // Capture workflow elements
      const captureProgress = document.getElementById('capture-progress');
      const capturePreview = document.getElementById('capture-preview');
      const fixResult = document.getElementById('fix-result');
      
      // Preview elements
      const errorPreview = document.getElementById('error-preview');
      const codePreview = document.getElementById('code-preview');
      const restartCaptureBtn = document.getElementById('restartCaptureBtn');
      const processFixBtn = document.getElementById('processFixBtn');
      
      // Fix result elements
      const modelSelector = document.getElementById('modelSelector');
      const singleModelResult = document.getElementById('single-model-result');
      const compareModelsResult = document.getElementById('compare-models-result');
      const fixedCodePreview = document.getElementById('fixed-code-preview');
      const claudeFixPreview = document.getElementById('claude-fix-preview');
      const geminiFixPreview = document.getElementById('gemini-fix-preview');
      const copyFixBtn = document.getElementById('copyFixBtn');
      const applyFixBtn = document.getElementById('applyFixBtn');
      const applyClaudeFixBtn = document.getElementById('applyClaudeFixBtn');
      const applyGeminiFixBtn = document.getElementById('applyGeminiFixBtn');
      const newCaptureBtn = document.getElementById('newCaptureBtn');
      const fixFeedback = document.getElementById('fix-feedback');
      const feedbackYesBtn = document.getElementById('feedbackYesBtn');
      const feedbackNoBtn = document.getElementById('feedbackNoBtn');
      
      // Edit/Add API key button handlers
      const editAnthropicKeyBtn = document.getElementById('editAnthropicKey');
      const editGeminiKeyBtn = document.getElementById('editGeminiKey');
      const addAnthropicKeyBtn = document.getElementById('addAnthropicKey');
      const addGeminiKeyBtn = document.getElementById('addGeminiKey');
      
      if (editAnthropicKeyBtn) {
        editAnthropicKeyBtn.addEventListener('click', function() {
          showAPIInstructionsScreen(displayName);
        });
      }
      
      if (editGeminiKeyBtn) {
        editGeminiKeyBtn.addEventListener('click', function() {
          showAPIInstructionsScreen(displayName);
        });
      }
      
      if (addAnthropicKeyBtn) {
        addAnthropicKeyBtn.addEventListener('click', function() {
          showAPIInstructionsScreen(displayName);
        });
      }
      
      if (addGeminiKeyBtn) {
        addGeminiKeyBtn.addEventListener('click', function() {
          showAPIInstructionsScreen(displayName);
        });
      }

      // Initialize capture workflow
      function updateCaptureWorkflowUI() {
        // Update progress indicator
        document.querySelectorAll('.progress-step').forEach(step => {
          if (step.dataset.step === captureWorkflowState.step) {
            step.classList.add('active');
          } else {
            step.classList.remove('active');
          }
          
          // Also mark previous steps as completed
          const stepOrder = ['ready', 'error_capture', 'error_location', 'code_capture', 'preview', 'processing', 'result'];
          const currentIndex = stepOrder.indexOf(captureWorkflowState.step);
          const stepIndex = stepOrder.indexOf(step.dataset.step);
          
          if (stepIndex < currentIndex) {
            step.classList.add('completed');
          } else {
            step.classList.remove('completed');
          }
        });
        
        // Show/hide sections based on state
        captureProgress.classList.toggle('hidden', captureWorkflowState.step === 'ready');
        
        // Get the error location section
        const errorLocationSection = document.getElementById('error-location');
        if (errorLocationSection) {
          errorLocationSection.classList.toggle('hidden', captureWorkflowState.step !== 'error_location');
        }
        
        capturePreview.classList.toggle('hidden', captureWorkflowState.step !== 'preview');
        fixResult.classList.toggle('hidden', captureWorkflowState.step !== 'result');
        
        // Update preview content if available
        if (captureWorkflowState.error) {
          // Update both error previews
          errorPreview.textContent = captureWorkflowState.error;
          
          const errorLocationPreview = document.getElementById('error-location-preview');
          if (errorLocationPreview) {
            errorLocationPreview.textContent = captureWorkflowState.error;
          }
          
          // Check for file location in error message when error is first captured
          if (captureWorkflowState.step === 'error_location' && window.ErrorLocationParser) {
            // Extract file info from error message
            const fileInfo = window.ErrorLocationParser.extractFileInfo(captureWorkflowState.error);
            captureWorkflowState.fileInfo = fileInfo;
            
            // Remove any existing guidance message
            const existingGuidance = document.querySelector('.file-guidance');
            if (existingGuidance) {
              existingGuidance.remove();
            }
            
            // If we found location info, show it to the user
            if (fileInfo) {
              console.log("File location detected:", fileInfo);
              
              // Add styles for guidance if not already added
              if (!document.getElementById('error-location-styles')) {
                const styleElement = document.createElement('style');
                styleElement.id = 'error-location-styles';
                styleElement.textContent = window.ErrorLocationParser.errorLocationStyles;
                document.head.appendChild(styleElement);
              }
              
              // Create and show guidance message
              const guidanceMessage = window.ErrorLocationParser.createGuidanceMessage(fileInfo);
              
              // Add the guidance message to the error location section
              const errorLocationContainer = document.querySelector('#error-location .preview-section');
              if (errorLocationContainer) {
                const guidanceContainer = document.createElement('div');
                guidanceContainer.innerHTML = guidanceMessage;
                errorLocationContainer.appendChild(guidanceContainer);
              }
            }
          }
        }
        
        if (captureWorkflowState.code) {
          codePreview.textContent = captureWorkflowState.code;
        }
        
        // Update model comparison visibility
        if (modelSelector && modelSelector.value === 'both') {
          singleModelResult.classList.add('hidden');
          compareModelsResult.classList.remove('hidden');
        } else if (modelSelector) {
          singleModelResult.classList.remove('hidden');
          compareModelsResult.classList.add('hidden');
        }
        
        // Save state to chrome.storage
        chrome.storage.local.set({ captureWorkflowState: captureWorkflowState });
      }
      
      // Handle messaging from content script
      chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        if (message.type === "ERROR_CAPTURED") {
          console.log("Error captured:", message.errorMessage);
          captureWorkflowState.error = message.errorMessage;
          captureWorkflowState.step = 'error_location';
          updateCaptureWorkflowUI();
          
          // New step: Send response without continuing to code capture automatically
          if (!message.continueToCodeCapture) {
            sendResponse({success: true, showLocationGuidance: true});
          } else {
            sendResponse({success: true});
          }
          return true;
        }
        
        if (message.type === "CODE_CAPTURED") {
          console.log("Code captured:", message.codeContent);
          captureWorkflowState.code = message.codeContent;
          if (message.fileStructure) {
            captureWorkflowState.fileInfo = {...captureWorkflowState.fileInfo, ...message.fileStructure};
          }
          captureWorkflowState.step = 'preview';
          updateCaptureWorkflowUI();
          sendResponse({success: true});
          return true;
        }
        
        if (message.type === "SELECTION_CANCELLED") {
          console.log("Selection cancelled");
          // If in the middle of the workflow, don't reset completely
          if (captureWorkflowState.step === 'error_capture' || captureWorkflowState.step === 'error_location') {
            captureWorkflowState.step = 'ready';
          }
          updateCaptureWorkflowUI();
          sendResponse({success: true});
          return true;
        }
        
        return true; // Keep the message channel open for async responses
      });

      if (captureErrorBtn) {
        captureErrorBtn.addEventListener('click', function() {
          // Start new capture workflow
          captureWorkflowState = {
            step: 'error_capture',
            error: null,
            code: null,
            fileInfo: null,
            fixedCode: null,
            fixSuccessful: null,
            preferredLLM: anthropicKey ? 'claude' : (geminiKey ? 'gemini' : null)
          };
          
          updateCaptureWorkflowUI();
          
          // Send message to content script to start error capture
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0) {
              try {
                chrome.tabs.sendMessage(
                  tabs[0].id, 
                  {action: "startCaptureWorkflow"},
                  function(response) {
                    if (chrome.runtime.lastError) {
                      console.error(chrome.runtime.lastError);
                      showError("Could not connect to the page. Make sure you're on bolt.new and refresh the page.");
                    } else if (response && response.success) {
                      console.log("Capture workflow started");
                    } else {
                      showError("Failed to start capture. Please try again.");
                    }
                  }
                );
              } catch (e) {
                console.error('Error sending message:', e);
                showError("An error occurred. Please try again.");
              }
            } else {
              showError("No active tab found. Please open bolt.new in the current window.");
            }
          });
        });
      }
      
      // Preview screen handlers
      if (restartCaptureBtn) {
        restartCaptureBtn.addEventListener('click', function() {
          captureWorkflowState.step = 'error_capture';
          captureWorkflowState.error = null;
          captureWorkflowState.code = null;
          captureWorkflowState.fileInfo = null;
          updateCaptureWorkflowUI();
          
          // Start error capture again
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, {action: "startCaptureWorkflow"});
            }
          });
        });
      }
      
      if (processFixBtn) {
        processFixBtn.addEventListener('click', function() {
          if (!captureWorkflowState.error || !captureWorkflowState.code) {
            showError("Both error and code must be captured before generating a fix.");
            return;
          }
          
          captureWorkflowState.step = 'processing';
          updateCaptureWorkflowUI();
          
          // First, try the preferred LLM
          generateFix(captureWorkflowState.preferredLLM)
            .then(result => {
              captureWorkflowState.fixedCode = {};
              captureWorkflowState.fixedCode[captureWorkflowState.preferredLLM] = result;
              captureWorkflowState.step = 'result';
              
              // Prepare UI
              if (captureWorkflowState.preferredLLM === 'claude') {
                fixedCodePreview.textContent = result;
                claudeFixPreview.textContent = result;
              } else {
                fixedCodePreview.textContent = result;
                geminiFixPreview.textContent = result;
              }
              
              // If we have both LLMs available, generate the other one too
              if (anthropicKey && geminiKey) {
                const otherLLM = captureWorkflowState.preferredLLM === 'claude' ? 'gemini' : 'claude';
                
                generateFix(otherLLM)
                  .then(otherResult => {
                    captureWorkflowState.fixedCode[otherLLM] = otherResult;
                    
                    if (otherLLM === 'claude') {
                      claudeFixPreview.textContent = otherResult;
                    } else {
                      geminiFixPreview.textContent = otherResult;
                    }
                  })
                  .catch(error => {
                    console.error(`Error from ${otherLLM}:`, error);
                    // Show error but don't break the flow
                    if (otherLLM === 'claude') {
                      claudeFixPreview.textContent = `Error generating fix with Claude: ${error.message}`;
                    } else {
                      geminiFixPreview.textContent = `Error generating fix with Gemini: ${error.message}`;
                    }
                  });
              }
              
              updateCaptureWorkflowUI();
            })
            .catch(error => {
              console.error("Error generating fix:", error);
              
              if (error.message.includes('PREMIUM_REQUIRED')) {
                // Show premium upgrade message
                showPremiumRequiredMessage();
                captureWorkflowState.step = 'preview';
                updateCaptureWorkflowUI();
                return;
              }
              
              // If the preferred LLM fails and we have another one, try it
              if (error.message.includes('API key') && anthropicKey && geminiKey) {
                const fallbackLLM = captureWorkflowState.preferredLLM === 'claude' ? 'gemini' : 'claude';
                console.log(`Trying fallback LLM: ${fallbackLLM}`);
                
                generateFix(fallbackLLM)
                  .then(result => {
                    captureWorkflowState.fixedCode = {};
                    captureWorkflowState.fixedCode[fallbackLLM] = result;
                    captureWorkflowState.step = 'result';
                    
                    if (fallbackLLM === 'claude') {
                      fixedCodePreview.textContent = result;
                      claudeFixPreview.textContent = result;
                    } else {
                      fixedCodePreview.textContent = result;
                      geminiFixPreview.textContent = result;
                    }
                    
                    updateCaptureWorkflowUI();
                  })
                  .catch(fallbackError => {
                    console.error(`Fallback LLM ${fallbackLLM} also failed:`, fallbackError);
                    showError(`Error generating fix: ${error.message}. Fallback also failed: ${fallbackError.message}`);
                    captureWorkflowState.step = 'preview';
                    updateCaptureWorkflowUI();
                  });
              } else {
                showError(`Error generating fix: ${error.message}`);
                captureWorkflowState.step = 'preview';
                updateCaptureWorkflowUI();
              }
            });
        });
      }
      
      // Generate fix function
      async function generateFix(selectedLLM) {
        // Send to background script to handle API calls
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: "GENERATE_FIX",
            data: {
              errorMessage: captureWorkflowState.error,
              codeSchema: captureWorkflowState.code,
              selectedLLM: selectedLLM
            }
          }, response => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || "Unknown error"));
            }
          });
        });
      }
      
      // Fix result handlers
      if (modelSelector) {
        modelSelector.addEventListener('change', function() {
          if (this.value === 'both') {
            singleModelResult.classList.add('hidden');
            compareModelsResult.classList.remove('hidden');
          } else {
            singleModelResult.classList.remove('hidden');
            compareModelsResult.classList.add('hidden');
            
            // Update the single model view with the selected model's fix
            if (captureWorkflowState.fixedCode && captureWorkflowState.fixedCode[this.value]) {
              fixedCodePreview.textContent = captureWorkflowState.fixedCode[this.value];
            }
          }
        });
      }
      
      if (copyFixBtn) {
        copyFixBtn.addEventListener('click', function() {
          const selectedModel = modelSelector.value === 'both' ? captureWorkflowState.preferredLLM : modelSelector.value;
          const codeToCopy = captureWorkflowState.fixedCode[selectedModel];
          
          if (codeToCopy) {
            // Copy to clipboard
            const textarea = document.createElement('textarea');
            textarea.value = codeToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            // Show confirmation
            this.textContent = 'Copied!';
            setTimeout(() => {
              this.textContent = 'Copy to Clipboard';
            }, 2000);
          }
        });
      }
      
      // Apply fix handlers
      function applyFixToPage(code, model) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {
                action: "applyFix",
                fixedCode: code,
                originalCode: captureWorkflowState.code,
                model: model
              },
              function(response) {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                  showError("Error applying fix. Please try copying the code instead.");
                } else if (response && response.success) {
                  captureWorkflowState.fixApplied = true;
                  fixFeedback.classList.remove('hidden');
                  
                  // Set up monitoring for errors
                  setTimeout(() => {
                    monitorForErrors();
                  }, 2000);
                } else {
                  showError("Could not apply fix automatically. The code has been copied to your clipboard.");
                  // Fallback to clipboard
                  const textarea = document.createElement('textarea');
                  textarea.value = code;
                  document.body.appendChild(textarea);
                  textarea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textarea);
                }
              }
            );
          }
        });
      }
      
      if (applyFixBtn) {
        applyFixBtn.addEventListener('click', function() {
          const selectedModel = modelSelector.value === 'both' ? captureWorkflowState.preferredLLM : modelSelector.value;
          const codeToApply = captureWorkflowState.fixedCode[selectedModel];
          
          if (codeToApply) {
            applyFixToPage(codeToApply, selectedModel);
          }
        });
      }
      
      if (applyClaudeFixBtn) {
        applyClaudeFixBtn.addEventListener('click', function() {
          const codeToApply = captureWorkflowState.fixedCode['claude'];
          if (codeToApply) {
            applyFixToPage(codeToApply, 'claude');
          }
        });
      }
      
      if (applyGeminiFixBtn) {
        applyGeminiFixBtn.addEventListener('click', function() {
          const codeToApply = captureWorkflowState.fixedCode['gemini'];
          if (codeToApply) {
            applyFixToPage(codeToApply, 'gemini');
          }
        });
      }
      
      if (newCaptureBtn) {
        newCaptureBtn.addEventListener('click', function() {
          // Reset and start over
          captureWorkflowState = {
            step: 'error_capture',
            error: null,
            code: null,
            fileInfo: null,
            fixedCode: null,
            fixSuccessful: null,
            preferredLLM: anthropicKey ? 'claude' : (geminiKey ? 'gemini' : null)
          };
          
          updateCaptureWorkflowUI();
          
          // Start error capture again
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, {action: "startCaptureWorkflow"});
            }
          });
        });
      }
      
      // Feedback handlers
      if (feedbackYesBtn) {
        feedbackYesBtn.addEventListener('click', function() {
          captureWorkflowState.fixSuccessful = true;
          saveFeedback('positive');
          showFeedbackThanks();
        });
      }
      
      if (feedbackNoBtn) {
        feedbackNoBtn.addEventListener('click', function() {
          captureWorkflowState.fixSuccessful = false;
          saveFeedback('negative');
          showFeedbackThanks();
        });
      }
      
      // Monitor for errors after applying fix
      function monitorForErrors() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(
              tabs[0].id,
              {action: "monitorForErrors"},
              function(response) {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                } else if (response && response.success) {
                  captureWorkflowState.fixSuccessful = !response.hasErrors;
                  
                  if (response.hasErrors) {
                    console.log("Errors still present after fix:", response.errorMessages);
                  }
                }
              }
            );
          }
        });
      }
      
      // Save feedback to database
      function saveFeedback(feedbackType) {
        // Get user info
        chrome.storage.local.get(['user_id'], async function(result) {
          const userId = result.user_id;
          
          if (!userId) {
            console.error("User ID not found");
            return;
          }
          
          try {
            // Prepare feedback data
            const feedbackData = {
              user_id: userId,
              error_message: captureWorkflowState.error,
              code_context: captureWorkflowState.code,
              fixed_code: JSON.stringify(captureWorkflowState.fixedCode),
              selected_model: modelSelector.value,
              feedback_type: feedbackType,
              timestamp: new Date().toISOString()
            };
            
            // Insert feedback to Supabase
            const { error } = await supabase
              .from('fix_feedback')
              .insert([feedbackData]);
              
            if (error) {
              console.error("Error saving feedback:", error);
            } else {
              console.log("Feedback saved successfully");
            }
          } catch (error) {
            console.error("Error in saveFeedback:", error);
          }
        });
      }
      
      // Show feedback thank you message
      function showFeedbackThanks() {
        fixFeedback.innerHTML = '<p>Thank you for your feedback!</p>';
        setTimeout(() => {
          fixFeedback.classList.add('hidden');
        }, 3000);
      }
      
      // Show error message
      function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
          if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
          }
        }, 5000);
      }
      
      // Add styles for capture workflow UI
      function addCaptureWorkflowStyles() {
        if (!document.getElementById('capture-workflow-styles')) {
          const styleElement = document.createElement('style');
          styleElement.id = 'capture-workflow-styles';
          styleElement.textContent = `
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
            .capture-preview, .fix-result, .error-location {
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
          `;
          document.head.appendChild(styleElement);
        }
      }

      if (signOutBtn) {
        signOutBtn.addEventListener('click', async function() {
          try {
            console.log('Signing out user');
            // Sign out from Supabase
            await supabase.auth.signOut();
            
            // Clear local storage - most importantly, remove the logged_in flag
            chrome.storage.local.remove([
              'firstName', 
              'email', 
              'user_id', 
              'display_name', 
              'user_email', 
              'user_created_at',
              'supabase_session',
              'user_logged_in'  // This is critical
            ], function() {
              console.log('User data and logged_in flag cleared from storage');
              // Go back to splash screen
              location.reload();
            });
          } catch (error) {
            console.error('Error signing out:', error);
          }
        });
      }

      // Add Reset Workflow button
      const resetButton = document.createElement('button');
      resetButton.className = 'secondary-button';
      resetButton.textContent = 'Reset Workflow';
      resetButton.style.marginTop = '10px';
      resetButton.addEventListener('click', function() {
        captureWorkflowState = {
          step: 'ready',
          error: null,
          code: null,
          fileInfo: null,
          fixedCode: null,
          fixSuccessful: null,
          preferredLLM: anthropicKey ? 'claude' : (geminiKey ? 'gemini' : null)
        };
        updateCaptureWorkflowUI();
        
        // Also clear content script state
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "resetCaptureState"});
          }
        });
        
        // Clear from storage
        chrome.storage.local.remove(['captureWorkflowState', 'captureState']);
      });
      
      // Add reset button to the bottom of dashboard actions
      document.querySelector('.dashboard-actions').appendChild(resetButton);
      
      // Now check for state information in both local storage and from content script
      let localStatePromise = new Promise((resolve) => {
        chrome.storage.local.get(['captureWorkflowState', 'captureState'], function(result) {
          if (result.captureWorkflowState) {
            console.log('Found captureWorkflowState in storage:', result.captureWorkflowState);
            resolve(result.captureWorkflowState);
          } else if (result.captureState) {
            // Convert content script state format to popup state format
            console.log('Found captureState in storage:', result.captureState);
            const contentState = result.captureState;
            const popupState = {
              step: contentState.currentStep === 'error' ? 'error_capture' : 
                    contentState.currentStep === 'code' ? 'code_capture' : 
                    contentState.currentStep === 'preview' ? 'preview' : 'ready',
              error: contentState.error,
              code: contentState.code,
              fileInfo: contentState.fileStructure,
              fixedCode: null,
              fixSuccessful: contentState.fixSuccessful,
              preferredLLM: anthropicKey ? 'claude' : (geminiKey ? 'gemini' : null)
            };
            resolve(popupState);
          } else {
            resolve(null);
          }
        });
      });
      
      let contentStatePromise = new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            try {
              chrome.tabs.sendMessage(
                tabs[0].id, 
                {action: "getCaptureState"},
                function(response) {
                  if (chrome.runtime.lastError || !response) {
                    resolve(null);
                    return;
                  }
                  
                  if (response.success && response.state) {
                    console.log('Got state from content script:', response.state);
                    // Convert content script state format to popup state format
                    const contentState = response.state;
                    const popupState = {
                      step: contentState.currentStep === 'error' ? 'error_capture' : 
                            contentState.currentStep === 'code' ? 'code_capture' : 
                            contentState.currentStep === 'preview' ? 'preview' : 'ready',
                      error: contentState.error,
                      code: contentState.code,
                      fileInfo: contentState.fileStructure,
                      fixedCode: null,
                      fixSuccessful: contentState.fixSuccessful,
                      preferredLLM: anthropicKey ? 'claude' : (geminiKey ? 'gemini' : null)
                    };
                    resolve(popupState);
                  } else {
                    resolve(null);
                  }
                }
              );
            } catch (e) {
              console.error('Error sending message:', e);
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
      
      // Wait for both state checks and use the most advanced one
      Promise.all([localStatePromise, contentStatePromise]).then(([localState, contentState]) => {
        // Determine which state to use (prefer the one furthest along in the workflow)
        const stepOrder = ['ready', 'error_capture', 'code_capture', 'preview', 'processing', 'result'];
        
        let finalState = captureWorkflowState; // Default state
        
        if (localState && contentState) {
          // Both states exist, use the more advanced one
          const localStateIndex = stepOrder.indexOf(localState.step);
          const contentStateIndex = stepOrder.indexOf(contentState.step);
          
          if (contentStateIndex > localStateIndex) {
            finalState = contentState;
          } else {
            finalState = localState;
          }
        } else if (localState) {
          finalState = localState;
        } else if (contentState) {
          finalState = contentState;
        }
        
        // Update our state and UI
        captureWorkflowState = finalState;
        console.log('Using final state:', captureWorkflowState);
        updateCaptureWorkflowUI();
        
        // Let the content script know we're connected
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs.length > 0) {
            try {
              chrome.tabs.sendMessage(
                tabs[0].id, 
                {action: "checkConnection"},
                function(response) {
                  // Just establishing connection, don't need to do anything with response
                }
              );
            } catch (e) {
              console.error('Error sending connection check:', e);
            }
          }
        });
      });

      // After loading the dashboard, sync API keys to Chrome storage
      function syncApiKeysToStorage() {
        console.log('Syncing API keys to Chrome storage...');
        if (!apiKeys || apiKeys.length === 0) {
          console.log('No API keys to sync to storage');
          return;
        }
        
        const anthropicKey = apiKeys.find(key => key.provider === 'anthropic');
        const geminiKey = apiKeys.find(key => key.provider === 'gemini');
        
        console.log('Found API keys to sync:', 
          anthropicKey ? 'Anthropic (present)' : 'Anthropic (not found)', 
          geminiKey ? 'Gemini (present)' : 'Gemini (not found)'
        );
        
        const storageData = {
          claudeKey: anthropicKey ? anthropicKey.api_key : "",
          geminiKey: geminiKey ? geminiKey.api_key : "",
          defaultLLM: anthropicKey ? "claude" : (geminiKey ? "gemini" : "claude")
        };
        
        // Store in sync storage
        chrome.storage.sync.set(storageData, function() {
          console.log('API keys synced to chrome.storage.sync from database');
          
          // Also store in local storage as backup
          chrome.storage.local.set(storageData, function() {
            console.log('API keys also synced to chrome.storage.local as backup');
            
            // Verify the keys were set correctly by reading them back
            chrome.storage.sync.get(['claudeKey', 'geminiKey'], function(result) {
              console.log('Verification - API keys in sync storage:', 
                result.claudeKey ? 'Claude key present' : 'Claude key missing',
                result.geminiKey ? 'Gemini key present' : 'Gemini key missing'
              );
            });
          });
        });
      }
      
      // Call the sync function after dashboard loads
      syncApiKeysToStorage();

      // Get elements from the error location section
      const restartFromErrorLocationBtn = document.getElementById('restartFromErrorLocationBtn');
      const skipToCodeCaptureBtn = document.getElementById('skipToCodeCaptureBtn');
      
      // Add listeners for error location buttons
      if (restartFromErrorLocationBtn) {
        restartFromErrorLocationBtn.addEventListener('click', function() {
          captureWorkflowState.step = 'error_capture';
          captureWorkflowState.error = null;
          captureWorkflowState.code = null;
          captureWorkflowState.fileInfo = null;
          updateCaptureWorkflowUI();
          
          // Start error capture again
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, {action: "startCaptureWorkflow"});
            }
          });
        });
      }
      
      if (skipToCodeCaptureBtn) {
        skipToCodeCaptureBtn.addEventListener('click', function() {
          // Move to code capture step
          captureWorkflowState.step = 'code_capture';
          updateCaptureWorkflowUI();
          
          // Tell content script to start code capture
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, {action: "captureCode"});
            }
          });
        });
      }
    });
  }

  // Function to show premium required message
  function showPremiumRequiredMessage() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'premium-modal';
    modalDiv.innerHTML = `
      <div class="premium-modal-content">
        <h3>Free Trial Limit Reached</h3>
        <p>You have used all 5 of your free trial fixes.</p>
        <p>To continue using Lightning Bolt Bug Zapper, please upgrade to premium.</p>
        <div class="premium-actions">
          <button id="upgradePremiumBtn" class="primary-button">Upgrade Now</button>
          <button id="closePremiumModalBtn" class="secondary-button">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
    
    // Add premium modal styles
    const stylesheet = document.querySelector('#capture-workflow-styles');
    const premiumStyles = `
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
    `;
    
    if (stylesheet) {
      stylesheet.textContent += premiumStyles;
    }
    
    // Add event listeners
    document.getElementById('upgradePremiumBtn').addEventListener('click', function() {
      chrome.runtime.sendMessage({type: "PURCHASE_LICENSE"}, function(response) {
        if (response && response.success && response.url) {
          chrome.tabs.create({url: response.url});
        } else {
          showError("Could not open upgrade page. Please try again later.");
        }
        modalDiv.remove();
      });
    });
    
    document.getElementById('closePremiumModalBtn').addEventListener('click', function() {
      modalDiv.remove();
    });
  }
}); 