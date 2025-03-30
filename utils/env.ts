// Environment variables and API keys
// These are loaded from .env file (see .env.example)

// OpenAI API key for AI features
export const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

// Google Cloud Vision API for image processing
export const GOOGLE_CLOUD_VISION_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY || "";

// Supabase Configuration
export const SUPABASE_URL = "https://udhmqpwaysikuompqyxy.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaG1xcHdheXNpa3VvbXBxeXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDUzODAsImV4cCI6MjA1ODc4MTM4MH0.MMTtubV97B67bVNQy3HO9TBgzd4a-S7y088ZUEahH5g";

// UPC Database API Key
export const UPC_DATABASE_API_KEY = "E08F735364A32F6FAFC0C06F803E0B9D";

// Spoonacular API Key
export const SPOONACULAR_API_KEY = "1c6f5046cf0442c4bcd7287c35495b5a";

// Replace with TheMealDB API key
export const THEMEALDB_API_KEY = "1"; // Using the test API key "1" for development

// Feature flags
export const USE_MOCK_OCR = process.env.EXPO_PUBLIC_USE_MOCK_OCR === "true";
