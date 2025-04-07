-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subscription_status TEXT NOT NULL DEFAULT 'free_trial',
  free_trial_fixes_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fixes history table
CREATE TABLE IF NOT EXISTS fixes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  code_snippet TEXT NOT NULL,
  fixed_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add fix_feedback table for tracking fix attempts and user feedback
CREATE TABLE public.fix_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_message TEXT NOT NULL,
  code_context TEXT NOT NULL,
  fixed_code TEXT NOT NULL,
  selected_model TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'none')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  fix_successful BOOLEAN,
  fix_applied BOOLEAN,
  additional_notes TEXT
);

-- Set up Row Level Security (RLS)
-- Profiles: Users can only read, insert, and update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to manage all profiles
CREATE POLICY "Service role can manage all profiles"
  ON profiles
  USING (auth.jwt() ->> 'role' = 'service_role');

-- API Keys: Users can only read, insert, update, and delete their own API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Allow service role to manage all API keys
CREATE POLICY "Service role can manage all API keys"
  ON api_keys
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Fixes: Users can only read and insert their own fixes
ALTER TABLE fixes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fixes"
  ON fixes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fixes"
  ON fixes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all fixes
CREATE POLICY "Service role can manage all fixes"
  ON fixes
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add RLS policies for fix_feedback
ALTER TABLE public.fix_feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own feedback
CREATE POLICY "Users can view their own feedback"
  ON public.fix_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.fix_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own feedback
CREATE POLICY "Users can update their own feedback"
  ON public.fix_feedback
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX fix_feedback_user_id_idx ON public.fix_feedback(user_id);
CREATE INDEX fix_feedback_timestamp_idx ON public.fix_feedback(timestamp);
CREATE INDEX fix_feedback_model_idx ON public.fix_feedback(selected_model);

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.fix_feedback TO authenticated;

-- Create view for admins to analyze fix performance
CREATE VIEW public.fix_performance_analytics AS
SELECT
  selected_model,
  feedback_type,
  COUNT(*) as count,
  EXTRACT(MONTH FROM timestamp) as month,
  EXTRACT(YEAR FROM timestamp) as year
FROM
  public.fix_feedback
GROUP BY
  selected_model, feedback_type, month, year;

-- Grant access to the analytics view
GRANT SELECT ON public.fix_performance_analytics TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_fixes_user_id ON fixes(user_id);

-- Create a function to ensure a user profile exists
-- This function can be called from client-side and will safely create a profile if needed
CREATE OR REPLACE FUNCTION ensure_user_profile(
  user_id UUID,
  display_name TEXT,
  user_email TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_exists BOOLEAN;
  result JSONB;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id
  ) INTO profile_exists;

  -- If profile doesn't exist, create it
  IF NOT profile_exists THEN
    -- Verify that the user ID is valid by checking auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'User ID does not exist in auth system'
      );
    END IF;

    -- Create the profile
    INSERT INTO profiles (
      id,
      display_name,
      email,
      subscription_status,
      free_trial_fixes_used,
      created_at,
      updated_at
    ) VALUES (
      user_id,
      display_name,
      user_email,
      'free_trial',
      0,
      NOW(),
      NOW()
    );

    result := jsonb_build_object(
      'success', true,
      'created', true,
      'message', 'Profile created successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', true,
      'created', false,
      'message', 'Profile already exists'
    );
  END IF;

  RETURN result;
END;
$$;
