
import { DailyRecord, AppSettings, DeedDefinition, QadaCounts, WorkoutSettings, WorkoutDefinition, UserLevel, Challenge } from '../types';
import { APP_STORAGE_KEY, APP_SETTINGS_KEY, APP_QADA_KEY, APP_WORKOUT_PR_KEY, APP_WORKOUT_SETTINGS_KEY, APP_CHALLENGES_KEY } from '../constants';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const APP_LEVEL_KEY = 'muhasabah_user_level';

// In-memory store
const memoryStore: Record<string, any> = {};

// Helper to access memory store
const getFromMemory = (key: string): any => {
    return memoryStore[key] || null;
}

const saveToMemory = (key: string, value: any) => {
    memoryStore[key] = value;
}

// --- Supabase Sync Helpers ---

async function upsertDailyRecordToSupabase(record: any) {
    if (!isSupabaseConfigured()) return;

    // Convert updatedAt to updated_at if needed, but the current schema in types.ts says updatedAt.
    // However, Supabase DBs usually use snake_case.
    // Given the previous error log showed "updated_at: Date.now()", it's possible the user tried to change it.
    // But since the project uses 'updatedAt' throughout the frontend, we should map it here if the DB expects updated_at.
    // For now, we will send 'updated_at' to be safe, assuming the DB has that column.

    const recordForDb = {
        ...record,
        updated_at: new Date(record.updatedAt || Date.now()).toISOString()
    };
    // remove camelCase updatedAt if DB doesn't want it, but usually extra fields are ignored or stored in JSONB.
    // If 'daily_records' is a typed table, we should match columns.
    // If we don't know the schema, we stick to what we have or map common fields.

    const { error } = await supabase
        .from('daily_records')
        .upsert(recordForDb, { onConflict: 'date' });

    if (error) {
        console.error(`Supabase sync error for daily_records:`, error);
    }
}

async function fetchAllDailyRecordsFromSupabase(): Promise<Record<string, DailyRecord> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('daily_records')
        .select('*');

    if (error) {
        console.error(`Supabase fetch error for daily_records:`, error.message);
        return null;
    }

    if (!data) return {};

    // Convert array of records to the expected Record<string, DailyRecord> format
    return data.reduce((acc, record) => {
        // Map back snake_case to camelCase if needed
        const mappedRecord = {
            ...record,
            updatedAt: record.updated_at ? new Date(record.updated_at).getTime() : Date.now()
        };
        acc[record.date] = mappedRecord;
        return acc;
    }, {} as Record<string, DailyRecord>);
}

async function upsertToSupabase(key: string, data: any) {
    if (!isSupabaseConfigured()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Handle anonymous or public access
    }

    const { error } = await supabase
        .from('app_data')
        .upsert({ key, value: data, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
        console.error(`Supabase sync error for ${key}:`, error);
    }
}

async function fetchFromSupabase(key: string): Promise<any | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('app_data')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        return null;
    }
    return data?.value;
}

export const syncAllFromSupabase = async () => {
    if (!isSupabaseConfigured()) return;

    try {
        const keys = [
            APP_SETTINGS_KEY,
            APP_QADA_KEY,
            APP_WORKOUT_PR_KEY,
            APP_WORKOUT_SETTINGS_KEY,
            APP_CHALLENGES_KEY,
            APP_LEVEL_KEY
        ];

        // 1. Fetch all daily records and update memory store for APP_STORAGE_KEY
        const dailyRecords = await fetchAllDailyRecordsFromSupabase();
        if (dailyRecords) {
            saveToMemory(APP_STORAGE_KEY, dailyRecords);
        }

        // 2. Parallel fetch for other app data (key-value store)
        const results = await Promise.all(keys.map(k => fetchFromSupabase(k)));

        // Update Memory Store if remote exists
        results.forEach((val, index) => {
            if (val) {
                saveToMemory(keys[index], val);
            }
        });

        return true;
    } catch (e) {
        console.error("Sync all failed", e);
        return false;
    }
};


// --- Existing Synchronous Functions (Wrapped with async sync) ---

export const loadState = (): Record<string, DailyRecord> => {
  try {
    const data = getFromMemory(APP_STORAGE_KEY) as Record<string, DailyRecord> | null;
    if (data === null || typeof data !== 'object') {
      return {};
    }
    return data;
  } catch (err) {
    console.error("Could not load state", err);
    return {};
  }
};

export const saveRecord = (record: DailyRecord) => {
  // We need to ensure the record object only contains fields present in the daily_records table
  const { date, scores, sins, custom_titles, report, total_average, performed_qada, workouts, updatedAt } = record;
  const recordToSave = { date, scores, sins, custom_titles, report, total_average, performed_qada, workouts, updatedAt: updatedAt || Date.now() };
  try {
    const currentData = loadState();
    const newData = {
      ...currentData,
      [record.date]: record
    };
    saveToMemory(APP_STORAGE_KEY, newData);

    // Background Sync
    upsertDailyRecordToSupabase(recordToSave);

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
        const data = getFromMemory(APP_SETTINGS_KEY);
        if (data === null) {
            return { customDeeds: [] };
        }
        if (!Array.isArray(data.customDeeds)) {
            return { customDeeds: [] };
        }
        return data;
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
        saveToMemory(APP_SETTINGS_KEY, newSettings);

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
        saveToMemory(APP_SETTINGS_KEY, newSettings);

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
        const data = getFromMemory(APP_WORKOUT_SETTINGS_KEY);
        if (data === null) {
            return { customWorkouts: [] };
        }
        if (!Array.isArray(data.customWorkouts)) {
            return { customWorkouts: [] };
        }
        return data;
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
        saveToMemory(APP_WORKOUT_SETTINGS_KEY, newSettings);

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
        saveToMemory(APP_WORKOUT_SETTINGS_KEY, newSettings);

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
        const data = getFromMemory(APP_QADA_KEY);
        if (data === null) {
            return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ayat: 0, fasting: 0 };
        }
        return data;
    } catch (err) {
        return { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ayat: 0, fasting: 0 };
    }
};

export const saveQada = (data: QadaCounts) => {
    try {
        saveToMemory(APP_QADA_KEY, data);

        // Background Sync
        upsertToSupabase(APP_QADA_KEY, data);

    } catch (err) {
        console.error("Could not save qada", err);
    }
};

// Workout PR Storage
export const loadWorkoutPRs = (): Record<string, number> => {
    try {
        const data = getFromMemory(APP_WORKOUT_PR_KEY);
        return data ? data : {};
    } catch (err) {
        return {};
    }
};

export const saveWorkoutPRs = (prs: Record<string, number>) => {
    try {
        saveToMemory(APP_WORKOUT_PR_KEY, prs);

        // Background Sync
        upsertToSupabase(APP_WORKOUT_PR_KEY, prs);

    } catch (err) {
        console.error("Could not save PRs", err);
    }
};

// Level Storage
export const loadUserLevel = (): UserLevel => {
    try {
        const data = getFromMemory(APP_LEVEL_KEY);
        if (data === null) {
            return { currentAmoud: 1, lastCheckDate: '' };
        }
        return data;
    } catch (err) {
        return { currentAmoud: 1, lastCheckDate: '' };
    }
};

export const saveUserLevel = (level: UserLevel) => {
    try {
        saveToMemory(APP_LEVEL_KEY, level);

        // Background Sync
        upsertToSupabase(APP_LEVEL_KEY, level);

    } catch (err) {
        console.error("Could not save level", err);
    }
};

// Challenges Storage
export const loadChallenges = (): Challenge[] => {
    try {
        const data = getFromMemory(APP_CHALLENGES_KEY);
        return data ? data : [];
    } catch (err) {
        return [];
    }
};

export const saveChallenges = (challenges: Challenge[]) => {
    try {
        saveToMemory(APP_CHALLENGES_KEY, challenges);

        // Background Sync
        upsertToSupabase(APP_CHALLENGES_KEY, challenges);

        return challenges;
    } catch (err) {
        console.error("Could not save challenges", err);
        return [];
    }
};
