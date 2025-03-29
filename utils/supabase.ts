import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration with real credentials
const supabaseUrl = 'https://udhmqpwaysikuompqyxy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkaG1xcHdheXNpa3VvbXBxeXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDUzODAsImV4cCI6MjA1ODc4MTM4MH0.MMTtubV97B67bVNQy3HO9TBgzd4a-S7y088ZUEahH5g';

// Create a Supabase client configured to use AsyncStorage for local storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to validate supabase connection is working
export const validateSupabaseConnection = async () => {
  try {
    // For development in Expo Go without DB tables, we'll simulate success
    if (__DEV__) {
      console.log('DEV MODE: Simulating Supabase connection success');
      return true;
    }
    
    // For production or development builds, do a real connection test
    const { data, error } = await supabase.from('pantry_items').select('count', { count: 'exact' });
    if (error) throw error;
    console.log('Supabase connection test: success');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    console.log('Supabase connection test: failed');
    return false;
  }
}; 