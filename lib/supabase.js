import { createClient } from '@supabase/supabase-js';

// Lazy Supabase client creation to avoid build-time errors
let supabaseInstance = null;

export function getSupabase() {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
}

// Export for backward compatibility (will error if called at module load time during SSR build)
// Components should migrate to using getSupabase() instead
export const supabase = typeof window !== 'undefined' ? null : null;
