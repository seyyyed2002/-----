
export type DeedType = 'binary' | 'scalar' | 'prayer' | 'golden';

export interface DeedDefinition {
  id: string;
  title: string;
  type: DeedType;
  isCustom?: boolean; // To identify user-added deeds
}

export interface SinDefinition {
  id: string;
  title: string;
}

export interface WorkoutDefinition {
    id: string;
    title: string;
    unit: string;
    isCustom?: boolean;
}

export interface DailyRecord {
  date: string; // ISO string YYYY-MM-DD
  scores: Record<string, number>; // map deedId to score
  sins?: string[]; // Array of Sin IDs (can contain duplicates)
  customTitles?: Record<string, string>; // map deedId to custom title (legacy for golden_custom)
  report: string;
  totalAverage: number;
  performedQada?: Record<string, number>; // map qadaKey (fajr, etc) to count performed that day
  workouts?: Record<string, number>; // map workoutId to count/value
  updatedAt: number;
}

export interface AppSettings {
  customDeeds: DeedDefinition[];
}

export interface WorkoutSettings {
    customWorkouts: WorkoutDefinition[];
}

// New Interface for Leveling System
export interface UserLevel {
    currentAmoud: number; // 1 to 100
    lastCheckDate: string; // ISO Date of the last time level up was processed
}

// Interface for Challenges (Chellah)
export interface Challenge {
    id: string;
    title: string;
    totalDays: number;
    startDate: string; // YYYY-MM-DD
    completedDates: string[]; // List of YYYY-MM-DD that were checked
    status: 'active' | 'success' | 'failed';
}

export interface AppState {
  records: Record<string, DailyRecord>; // map date string to record
  currentDate: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  record?: DailyRecord;
}

export interface QadaCounts {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  ayat: number;
  fasting: number;
}
