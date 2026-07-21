
export type DeedType = 'binary' | 'scalar' | 'prayer' | 'golden';

export type DeedCategory =
  | 'prayers_obligatory'   // نمازهای واجب (قفل شده)
  | 'prayers_optional'     // نمازهای مستحب
  | 'duas'                 // ادعیه و اذکار
  | 'quran'               // سوره‌های قرآن
  | 'ziyarat'             // زیارات
  | 'golden'              // اعمال طلایی
  | 'ethical'             // مراقبه‌های اخلاقی
  | 'charity'             // کارهای مستحب و خیر
  | 'knowledge'           // علم و خودسازی
  | 'physical'            // ریاضت بدنی و سلامت
  | 'sins'                // گناهان (قفل شده)
  | 'custom';             // سفارشی کاربر

export interface DeedLibraryItem {
  id: string;
  title: string;
  subtitle?: string;       // توضیح کوتاه
  category: DeedCategory;
  defaultType: 'binary' | 'scalar';
  defaultPoints: number;   // امتیاز پیشنهادی
  isBuiltIn: boolean;      // از قبل تعریف شده در کتابخانه
}

export interface ActiveDeed {
  id: string;              // unique id برای این عمل در دفتر کاربر
  libraryId: string;       // اشاره به DeedLibraryItem.id یا 'custom_' برای سفارشی
  title: string;           // عنوان (می‌تواند توسط کاربر تغییر کند)
  category: DeedCategory;
  type: 'binary' | 'scalar';
  points: number;          // امتیاز تنظیم شده توسط کاربر
  isLocked: boolean;       // true برای نماز واجب، گناهان، گزارش
  sortOrder: number;       // ترتیب نمایش
}

export interface DeedDefinition {
  id: string;
  title: string;
  type: DeedType;
  isCustom?: boolean;
  isActive?: boolean;
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
  date: string;
  scores: Record<string, number>;
  sins?: string[];
  custom_titles?: Record<string, string>;
  report: string;
  total_average: number;
  performed_qada?: Record<string, number>;
  workouts?: Record<string, number>;
  updated_at: number;
}

export interface DeedPreference {
  title?: string;
  isActive?: boolean;
}

export interface AppSettings {
  // سیستم جدید: دفتر مراقبه شخصی
  activeDeeds?: ActiveDeed[];
  
  // سیستم قدیمی (برای backward compatibility)
  customDeeds: DeedDefinition[];
  deedPreferences?: Record<string, DeedPreference>;
  deedOrder?: string[];
  
  // تنظیمات امتیازدهی
  scoringSystem?: 'weighted_average' | 'points_sum';
  targetPoints?: number;
  deedWeights?: Record<string, number>;
  sinPenalty?: number;
  goldenBonus?: Record<string, number>;
}

export interface WorkoutSettings {
    customWorkouts: WorkoutDefinition[];
}

export interface UserLevel {
    currentAmoud: number;
    lastCheckDate: string;
}

export interface Challenge {
    id: string;
    title: string;
    totalDays: number;
    startDate: string;
    completedDates: string[];
    status: 'active' | 'success' | 'failed';
}

export interface AppState {
  records: Record<string, DailyRecord>;
  currentDate: string;
}

export interface CalendarDay {
  date: string;
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
