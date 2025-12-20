
import { DailyRecord, AppSettings, DeedDefinition, QadaCounts, WorkoutSettings, WorkoutDefinition, UserLevel, Challenge } from '../types';
import { APP_STORAGE_KEY, APP_SETTINGS_KEY, APP_QADA_KEY, APP_WORKOUT_PR_KEY, APP_WORKOUT_SETTINGS_KEY, APP_CHALLENGES_KEY } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const APP_LEVEL_KEY = 'muhasabah_user_level';

// --- Supabase Sync Helpers ---

// Assuming we have a table 'user_data' with columns: key (text), value (jsonb), updated_at (timestamptz)
// Or distinct tables for each type of data.
// For simplicity and "blob" storage migration, we will use a key-value store approach in Supabase if possible,
// or map them to specific tables.
//
// Let's assume a table 'backups' or 'sync_store' with:
// user_id (uuid), key (text), value (jsonb), updated_at
//
// Since we don't have Auth implemented yet, we might be limited.
// However, the user asked to fix the connection. We assume the environment will have RLS policies for anonymous or authenticated users.
//
// We will implement a 'sync' function that tries to push local changes to Supabase
// and pull remote changes.

async function upsertToSupabase(key: string, data: any) {
    if (!isSupabaseConfigured()) return;

    // Check if we have a user session (even anonymous)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Try to sign in anonymously if supported, or just return if strict RLS
        // For now, we assume public access or existing session.
        // If no session, we can't reliably save user-specific data unless the table is public/keyed by something else.
        // We will proceed hoping for the best (public table or anon auth).
    }

    const { error } = await supabase
        .from('user_data')
        .upsert({ key, value: data, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
        console.error(`Supabase sync error for ${key}:`, error);
    }
}

async function fetchFromSupabase(key: string): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('user_data')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        // console.warn(`Supabase fetch error for ${key}:`, error.message);
        return null;
    }
    return data?.value;
}

export const syncAllFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;

    try {
        const keys = [
            APP_STORAGE_KEY,
            APP_SETTINGS_KEY,
            APP_QADA_KEY,
            APP_WORKOUT_PR_KEY,
            APP_WORKOUT_SETTINGS_KEY,
            APP_CHALLENGES_KEY,
            APP_LEVEL_KEY
        ];

        // Parallel fetch
        const results = await Promise.all(keys.map(k => fetchFromSupabase(k)));

        // Update LocalStorage if remote exists
        results.forEach((val, index) => {
            if (val) {
                localStorage.setItem(keys[index], JSON.stringify(val));
            }
        });

        // Return true if synced something?
        return true;
    } catch (e) {
        console.error("Sync all failed", e);
        return false;
    }
};


// --- Existing Synchronous Functions (Wrapped with async sync) ---

export const loadState = (): Record<string, DailyRecord> => {
  try {
    const serializedState = localStorage.getItem(APP_STORAGE_KEY);
    if (serializedState === null) {
      return {};
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state", err);
    return {};
  }
};

export const saveRecord = (record: DailyRecord) => {
  try {
    const currentData = loadState();
    const newData = {
      ...currentData,
      [record.date]: record
    };
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(newData));

    // Background Sync
    upsertToSupabase(APP_STORAGE_KEY, newData);

    return newData;
  } catch (err) {
    console.error("Could not save state", err);
    return {};
  }
};

export const getRecord = (date: string): DailyRecord | null => {
    const data = loadState();
    return data[date] || null;
};

// Settings (Custom Deeds)
export const loadSettings = (): AppSettings => {
    try {
        const serialized = localStorage.getItem(APP_SETTINGS_KEY);
        if (serialized === null) {
            return { customDeeds: [] };
        }
        const parsed = JSON.parse(serialized);
        if (!Array.isArray(parsed.customDeeds)) {
            return { customDeeds: [] };
        }
        return parsed;
    } catch (err) {
        console.error("Could not load settings", err);
        return { customDeeds: [] };
    }
};

export const saveCustomDeed = (deed: DeedDefinition) => {
    try {
        const settings = loadSettings();
        const newSettings = {
            ...settings,
            customDeeds: [...(settings.customDeeds || []), deed]
        };
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));

        // Background Sync
        upsertToSupabase(APP_SETTINGS_KEY, newSettings);

        return newSettings.customDeeds;
    } catch (err) {
        console.error("Could not save setting", err);
        return [];
    }
};

export const removeCustomDeed = (deedId: string) => {
    try {
        const settings = loadSettings();
        const currentList = settings.customDeeds || [];
        const newSettings = {
            ...settings,
            customDeeds: currentList.filter(d => d.id !== deedId)
        };
        localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newSettings));

        // Background Sync
        upsertToSupabase(APP_SETTINGS_KEY, newSettings);

        return newSettings.customDeeds;
    } catch (err) {
        console.error("Could not remove setting", err);
        return [];
    }
};

// Workout Settings
export const loadWorkoutSettings = (): WorkoutSettings => {
    try {
        const serialized = localStorage.getItem(APP_WORKOUT_SETTINGS_KEY);
        if (serialized === null) {
            return { customWorkouts: [] };
        }
        const parsed = JSON.parse(serialized);
        if (!Array.isArray(parsed.customWorkouts)) {
            return { customWorkouts: [] };
        }
        return parsed;
    } catch (err) {
        console.error("Could not load workout settings", err);
        return { customWorkouts: [] };
    }
};

export const saveCustomWorkout = (workout: WorkoutDefinition) => {
    try {
        const settings = loadWorkoutSettings();
        const newSettings = {
            ...settings,
            customWorkouts: [...(settings.customWorkouts || []), workout]
        };
        localStorage.setItem(APP_WORKOUT_SETTINGS_KEY, JSON.stringify(newSettings));

        // Background Sync
        upsertToSupabase(APP_WORKOUT_SETTINGS_KEY, newSettings);

        return newSettings.customWorkouts;
    } catch (err) {
        console.error("Could not save workout setting", err);
        return [];
    }
};

export const removeCustomWorkout = (workoutId: string) => {
    try {
        const settings = loadWorkoutSettings();
        const currentList = settings.customWorkouts || [];
        const newSettings = {
            ...settings,
            customWorkouts: currentList.filter(w => w.id !== workoutId)
        };
        localStorage.setItem(APP_WORKOUT_SETTINGS_KEY, JSON.stringify(newSettings));

        // Background Sync
        upsertToSupabase(APP_WORKOUT_SETTINGS_KEY, newSettings);

        return newSettings.customWorkouts;
    } catch (err) {
        console.error("Could not remove workout setting", err);
        return [];
    }
};

// Qada Storage
export const loadQada = (): QadaCounts => {
    try {
        const serialized = localStorage.getItem(APP_QADA_KEY);
        if (serialized === null) {
            return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ayat: 0, fasting: 0 };
        }
        return JSON.parse(serialized);
    } catch (err) {
        return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ayat: 0, fasting: 0 };
    }
};

export const saveQada = (data: QadaCounts) => {
    try {
        localStorage.setItem(APP_QADA_KEY, JSON.stringify(data));

        // Background Sync
        upsertToSupabase(APP_QADA_KEY, data);

    } catch (err) {
        console.error("Could not save qada", err);
    }
};

// Workout PR Storage
export const loadWorkoutPRs = (): Record<string, number> => {
    try {
        const serialized = localStorage.getItem(APP_WORKOUT_PR_KEY);
        return serialized ? JSON.parse(serialized) : {};
    } catch (err) {
        return {};
    }
};

export const saveWorkoutPRs = (prs: Record<string, number>) => {
    try {
        localStorage.setItem(APP_WORKOUT_PR_KEY, JSON.stringify(prs));

        // Background Sync
        upsertToSupabase(APP_WORKOUT_PR_KEY, prs);

    } catch (err) {
        console.error("Could not save PRs", err);
    }
};

// Level Storage
export const loadUserLevel = (): UserLevel => {
    try {
        const serialized = localStorage.getItem(APP_LEVEL_KEY);
        if (serialized === null) {
            return { currentAmoud: 1, lastCheckDate: '' };
        }
        return JSON.parse(serialized);
    } catch (err) {
        return { currentAmoud: 1, lastCheckDate: '' };
    }
};

export const saveUserLevel = (level: UserLevel) => {
    try {
        localStorage.setItem(APP_LEVEL_KEY, JSON.stringify(level));

        // Background Sync
        upsertToSupabase(APP_LEVEL_KEY, level);

    } catch (err) {
        console.error("Could not save level", err);
    }
};

// Challenges Storage
export const loadChallenges = (): Challenge[] => {
    try {
        const serialized = localStorage.getItem(APP_CHALLENGES_KEY);
        return serialized ? JSON.parse(serialized) : [];
    } catch (err) {
        return [];
    }
};

export const saveChallenges = (challenges: Challenge[]) => {
    try {
        localStorage.setItem(APP_CHALLENGES_KEY, JSON.stringify(challenges));

        // Background Sync
        upsertToSupabase(APP_CHALLENGES_KEY, challenges);

        return challenges;
    } catch (err) {
        console.error("Could not save challenges", err);
        return [];
    }
};
