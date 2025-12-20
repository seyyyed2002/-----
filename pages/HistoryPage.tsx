
import React, { useMemo, useState, useEffect } from 'react';
import { loadState, loadSettings, loadWorkoutSettings } from '../services/storage';
import { DailyRecord } from '../types';
import { DEEDS, SINS_LIST, QADA_ITEMS, WORKOUTS, toPersianDigits } from '../constants';
import { 
  Activity, 
  Archive,
  Dumbbell,
  AlertTriangle,
  List,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Target,
  Sparkles,
  ArrowLeftRight,
  PieChart as PieIcon,
  HeartHandshake,
  BookOpen,
  CalendarCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Legend,
  AreaChart
} from 'recharts';

interface HistoryPageProps {
    isDark?: boolean;
}

type TimeRange = 'week' | 'month' | 'year';

// Pre-defined analysis scenarios
type AnalysisScenario = 'general' | 'prayer_impact' | 'sin_impact' | 'stability';

export const HistoryPage: React.FC<HistoryPageProps> = ({ isDark }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [scenario, setScenario] = useState<AnalysisScenario>('general');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');

  // Load Data
  const { records, allDeeds, allWorkouts } = useMemo(() => {
    const data = loadState();
    const settings = loadSettings();
    const workoutSettings = loadWorkoutSettings();
    
    const customDeeds = settings.customDeeds || [];
    const combinedDeeds = [...DEEDS, ...customDeeds];
    
    const customWorkouts = workoutSettings.customWorkouts || [];
    const combinedWorkouts = [...WORKOUTS, ...customWorkouts];
    
    const list: DailyRecord[] = Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
    return { records: list, allDeeds: combinedDeeds, allWorkouts: combinedWorkouts };
  }, []);

  // Set default selected workout
  useEffect(() => {
      if (allWorkouts.length > 0 && !selectedWorkoutId) {
          setSelectedWorkoutId(allWorkouts[0].id);
      }
  }, [allWorkouts, selectedWorkoutId]);

  // Filter Data
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    if (timeRange === 'week') cutoff.setDate(now.getDate() - 7);
    if (timeRange === 'month') cutoff.setDate(now.getDate() - 30);
    if (timeRange === 'year') cutoff.setFullYear(now.getFullYear() - 1);

    return records.filter(r => new Date(r.date) >= cutoff);
  }, [records, timeRange]);

  // --- Advanced Stats Calculation ---
  const stats = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    let totalScoreSum = 0;
    const deedStats: Record<string, { sum: number; count: number; max: number; trends: number[] }> = {};
    const sinCounts: Record<string, number> = {};
    let totalSinsRecorded = 0;
    
    // Qada & Workout Stats Containers
    const performedQadaStats: Record<string, number> = {};
    const workoutStats: Record<string, number> = {};
    let totalStarsEarned = 0;
    let totalSalawatCount = 0;
    const readingStats: Record<string, number> = {};

    // Initialize deed stats
    allDeeds.forEach(d => {
        deedStats[d.id] = { sum: 0, count: 0, max: 0, trends: [] };
    });

    const dailyData = filteredRecords.map(r => {
        totalScoreSum += r.total_average;
        
        // Sins
        const dailySinCount = (r.sins || []).length;
        totalSinsRecorded += dailySinCount;
        (r.sins || []).forEach(sinId => {
            sinCounts[sinId] = (sinCounts[sinId] || 0) + 1;
        });

        // Deeds
        const dayDeedScores: Record<string, number> = {};
        let dayStars = 0;

        allDeeds.forEach(d => {
            const score = r.scores[d.id] || 0;
            deedStats[d.id].sum += score;
            if (score > 0) deedStats[d.id].count += 1;
            if (score > deedStats[d.id].max) deedStats[d.id].max = score;
            
            deedStats[d.id].trends.push(score);
            dayDeedScores[d.id] = score;

            // Count stars
            if (d.type === 'golden' && score === 100) {
                const isDouble = d.id === 'golden_night_prayer' || d.id === 'golden_father_hand' || d.id === 'golden_mother_hand';
                const stars = isDouble ? 2 : 1;
                dayStars += stars;

                // Salawat Counter
                if (d.id === 'golden_salawat') {
                    totalSalawatCount += 100;
                }
            }

            // Reading Stats (Binary Deeds)
            if (d.type === 'binary' && score === 100) {
                readingStats[d.id] = (readingStats[d.id] || 0) + 1;
            }
        });
        totalStarsEarned += dayStars;

        // Qada Performed Today Sum
        let qadaPerformedToday = 0;
        if (r.performed_qada) {
            Object.entries(r.performed_qada).forEach(([key, count]) => {
                performedQadaStats[key] = (performedQadaStats[key] || 0) + (count as number);
                qadaPerformedToday += (count as number);
            });
        }

        // Workouts
        const dayWorkouts: Record<string, number> = {};
        if (r.workouts) {
            Object.entries(r.workouts).forEach(([key, val]) => {
                 const v = val as number;
                 if (v > 0) {
                     workoutStats[key] = (workoutStats[key] || 0) + v;
                     // Store with 'w_' prefix to avoid collision in Recharts
                     dayWorkouts[`w_${key}`] = v;
                 }
            });
        }

        // Category Averages for this day
        const getCatAvg = (type: string) => {
            const relevant = allDeeds.filter(d => d.type === type);
            if (!relevant.length) return 0;
            const sum = relevant.reduce((a, b) => a + (r.scores[b.id] || 0), 0);
            return sum / relevant.length;
        };

        return {
            date: r.date,
            name: new Date(r.date).toLocaleDateString('fa-IR', { day: 'numeric', month: 'short' }),
            total: r.total_average,
            sins_count: dailySinCount,
            prayer_avg: getCatAvg('prayer'),
            scalar_avg: getCatAvg('scalar'),
            binary_avg: getCatAvg('binary'),
            stars: dayStars,
            qada_count: qadaPerformedToday,
            ...dayDeedScores,
            ...dayWorkouts
        };
    });

    // Detailed Deed Analysis List
    const detailedDeeds = allDeeds.map(d => {
        const s = deedStats[d.id];
        const avg = s.trends.length ? s.sum / s.trends.length : 0;
        
        // Trend
        const mid = Math.floor(s.trends.length / 2);
        const firstHalf = s.trends.slice(0, mid);
        const secondHalf = s.trends.slice(mid);
        const avg1 = firstHalf.length ? firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length : 0;
        const avg2 = secondHalf.length ? secondHalf.reduce((a,b)=>a+b,0)/secondHalf.length : 0;
        const trend = avg2 - avg1;

        const consistency = s.trends.length ? (s.count / s.trends.length) * 100 : 0;

        return {
            ...d,
            average: avg,
            totalSum: s.sum,
            maxScore: s.max,
            frequency: s.count,
            trend: trend,
            consistency: consistency
        };
    }).sort((a,b) => b.average - a.average);

    // Strengths & Weaknesses
    const activeDeeds = detailedDeeds.filter(d => d.average > 0);
    const strengths = activeDeeds.slice(0, 3);
    const weaknesses = activeDeeds.length > 3 ? [...activeDeeds].reverse().slice(0, 3) : [];

    // Categories for Radar Chart
    const categoryRadar = [
        { subject: 'نمازها', A: dailyData.reduce((a,b) => a + b.prayer_avg, 0) / dailyData.length, fullMark: 100 },
        { subject: 'اخلاقیات', A: dailyData.reduce((a,b) => a + b.scalar_avg, 0) / dailyData.length, fullMark: 100 },
        { subject: 'قراردادی', A: dailyData.reduce((a,b) => a + b.binary_avg, 0) / dailyData.length, fullMark: 100 },
        { subject: 'امتیاز کل', A: totalScoreSum / filteredRecords.length, fullMark: 100 },
    ];

    // Sorted Readings
    const sortedReadings = Object.entries(readingStats)
        .map(([id, count]) => ({ 
            id, 
            title: allDeeds.find(d => d.id === id)?.title || id, 
            count 
        }))
        .sort((a,b) => b.count - a.count);

    return {
        avgScore: totalScoreSum / filteredRecords.length,
        totalSins: totalSinsRecorded,
        totalStars: totalStarsEarned,
        totalSalawat: totalSalawatCount,
        dailyData,
        detailedDeeds,
        strengths,
        weaknesses,
        categoryRadar,
        performedQadaStats,
        workoutStats,
        sortedReadings,
        topSins: Object.entries(sinCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({
            name: SINS_LIST.find(s => s.id === id)?.title || id,
            count
        }))
    };

  }, [filteredRecords, allDeeds]);

  // Selected Workout Data helper
  const selectedWorkout = allWorkouts.find(w => w.id === selectedWorkoutId);

  // --- Scenario Configs ---
  const getScenarioConfig = () => {
      switch(scenario) {
          case 'prayer_impact':
              return { 
                  k1: 'total', name1: 'امتیاز کل', color1: '#8b5cf6', 
                  k2: 'prayer_avg', name2: 'کیفیت نماز', color2: '#22c55e',
                  desc: 'بررسی رابطه بین کیفیت نمازها و امتیاز نهایی روزانه'
              };
          case 'sin_impact':
              return { 
                  k1: 'total', name1: 'امتیاز کل', color1: '#8b5cf6', 
                  k2: 'sins_count', name2: 'تعداد خطا', color2: '#ef4444',
                  desc: 'تأثیر تعداد خطاها بر امتیاز معنوی روزانه'
              };
          case 'stability':
             return { 
                  k1: 'scalar_avg', name1: 'اخلاقیات', color1: '#f59e0b', 
                  k2: 'binary_avg', name2: 'قراردادی', color2: '#3b82f6',
                  desc: 'مقایسه ثبات در اعمال اخلاقی (کیفی) نسبت به اعمال قراردادی (کمی)'
              };
          default: // general
              return { 
                  k1: 'total', name1: 'امتیاز کل', color1: '#8b5cf6', 
                  k2: null, name2: null, color2: null,
                  desc: 'روند کلی امتیازات شما در این بازه زمانی'
              };
      }
  };
  const sc = getScenarioConfig();

  // Helper for Trend Icons
  const getTrendIcon = (val: number) => {
      if (val > 2) return <ArrowUp className="w-3 h-3 text-green-500" />;
      if (val < -2) return <ArrowDown className="w-3 h-3 text-red-500" />;
      return <Minus className="w-3 h-3 text-gray-300" />;
  };

  if (!records.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600 animate-fade-in">
        <Activity className="w-12 h-12 mb-2 opacity-20" />
        <p>هنوز داده‌ای برای تحلیل ثبت نشده است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* 1. Time Range Controls */}
      <div className="bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex sticky top-20 z-10">
         {(['week', 'month', 'year'] as TimeRange[]).map((t) => (
             <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    timeRange === t 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
             >
                 {t === 'week' ? 'هفته گذشته' : t === 'month' ? 'ماه گذشته' : 'سال گذشته'}
             </button>
         ))}
      </div>

      {stats && (
        <>
            {/* 2. KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Score */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 mb-1">میانگین امتیاز</span>
                    <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                        {toPersianDigits(Math.round(stats.avgScore))}
                    </span>
                </div>
                {/* Sins */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
                    <span className="text-[10px] text-gray-400 mb-1">تعداد خطا</span>
                    <span className="text-2xl font-black text-red-500">
                        {toPersianDigits(stats.totalSins)}
                    </span>
                </div>
                {/* Stars */}
                <div className="bg-gradient-to-br from-yellow-400 to-amber-500 p-4 rounded-2xl shadow-lg shadow-yellow-500/20 flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] text-yellow-100 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> ستاره‌ها
                    </span>
                    <span className="text-2xl font-black">
                        {toPersianDigits(stats.totalStars)}
                    </span>
                </div>
                {/* Salawat */}
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-4 rounded-2xl shadow-lg shadow-teal-500/20 flex flex-col items-center justify-center text-white">
                    <span className="text-[10px] text-emerald-100 mb-1 flex items-center gap-1">
                        <HeartHandshake className="w-3 h-3" /> صلوات‌ها
                    </span>
                    <span className="text-lg font-black">
                        {toPersianDigits(stats.totalSalawat)}
                    </span>
                </div>
            </div>

            {/* 3. Strengths & Weaknesses (Reordered: now above table) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl p-4 border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2 mb-3 text-green-700 dark:text-green-400">
                        <Trophy className="w-4 h-4" />
                        <h3 className="font-bold text-sm">نقاط قوت شما</h3>
                    </div>
                    {stats.strengths.length > 0 ? (
                        <div className="space-y-2">
                            {stats.strengths.map(d => (
                                <div key={d.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{d.title}</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md">
                                        {toPersianDigits(Math.round(d.average))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-2">داده کافی موجود نیست</p>
                    )}
                </div>

                {/* Weaknesses */}
                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-2 mb-3 text-red-700 dark:text-red-400">
                        <Target className="w-4 h-4" />
                        <h3 className="font-bold text-sm">نیاز به تمرکز بیشتر</h3>
                    </div>
                    {stats.weaknesses.length > 0 ? (
                        <div className="space-y-2">
                            {stats.weaknesses.map(d => (
                                <div key={d.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm">
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{d.title}</span>
                                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">
                                        {toPersianDigits(Math.round(d.average))}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <p className="text-xs text-gray-400 text-center py-2">الحمدلله ضعف نمایانی نیست</p>
                    )}
                </div>
            </div>
            
            {/* 4. Reading Stats (Surah/Ziyarat) (Reordered: now above table) */}
            {stats.sortedReadings.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-200">
                        <BookOpen className="w-5 h-5 text-blue-500" />
                        <h2 className="font-bold">آمار تلاوت و زیارات</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {stats.sortedReadings.map(item => {
                            const maxCount = stats.sortedReadings[0].count;
                            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                            
                            return (
                                <div key={item.id} className="relative overflow-hidden bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-3 border border-blue-100 dark:border-blue-800/30 transition-all hover:border-blue-300 dark:hover:border-blue-700/50">
                                    <div 
                                        className="absolute bottom-0 right-0 h-1 bg-blue-400 dark:bg-blue-500 opacity-30 rounded-full mx-3 mb-1.5" 
                                        style={{ width: `calc(${percentage}% - 24px)` }}
                                    />
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate ml-2">
                                            {item.title}
                                        </span>
                                        <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
                                            <BookOpen className="w-3 h-3 text-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-1 mt-2">
                                        <span className="text-xl font-black text-blue-600 dark:text-blue-400 leading-none">
                                            {toPersianDigits(item.count)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mb-0.5">بار</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 5. Detailed Deed Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                 <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <List className="w-5 h-5 text-gray-500" />
                    <h2 className="font-bold text-gray-700 dark:text-gray-200">ریز عملکرد اعمال</h2>
                 </div>
                 <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-sm">
                         <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium">
                             <tr>
                                 <th className="px-4 py-3 text-right sticky right-0 bg-gray-50 dark:bg-gray-900/90 drop-shadow-sm">عنوان عمل</th>
                                 <th className="px-4 py-3 text-center whitespace-nowrap">میانگین</th>
                                 <th className="px-4 py-3 text-center whitespace-nowrap">روند</th>
                                 <th className="px-4 py-3 text-center whitespace-nowrap">پایبندی</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                             {stats.detailedDeeds.map(deed => (
                                 <tr key={deed.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                     <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium sticky right-0 bg-white dark:bg-gray-800 drop-shadow-sm">{deed.title}</td>
                                     <td className="px-4 py-3 text-center">
                                         <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                             deed.average >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                             deed.average >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                         }`}>
                                             {toPersianDigits(Math.round(deed.average))}
                                         </span>
                                     </td>
                                     <td className="px-4 py-3 text-center">
                                         <div className="flex items-center justify-center gap-1">
                                             {getTrendIcon(deed.trend)}
                                             <span className="text-xs text-gray-400" dir="ltr">
                                                {deed.trend !== 0 ? toPersianDigits(Math.abs(Math.round(deed.trend))) : '-'}
                                             </span>
                                         </div>
                                     </td>
                                     <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-500">
                                         {toPersianDigits(Math.round(deed.consistency))}%
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
            </div>

            {/* 6. Advanced Analyzer (Correlation Lab) */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-bold">آزمایشگاه همبستگی</h2>
                    </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                    <button 
                        onClick={() => setScenario('general')}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${scenario === 'general' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300' : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50'}`}
                    >
                        روند کلی
                    </button>
                    <button 
                        onClick={() => setScenario('prayer_impact')}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${scenario === 'prayer_impact' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50'}`}
                    >
                        تاثیر نماز
                    </button>
                    <button 
                        onClick={() => setScenario('sin_impact')}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${scenario === 'sin_impact' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300' : 'border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50'}`}
                    >
                        تاثیر خطاها
                    </button>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg text-center">
                    {sc.desc}
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={stats.dailyData}>
                            <defs>
                                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={sc.color1} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={sc.color1} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#f3f4f6'} />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: isDark ? '#9ca3af' : '#6b7280' }} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(val) => toPersianDigits(val)}
                            />
                            
                            <YAxis 
                                yAxisId="left"
                                orientation="left"
                                tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: sc.color1 }} 
                                axisLine={false}
                                tickLine={false}
                                width={30}
                                tickFormatter={(val) => toPersianDigits(val)}
                            />

                            {sc.k2 && (
                                <YAxis 
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: sc.color2! }} 
                                    axisLine={false}
                                    tickLine={false}
                                    width={30}
                                    tickFormatter={(val) => toPersianDigits(val)}
                                />
                            )}

                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: isDark ? '1px solid #374151' : 'none', 
                                    backgroundColor: isDark ? '#1f2937' : '#fff',
                                    color: isDark ? '#f3f4f6' : '#1f2937',
                                    fontFamily: 'Vazirmatn',
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: number, name: string) => {
                                    const label = name === sc.k1 ? sc.name1 : sc.name2;
                                    return [toPersianDigits(Number(value).toFixed(0)), label];
                                }}
                            />

                            <Area 
                                yAxisId="left"
                                type="monotone" 
                                dataKey={sc.k1} 
                                stroke={sc.color1} 
                                strokeWidth={3}
                                fill="url(#colorMain)" 
                            />

                            {sc.k2 && (
                                <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey={sc.k2} 
                                    stroke={sc.color2!} 
                                    strokeWidth={3}
                                    dot={false}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 7. Balance Radar & Sins */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2 w-full">
                        <PieIcon className="w-5 h-5 text-purple-500" />
                        <h2 className="font-bold text-gray-700 dark:text-gray-200">رادار تعادل</h2>
                    </div>
                    <div className="h-64 w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="45%" data={stats.categoryRadar}>
                                <PolarGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 11, fontFamily: 'Vazirmatn' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 120]} tick={false} axisLine={false} />
                                <Radar
                                    name="عملکرد"
                                    dataKey="A"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4 w-full">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <h2 className="font-bold text-gray-700 dark:text-gray-200">بیشترین خطاها</h2>
                    </div>
                    <div className="space-y-3">
                        {stats.topSins.length > 0 ? (
                            stats.topSins.map((s, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600 dark:text-gray-300 truncate pl-2">{s.name}</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-red-400" style={{ width: `${(s.count / filteredRecords.length) * 100}%` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-red-500 w-6 text-left">{toPersianDigits(s.count)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-8 text-xs">الحمدلله خطایی ثبت نشده است</div>
                        )}
                    </div>
                </div>
            </div>

            {/* 8. Qada Analysis (Timeline Area Chart) */}
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-3xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Archive className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="font-bold text-gray-700 dark:text-gray-200">روند ادای قضا</h2>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.dailyData}>
                            <defs>
                                <linearGradient id="colorQada" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: isDark ? '#9ca3af' : '#6b7280' }} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(val) => toPersianDigits(val)}
                            />
                            <YAxis 
                                orientation="left"
                                tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: isDark ? '#9ca3af' : '#6b7280' }} 
                                axisLine={false}
                                tickLine={false}
                                width={30}
                                tickFormatter={(val) => toPersianDigits(val)}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: isDark ? '1px solid #374151' : 'none', 
                                    backgroundColor: isDark ? '#1f2937' : '#fff',
                                    color: isDark ? '#f3f4f6' : '#1f2937',
                                    fontFamily: 'Vazirmatn',
                                    direction: 'rtl',
                                    textAlign: 'right'
                                }}
                                formatter={(value: number) => [toPersianDigits(value), "مورد ادا شده"]}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="qada_count" 
                                stroke="#6366f1" 
                                strokeWidth={3}
                                fill="url(#colorQada)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 9. Workout Analysis (Timeline Chart with Selector) */}
            <div className="bg-cyan-50 dark:bg-cyan-900/10 p-5 rounded-3xl shadow-sm border border-cyan-100 dark:border-cyan-900/30">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        <h2 className="font-bold text-gray-700 dark:text-gray-200">روند عملکرد ورزشی</h2>
                    </div>
                    
                    <select 
                        value={selectedWorkoutId}
                        onChange={(e) => setSelectedWorkoutId(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-cyan-200 dark:border-cyan-800 text-gray-700 dark:text-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        {allWorkouts.map(w => (
                            <option key={w.id} value={w.id}>{w.title} ({w.unit})</option>
                        ))}
                    </select>
                </div>
                
                <div className="h-64 w-full">
                    {selectedWorkoutId && (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.dailyData}>
                                <defs>
                                    <linearGradient id="colorWorkout" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#e5e7eb'} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: isDark ? '#9ca3af' : '#6b7280' }} 
                                    axisLine={false} 
                                    tickLine={false}
                                    tickFormatter={(val) => toPersianDigits(val)}
                                />
                                <YAxis 
                                    orientation="left"
                                    tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: isDark ? '#9ca3af' : '#6b7280' }} 
                                    axisLine={false}
                                    tickLine={false}
                                    width={30}
                                    tickFormatter={(val) => toPersianDigits(val)}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '12px', 
                                        border: isDark ? '1px solid #374151' : 'none', 
                                        backgroundColor: isDark ? '#1f2937' : '#fff',
                                        color: isDark ? '#f3f4f6' : '#1f2937',
                                        fontFamily: 'Vazirmatn',
                                        direction: 'rtl',
                                        textAlign: 'right'
                                    }}
                                    formatter={(value: number) => [
                                        toPersianDigits(value), 
                                        selectedWorkout ? selectedWorkout.unit : ''
                                    ]}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey={`w_${selectedWorkoutId}`} 
                                    stroke="#06b6d4" 
                                    strokeWidth={3}
                                    fill="url(#colorWorkout)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                    {!selectedWorkoutId && (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            لطفا یک تمرین را انتخاب کنید
                        </div>
                    )}
                </div>
            </div>

        </>
      )}
    </div>
  );
};
