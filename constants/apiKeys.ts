// API Keys for the application
// These are loaded from environment variables for security
// See .env.example for required variables

// Using the TheMealDB free API instead of Spoonacular due to quota limits
export const SPOONACULAR_API_KEY =
  process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || "";

// TheMealDB has a free API we can use as fallback
export const THEMEALDB_API_KEY =
  process.env.EXPO_PUBLIC_THEMEALDB_API_KEY || "1";

// UPC Database for barcode scanning
export const UPC_DATABASE_API_KEY =
  process.env.EXPO_PUBLIC_UPC_DATABASE_API_KEY || "";
