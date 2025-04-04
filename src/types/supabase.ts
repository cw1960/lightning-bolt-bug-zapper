// Add UserSettings type
export type UserSettings = {
  id: string;
  user_id: string;
  claude_api_key: string | null;
  gemini_api_key: string | null;
  created_at: string;
  updated_at: string;
};
