


import { DailyRecord, AppSettings, DeedDefinition, QadaCounts, WorkoutSettings, WorkoutDefinition, UserLevel, Challenge } from '../types';
import { APP_STORAGE_KEY, APP_SETTINGS_KEY, APP_QADA_KEY, APP_WORKOUT_PR_KEY, APP_WORKOUT_SETTINGS_KEY, APP_CHALLENGES_KEY } from '../constants';

const APP_LEVEL_KEY = 'muhasabah_user_level';

// ... (Existing functions: loadState, saveRecord, getRecord, Settings, Qada, Workout PRs) ...
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
        // Ensure customDeeds is always an array
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
        return challenges;
    } catch (err) {
        console.error("Could not save challenges", err);
        return [];
    }
};
