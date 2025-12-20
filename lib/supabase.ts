
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseKey.length > 0;
};

// Lazily create the client or creating a valid one is required.
// If URL is empty, createClient throws.
// We can wrap it or export a safe accessor.

let client: SupabaseClient;

if (isSupabaseConfigured()) {
    client = createClient(supabaseUrl, supabaseKey);
} else {
    // Create a dummy client or handle calls safely.
    // However, the types are strict.
    // We can cast a mock object, but it's risky for type safety.
    // A better way is to check `isSupabaseConfigured` before using `supabase`.
    // But `services/storage.ts` imports `supabase`.

    // We'll create a dummy client that warns if used, OR just don't crash.
    // To avoid crash on `createClient('', '')`, we pass dummy valid-looking strings if needed,
    // OR we export `null` and force check.
    // But modifying all consumers to check for null is annoying.

    // Trick: export a proxy or a dummy client.
    // If we pass a dummy URL, it won't crash until we make a request.
    client = createClient('https://placeholder.supabase.co', 'placeholder');
}

export const supabase = client;
