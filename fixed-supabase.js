// Fixed Supabase client for Lightning Bolt Bug Zapper extension

// Create a global supabaseDB object to handle database operations
window.supabaseDB = {
  client: null,
  
  // Initialize the Supabase client
  async init() {
    try {
      console.log('Initializing Supabase client...');
      
      // Check if Supabase is already loaded
      if (!window.supabase) {
        console.error('Supabase client not found in window object');
        await this.loadSupabaseScript();
      }
      
      // Initialize Supabase client
      const supabaseUrl = 'https://xuktzhjeqsywtfdlzxpi.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1a3R6aGplcXN5d3RmZGx6eHBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3ODc1MTMsImV4cCI6MjA1OTM2MzUxM30.Ar0ImorooUONYLTpHKnkPbJDvaj6JWt1M-xZr0Fc4LI';
      
      // CRITICAL FIX: Use window.supabase instead of just supabase
      this.client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      
      // Test the client with a simple query
      const { data, error } = await this.client.from('profiles').select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error testing Supabase client:', error);
        return false;
      }
      
      console.log('Supabase client initialized and tested successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      return false;
    }
  },
  
  // Load Supabase script
  async loadSupabaseScript() {
    return new Promise((resolve, reject) => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = () => {
          console.log('Supabase script loaded successfully');
          resolve();
        };
        script.onerror = (error) => {
          console.error('Error loading Supabase script:', error);
          reject(error);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error creating Supabase script element:', error);
        reject(error);
      }
    });
  },
  
  // User authentication and management
  async registerUser(userData) {
    try {
      console.log('Registering user with Supabase...');
      console.log('User data:', userData);
      
      // Make sure client is initialized
      if (!this.client) {
        await this.init();
      }
      
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await this.client.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            display_name: userData.firstName
          }
        }
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        return null;
      }
      
      console.log('User registered successfully:', authData.user);
      const userId = authData.user.id;
      
      // Create profile record
      const { error: profileError } = await this.client
        .from('profiles')
        .insert([
          {
            id: userId,
            display_name: userData.firstName,
            email: userData.email,
            subscription_status: 'free_trial',
            free_trial_fixes_used: 0
          }
        ]);
      
      if (profileError) {
        console.error('Profile error:', profileError);
        return null;
      }
      
      console.log('Profile created successfully');
      
      // Save API keys
      const keysToInsert = [];
      
      if (userData.claudeKey) {
        keysToInsert.push({
          user_id: userId,
          provider: 'claude',
          api_key: userData.claudeKey
        });
      }
      
      if (userData.geminiKey) {
        keysToInsert.push({
          user_id: userId,
          provider: 'gemini',
          api_key: userData.geminiKey
        });
      }
      
      if (keysToInsert.length > 0) {
        const { error: keyError } = await this.client
          .from('api_keys')
          .insert(keysToInsert);
        
        if (keyError) {
          console.error('API key error:', keyError);
          return null;
        }
        
        console.log('API keys saved successfully');
      }
      
      // Return the user object
      return {
        id: userId,
        firstName: userData.firstName,
        email: userData.email,
        display_name: userData.firstName,
        subscription_status: 'free_trial',
        free_trial_fixes_used: 0
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  },
  
  // Get user profile
  async getUser(userId) {
    try {
      console.log('Getting user profile...');
      
      // Make sure client is initialized
      if (!this.client) {
        await this.init();
      }
      
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },
  
  // Get user API keys
  async getUserAPIKeys(userId) {
    try {
      console.log('Getting user API keys...');
      
      // Make sure client is initialized
      if (!this.client) {
        await this.init();
      }
      
      const { data, error } = await this.client
        .from('api_keys')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error getting user API keys:', error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user API keys:', error);
      return [];
    }
  },
  
  // Update user profile
  async updateUser(userId, userData) {
    try {
      console.log('Updating user profile...');
      
      // Make sure client is initialized
      if (!this.client) {
        await this.init();
      }
      
      const { data, error } = await this.client
        .from('profiles')
        .update(userData)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('Error updating user profile:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }
};

// Create a simplified version of the saveToSupabase function and attach it to the window object
window.saveToSupabase = async function(user, password, claudeKey, geminiKey) {
  try {
    console.log('Starting saveToSupabase...');
    
    // Initialize Supabase client
    await window.supabaseDB.init();
    
    // Register user with Supabase
    const userData = {
      email: user.email,
      password: password,
      firstName: user.firstName || user.display_name,
      claudeKey: claudeKey,
      geminiKey: geminiKey
    };
    
    const result = await window.supabaseDB.registerUser(userData);
    
    if (!result) {
      console.error('Failed to register user with Supabase');
      return false;
    }
    
    console.log('User successfully registered with Supabase:', result);
    return true;
  } catch (error) {
    console.error('Error in saveToSupabase:', error);
    return false;
  }
}

// Export the saveToSupabase function for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { saveToSupabase };
}
