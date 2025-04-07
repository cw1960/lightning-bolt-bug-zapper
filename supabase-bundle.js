// Supabase client for vanilla JS
const supabaseUrl = "https://xuktzhjeqsywtfdlzxpi.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a3R6aGplcXN5d3RmZGx6eHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc1MTMsImV4cCI6MjA1OTM2MzUxM30.Ar0ImorooUONYLTpHKnkPbJDvaj6JWt1M-xZr0Fc4LI";

// Helper function to get session from chrome.storage.local
async function getStoredSession() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['supabase_session'], function(result) {
      console.log('Getting stored session:', result.supabase_session);
      resolve(result.supabase_session || null);
    });
  });
}

// Helper function to set session in chrome.storage.local
async function setStoredSession(session) {
  return new Promise((resolve) => {
    console.log('Setting session in storage:', session);
    chrome.storage.local.set({supabase_session: session}, function() {
      resolve();
    });
  });
}

// Helper function to remove session from chrome.storage.local
async function removeStoredSession() {
  return new Promise((resolve) => {
    console.log('Removing session from storage');
    chrome.storage.local.remove(['supabase_session'], function() {
      resolve();
    });
  });
}

// Function to initialize Supabase client
function initSupabase() {
  return {
    auth: {
      // Sign up a new user
      signUp: async function(email, password, metadata) {
        try {
          console.log('Signing up user:', email, 'with metadata:', metadata);
          const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'X-Client-Info': 'supabase-js/2.39.2'
            },
            body: JSON.stringify({
              email,
              password,
              data: metadata
            })
          });
          
          const data = await response.json();
          console.log('Signup response:', data);
          
          if (!response.ok) {
            throw new Error(data.message || 'Error signing up');
          }
          
          // Set logged in flag immediately after successful signup
          if (data && data.user) {
            console.log('Setting user_logged_in flag to true');
            
            // Set the logged-in flag to true
            chrome.storage.local.set({
              user_logged_in: true,
              user_id: data.user.id
            }, function() {
              console.log('User logged_in flag set to true');
            });
            
            // After successful signup, immediately sign in to get a session
            console.log('Signup successful, signing in to create session');
            const signInResult = await this.signIn(email, password);
            if (signInResult.error) {
              console.error('Auto sign-in after signup failed:', signInResult.error);
            } else {
              console.log('Auto sign-in after signup successful');
            }
          }
          
          return { data, error: null };
        } catch (error) {
          console.error('Signup error:', error);
          return { data: null, error };
        }
      },
      
      // Special function to ensure a user profile exists
      // This uses a server-side RPC function to bypass RLS policies
      ensureProfileExists: async function(userId, displayName, email) {
        try {
          console.log('Ensuring profile exists for user:', userId);
          if (!userId || !displayName || !email) {
            throw new Error('Missing user data for profile creation');
          }
          
          const session = await getStoredSession();
          if (!session || !session.access_token) {
            throw new Error('No active session found');
          }
          
          // Call a special server function endpoint that safely creates a profile
          // This uses the REST endpoint for RPC (Remote Procedure Call)
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/ensure_user_profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${session.access_token}`,
              'X-Client-Info': 'supabase-js/2.39.2'
            },
            body: JSON.stringify({
              user_id: userId,
              display_name: displayName,
              user_email: email
            })
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Error ensuring profile exists:', data);
            throw new Error(data.message || 'Error creating profile');
          }
          
          console.log('Profile ensure response:', data);
          return { data, error: null };
        } catch (error) {
          console.error('Error ensuring profile exists:', error);
          return { data: null, error };
        }
      },
      
      // Sign in a user
      signIn: async function(email, password) {
        try {
          console.log('Signing in user:', email);
          const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'X-Client-Info': 'supabase-js/2.39.2'
            },
            body: JSON.stringify({
              email,
              password
            })
          });
          
          const data = await response.json();
          console.log('Sign in response:', data);
          
          if (!response.ok) {
            throw new Error(data.message || 'Error signing in');
          }
          
          // Store the session in chrome.storage.local
          const session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Date.now() + data.expires_in * 1000,
            user: data.user
          };
          
          await setStoredSession(session);
          console.log('Session stored after sign in:', session);
          
          // Make sure to set the logged_in flag here too
          chrome.storage.local.set({
            user_logged_in: true
          }, function() {
            console.log('User logged_in flag set to true after sign in');
          });
          
          return { data, error: null };
        } catch (error) {
          console.error('Sign in error:', error);
          return { data: null, error };
        }
      },
      
      // Sign out a user
      signOut: async function() {
        try {
          const session = await getStoredSession();
          console.log('Signing out, current session:', session);
          
          if (!session) {
            return { error: null };
          }
          
          const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${session.access_token}`,
              'X-Client-Info': 'supabase-js/2.39.2'
            }
          });
          
          await removeStoredSession();
          
          // Remove the logged_in flag
          chrome.storage.local.set({
            user_logged_in: false
          }, function() {
            console.log('User logged_in flag set to false after sign out');
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Error signing out');
          }
          
          return { error: null };
        } catch (error) {
          console.error('Sign out error:', error);
          await removeStoredSession();
          
          // Even if there's an error, make sure to remove the logged_in flag
          chrome.storage.local.set({
            user_logged_in: false
          }, function() {
            console.log('User logged_in flag set to false after sign out error');
          });
          
          return { error };
        }
      },
      
      // Get the current session
      getSession: async function() {
        try {
          const session = await getStoredSession();
          console.log('Getting session, current session:', session);
          
          if (!session) {
            console.log('No session found');
            return { data: { session: null }, error: null };
          }
          
          // Check if the session is expired
          if (session.expires_at < Date.now()) {
            console.log('Session expired, attempting to refresh');
            // Session is expired, refresh it
            if (session.refresh_token) {
              console.log('Using refresh token to renew session');
              const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseAnonKey,
                  'X-Client-Info': 'supabase-js/2.39.2'
                },
                body: JSON.stringify({
                  refresh_token: session.refresh_token
                })
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('Session refresh response:', data);
                
                // Update the session
                const newSession = {
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                  expires_at: Date.now() + data.expires_in * 1000,
                  user: session.user // Keep the user data
                };
                
                await setStoredSession(newSession);
                console.log('Session refreshed and stored');
                
                // Make sure logged_in is still true
                chrome.storage.local.set({
                  user_logged_in: true
                }, function() {
                  console.log('User logged_in flag confirmed after session refresh');
                });
                
                return { data: { session: newSession }, error: null };
              } else {
                // Failed to refresh, clear the session
                console.log('Failed to refresh session, clearing it');
                await removeStoredSession();
                
                // Also clear logged_in flag
                chrome.storage.local.set({
                  user_logged_in: false
                }, function() {
                  console.log('User logged_in flag set to false after failed refresh');
                });
                
                return { data: { session: null }, error: null };
              }
            } else {
              // No refresh token, clear the session
              console.log('No refresh token, clearing session');
              await removeStoredSession();
              
              // Also clear logged_in flag
              chrome.storage.local.set({
                user_logged_in: false
              }, function() {
                console.log('User logged_in flag set to false due to missing refresh token');
              });
              
              return { data: { session: null }, error: null };
            }
          }
          
          console.log('Valid session found:', session);
          
          // Make sure logged_in is true
          chrome.storage.local.set({
            user_logged_in: true
          }, function() {
            console.log('User logged_in flag confirmed for valid session');
          });
          
          return { data: { session }, error: null };
        } catch (error) {
          console.error('Get session error:', error);
          return { data: { session: null }, error };
        }
      },
      
      // Get user from session
      getUser: async function() {
        try {
          console.log('Getting user from session');
          const { data, error } = await this.getSession();
          
          if (error || !data.session) {
            console.log('No session or error getting session');
            return { data: { user: null }, error: error || null };
          }
          
          console.log('User from session:', data.session.user);
          return { data: { user: data.session.user }, error: null };
        } catch (error) {
          console.error('Get user error:', error);
          return { data: { user: null }, error };
        }
      }
    },
    
    // Database operations
    from: function(table) {
      // Create a query builder object for easy chaining
      const queryBuilder = {
        // Store filters and query parameters
        filters: {},
        tableName: table,
        columns: '*',
        
        // Select data with filter chaining support
        select: function(columns = '*') {
          this.columns = columns;
          return this;
        },
        
        // Filter by equals
        eq: function(column, value) {
          this.filters[column] = value;
          return this;
        },
        
        // Execute the query with all filters applied
        async execute() {
          try {
            console.log(`Executing query on "${this.tableName}" with columns "${this.columns}" and filters:`, this.filters);
            const session = await getStoredSession();
            
            // Build the URL with filters
            let url = `${supabaseUrl}/rest/v1/${this.tableName}?select=${this.columns}`;
            
            // Add filters if any
            Object.keys(this.filters).forEach(key => {
              url += `&${key}=eq.${this.filters[key]}`;
            });
            
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${supabaseAnonKey}`,
                'X-Client-Info': 'supabase-js/2.39.2'
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Error executing query on "${this.tableName}":`, errorData);
              throw new Error(errorData.message || `Error querying ${this.tableName}`);
            }
            
            const responseData = await response.json();
            console.log(`Successfully executed query on "${this.tableName}":`, responseData);
            return { data: responseData, error: null };
          } catch (error) {
            console.error(`Query error for "${this.tableName}":`, error);
            return { data: null, error };
          }
        }
      };
      
      // Enhance the query builder to automatically execute when certain methods are called
      const enhancedBuilder = {
        select: function(columns = '*') {
          return queryBuilder.select(columns);
        },
        
        eq: function(column, value) {
          return queryBuilder.eq(column, value);
        },
        
        // Insert data into a table
        insert: async function(data) {
          try {
            console.log(`Inserting data into "${table}"`, data);
            const session = await getStoredSession();
            
            const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${supabaseAnonKey}`,
                'Prefer': 'return=minimal',
                'X-Client-Info': 'supabase-js/2.39.2'
              },
              body: JSON.stringify(data)
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Error inserting into "${table}":`, errorData);
              throw new Error(errorData.message || `Error inserting into ${table}`);
            }
            
            console.log(`Successfully inserted data into "${table}"`);
            return { data: true, error: null };
          } catch (error) {
            console.error(`Insert error for "${table}":`, error);
            return { data: null, error };
          }
        },
        
        // Update data in a table
        update: async function(data) {
          try {
            if (Object.keys(queryBuilder.filters).length === 0) {
              throw new Error('Update requires at least one filter (eq)');
            }
            
            console.log(`Updating data in "${table}" with filters:`, queryBuilder.filters);
            const session = await getStoredSession();
            
            // Build the URL with filters
            let url = `${supabaseUrl}/rest/v1/${table}`;
            
            // Add filters
            Object.keys(queryBuilder.filters).forEach((key, index) => {
              const prefix = index === 0 ? '?' : '&';
              url += `${prefix}${key}=eq.${queryBuilder.filters[key]}`;
            });
            
            const response = await fetch(url, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseAnonKey,
                'Authorization': session ? `Bearer ${session.access_token}` : `Bearer ${supabaseAnonKey}`,
                'Prefer': 'return=minimal',
                'X-Client-Info': 'supabase-js/2.39.2'
              },
              body: JSON.stringify(data)
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Error updating "${table}":`, errorData);
              throw new Error(errorData.message || `Error updating ${table}`);
            }
            
            console.log(`Successfully updated data in "${table}"`);
            return { data: true, error: null };
          } catch (error) {
            console.error(`Update error for "${table}":`, error);
            return { data: null, error };
          }
        }
      };
      
      // Override the toString method to make the builder auto-execute when treated as a Promise
      queryBuilder.then = function(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
      };
      
      return enhancedBuilder;
    }
  };
}

// Initialize Supabase client
const supabase = initSupabase(); 