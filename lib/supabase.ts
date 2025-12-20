
import { createClient, SupabaseClient, SupportedStorage } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseKey.length > 0;
};

// In-memory storage implementation for Supabase Auth
const inMemoryStorage: SupportedStorage = {
  getItem: (key: string) => {
    return memoryStore[key] || null;
  },
  setItem: (key: string, value: string) => {
    memoryStore[key] = value;
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  }
};

const memoryStore: Record<string, string> = {};

let client: SupabaseClient;

if (isSupabaseConfigured()) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: inMemoryStorage,
        persistSession: true, // It will persist in memoryStore, effectively session-only
        autoRefreshToken: true,
      }
    });
} else {
    // Create a dummy client with in-memory storage to prevent errors
    client = createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        storage: inMemoryStorage,
        persistSession: false
      }
    });
}

export const supabase = client;
