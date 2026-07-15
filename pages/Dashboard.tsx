import React, { useEffect, useMemo, useState } from 'react';
import { DEEDS, getTodayStr, toPersianDigits } from '../constants';
import { DailyRecord, DeedDefinition, DeedType } from '../types';
import {
  saveRecord,
  getRecord,
  loadSettings,
  saveCustomDeed,
  removeCustomDeed,
  loadQada,
  saveQada,
  saveActiveDeeds
} from '../services/storage';
import { DeedInput } from '../components/DeedInput';
import { SinInput } from '../components/SinInput';
import {
  Save,
  ChevronLeft,
  ChevronRight,
  Lock,
  Star,
  Plus,
  X,
  AlertCircle,
  Settings,
  Check,
  Trash2,
  BookOpen,
  Heart,
  Sparkles,
  Info,
  Sliders,
  CheckSquare,
  Bookmark,
  Activity,
  Layers,
  Wrench,
  HelpCircle
} from 'lucide-react';

interface DashboardProps {
  initialDate?: string;
  onDateChange?: (date: string) => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  obligatory: {
    label: 'نمازهای واجب',
    icon: <span className="text-emerald-500 font-bold">🕌</span>,
    color: 'border-emerald-100 dark:border-emerald-900/30'
  },
  supererogatory_prayers: {
    label: 'نمازهای مستحب',
    icon: <span className="text-teal-500">✨</span>,
    color: 'border-teal-100 dark:border-teal-900/30'
  },
  duas: {
    label: 'ادعیه و زیارات',
    icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
    color: 'border-indigo-100 dark:border-indigo-900/30'
  },
  quran: {
    label: 'سوره‌های قرآن',
    icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    color: 'border-blue-100 dark:border-blue-900/30'
  },
  recommended: {
    label: 'کارهای مستحب',
    icon: <Heart className="w-4 h-4 text-rose-500" />,
    color: 'border-rose-100 dark:border-rose-900/30'
  },
  morals: {
    label: 'مراقبه‌های خاص (اخلاقی)',
    icon: <Activity className="w-4 h-4 text-amber-500" />,
    color: 'border-amber-100 dark:border-amber-900/30'
  },
  golden: {
    label: 'اعمال طلایی (پاداش ویژه)',
    icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />,
    color: 'border-yellow-100 dark:border-yellow-900/30'
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ initialDate, onDateChange }) => {
  const [date, setDate] = useState(initialDate || getTodayStr());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [sins, setSins] = useState<string[]>([]);
  const [custom_titles, setCustomTitles] = useState<Record<string, string>>({});
  const [report, setReport] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [showQadaAdded, setShowQadaAdded] = useState(false);
  
  // Custom & Active Deeds State
  const [customDeeds, setCustomDeeds] = useState<DeedDefinition[]>([]);
  const [activeDeeds, setActiveDeeds] = useState<DeedDefinition[]>([]);

  // Builder Mode State
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [builderTab, setBuilderTab] = useState<string>('supererogatory_prayers');

  // Custom Deed Form State inside Builder
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomCategory, setNewCustomCategory] = useState('morals');
  const [newCustomType, setNewCustomType] = useState<DeedType>('scalar');
  const [newCustomWeight, setNewCustomWeight] = useState(1);

  // Generate random star positions once on mount (stable across renders)
  const randomStars = useMemo(() => {
      return Array.from({ length: 40 }).map(() => ({
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          size: Math.random() * 3 + 2, // 2px to 5px
          delay: `${Math.random() * 3}s`,
          duration: `${Math.random() * 2 + 2}s` // 2s to 4s
      }));
  }, []);

  // Calculate readonly state
  const today = getTodayStr();
  const isReadOnly = date !== today;

  // Load data and settings
  useEffect(() => {
    const settings = loadSettings();
    setCustomDeeds(settings.customDeeds || []);
    setActiveDeeds(settings.activeDeeds || DEEDS);

    const record = getRecord(date);
    if (record) {
      setScores(record.scores || {});
      setReport(record.report || '');
      setCustomTitles(record.custom_titles || {});
      setSins(record.sins || []);
    } else {
      setScores({});
      setReport('');
      setCustomTitles({});
      setSins([]);
    }
    
    if (onDateChange) onDateChange(date);
  }, [date, onDateChange]);

  const handleScoreChange = (id: string, val: number) => {
    if (isReadOnly) return;
    setScores(prev => ({ ...prev, [id]: val }));
  };

  const handleTitleChange = (id: string, title: string) => {
    if (isReadOnly) return;
    setCustomTitles(prev => ({ ...prev, [id]: title }));
  };

  const handleSinsChange = (newSins: string[]) => {
    if (isReadOnly) return;
    setSins(newSins);
  };

  // --- Dynamic Calculations based on active deeds and custom weights ---
  const total_average = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let goldenBonus = 0;

    activeDeeds.forEach((deed) => {
      const score = scores[deed.id] || 0;

      if (deed.type === 'golden') {
          // Golden logic: Bonus is weight * 5 if complete (100)
          if (score === 100) {
              const weight = deed.weight || 1;
              goldenBonus += weight * 5;
          }
      } else {
          // Normal deeds contribute to weighted average
          const weight = deed.weight || 1;
          totalWeightedScore += score * weight;
          totalWeight += weight;
      }
    });

    const baseAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Apply Sin Penalty (-10 per sin count)
    const penalty = sins.length * 10;
    
    const finalScore = baseAverage + goldenBonus - penalty;
    
    return Math.round(finalScore);
  }, [scores, sins, activeDeeds]);

  const goldenStarsCount = useMemo(() => {
    let count = 0;
    activeDeeds.forEach(d => {
        if (d.type === 'golden' && scores[d.id] === 100) {
            const weight = d.weight || 1;
            if (weight >= 4) {
                count += 2;
            } else {
                count += 1;
            }
        }
    });
    return count;
  }, [scores, activeDeeds]);

  const getScoreColorClass = (score: number) => {
    if (score > 100) {
        return 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-yellow-300 shadow-yellow-500/50';
    }
    if (score < 0) return 'bg-gradient-to-br from-red-800 to-rose-950';
    
    const tens = Math.floor(score / 10);
    
    switch (tens) {
        case 0: return 'bg-gradient-to-br from-red-600 to-orange-800';
        case 1: return 'bg-gradient-to-br from-orange-700 to-orange-900';
        case 2: return 'bg-gradient-to-br from-orange-600 to-amber-800';
        case 3: return 'bg-gradient-to-br from-orange-500 to-amber-700';
        case 4: return 'bg-gradient-to-br from-amber-600 to-yellow-700';
        case 5: return 'bg-gradient-to-br from-yellow-600 to-lime-800';
        case 6: return 'bg-gradient-to-br from-lime-600 to-green-800';
        case 7: return 'bg-gradient-to-br from-green-600 to-emerald-800';
        case 8: return 'bg-gradient-to-br from-emerald-600 to-teal-800';
        case 9: return 'bg-gradient-to-br from-teal-500 to-cyan-700';
        case 10: return 'bg-gradient-to-br from-cyan-500 to-blue-600';
        default: return 'bg-gradient-to-br from-cyan-500 to-blue-600';
    }
  };

  const handleSave = () => {
    if (isReadOnly) return;

    if (!report || !report.trim()) {
        setShowValidationError(true);
        setTimeout(() => setShowValidationError(false), 2500);
        
        const textarea = document.getElementById('report-textarea');
        if (textarea) {
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            textarea.focus();
        }
        return;
    }

    setIsSaving(true);

    // Update Qada based on changes
    const originalRecord = getRecord(date);
    const originalScores = originalRecord?.scores || {};
    const qadaData = loadQada();
    let qadaChanged = false;

    const updateQadaForPrayer = (key: string, qadaKeys: ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[]) => {
        const isNowQada = scores[key] === -100;
        const wasQada = originalScores[key] === -100;

        if (isNowQada && !wasQada) {
            qadaKeys.forEach(k => qadaData[k] += 1);
            qadaChanged = true;
        } else if (!isNowQada && wasQada) {
            qadaKeys.forEach(k => qadaData[k] = Math.max(0, qadaData[k] - 1));
            qadaChanged = true;
        }
    };

    updateQadaForPrayer('prayer_fajr', ['fajr']);
    updateQadaForPrayer('prayer_dhuhr', ['dhuhr', 'asr']);
    updateQadaForPrayer('prayer_maghrib', ['maghrib', 'isha']);

    if (qadaChanged) {
        saveQada(qadaData);
    }

    const record: DailyRecord = {
      date,
      scores,
      sins,
      custom_titles,
      report,
      total_average,
      updated_at: Date.now()
    };
    saveRecord(record);
    
    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }, 500);
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${year}-${month}-${day}`;
    
    if (days > 0 && newDateStr > getTodayStr()) return;
    
    setDate(newDateStr);
  };

  const persianDate = new Date(date).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // --- Elementor Builder Actions ---
  const handleToggleDeedActive = (deed: DeedDefinition) => {
    const isCurrentlyActive = activeDeeds.some(d => d.id === deed.id);
    let updatedActive: DeedDefinition[];

    if (isCurrentlyActive) {
      if (deed.isMandatory) return; // Prayers are mandatory!
      updatedActive = activeDeeds.filter(d => d.id !== deed.id);
    } else {
      updatedActive = [...activeDeeds, { ...deed }];
    }

    const saved = saveActiveDeeds(updatedActive);
    setActiveDeeds(saved);
  };

  const handleUpdateDeedWeight = (id: string, weight: number) => {
    const updatedActive = activeDeeds.map(d => {
      if (d.id === id) {
        return { ...d, weight };
      }
      return d;
    });
    const saved = saveActiveDeeds(updatedActive);
    setActiveDeeds(saved);
  };

  const handleUpdateDeedType = (id: string, type: DeedType) => {
    const updatedActive = activeDeeds.map(d => {
      if (d.id === id) {
        return { ...d, type };
      }
      return d;
    });
    const saved = saveActiveDeeds(updatedActive);
    setActiveDeeds(saved);
  };

  const handleAddCustomDeedInBuilder = () => {
    if (!newCustomTitle.trim()) return;
    const id = `custom_${newCustomType}_${Date.now()}`;
    const newDeed: DeedDefinition = {
        id,
        title: newCustomTitle.trim(),
        type: newCustomType,
        category: newCustomCategory,
        weight: newCustomWeight,
        isCustom: true
    };

    const updatedCustom = saveCustomDeed(newDeed);
    setCustomDeeds(updatedCustom);

    // Auto add to active list
    const updatedActive = [...activeDeeds, newDeed];
    const savedActive = saveActiveDeeds(updatedActive);
    setActiveDeeds(savedActive);

    setNewCustomTitle('');
  };

  const handleDeleteCustomDeedInBuilder = (id: string) => {
    const updatedCustom = removeCustomDeed(id);
    setCustomDeeds(updatedCustom);

    // Also remove from active list
    const updatedActive = activeDeeds.filter(d => d.id !== id);
    const savedActive = saveActiveDeeds(updatedActive);
    setActiveDeeds(savedActive);

    // Clean up current score state for this deleted deed
    const newScores = { ...scores };
    delete newScores[id];
    setScores(newScores);
  };

  // Group active deeds by category
  const activeDeedsByCategory = useMemo(() => {
    const groups: Record<string, DeedDefinition[]> = {};
    activeDeeds.forEach(deed => {
      const cat = deed.category || 'custom';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(deed);
    });
    return groups;
  }, [activeDeeds]);

  // Combined master list of all templates (predefined + custom user-created)
  const masterTemplates = useMemo(() => {
    // Merge predefined DEEDS and custom deeds
    // Avoid duplicates by checking ids
    const combined = [...DEEDS];
    customDeeds.forEach(cd => {
      if (!combined.some(d => d.id === cd.id)) {
        combined.push(cd);
      }
    });
    return combined;
  }, [customDeeds]);

  return (
    <div className="space-y-6 relative">
        
      {/* Toast Notification for Qada Added */}
      {showQadaAdded && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl z-50 animate-fade-in flex items-center gap-2">
            <div className="bg-red-500 rounded-full p-1">
                <Plus className="w-3 h-3 text-white" />
            </div>
            <span>به لیست قضا اضافه شد</span>
        </div>
      )}

      {/* Date Selector & Score Card (KEPT EXACTLY UNCHANGED AS REQUESTED) */}
      <div className={`${getScoreColorClass(total_average)} rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-700`}>
         
         {/* Starry Animation for Golden Score (> 100) */}
         {total_average > 100 && (
             <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 {/* Rotating Background Glow */}
                 <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-white/20 to-transparent rotate-45 animate-pulse" style={{ animationDuration: '3s' }}></div>
                 
                 {/* Sparkling Stars */}
                 {randomStars.map((star, i) => (
                     <div 
                        key={i}
                        className="absolute bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            animationDuration: star.duration,
                            animationDelay: star.delay,
                            opacity: Math.random() * 0.5 + 0.3
                        }}
                     />
                 ))}
             </div>
         )}

         <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="2" fill="currentColor"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#p)"/>
            </svg>
         </div>

        <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => changeDate(-1)} className="p-1 hover:bg-white/20 rounded-full transition"><ChevronRight className="w-6 h-6" /></button>
                <div className="text-center">
                    <h2 className="text-lg font-bold opacity-90">امتیاز {isReadOnly ? (date < today ? 'روز گذشته' : 'روز آینده') : 'امروز'}</h2>
                    <div className="text-sm font-light opacity-80 mt-1">{persianDate}</div>
                </div>
                <button 
                    onClick={() => changeDate(1)} 
                    className={`p-1 hover:bg-white/20 rounded-full transition ${date === today ? 'opacity-30 cursor-not-allowed' : ''}`} 
                    disabled={date === today}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>

            <div className="flex flex-col items-center mb-2">
                <div className="flex items-end gap-3" dir="ltr">
                    <span className={`text-6xl font-black tracking-tighter leading-none ${total_average > 100 ? 'drop-shadow-lg' : ''}`}>
                        {toPersianDigits(total_average)}
                    </span>
                    <span className="text-xl mb-1.5 opacity-80 font-bold">/ ۱۰۰+</span>
                </div>
                
                {/* Golden Stars Pinned Here */}
                {goldenStarsCount > 0 && (
                    <div className="flex gap-1 mt-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
                        {Array.from({ length: goldenStarsCount }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-200 text-yellow-200 drop-shadow-sm animate-pulse" style={{ animationDelay: `${i * 0.2}s`}} />
                        ))}
                    </div>
                )}
            </div>
            
            <div className="w-full bg-black/20 h-2 rounded-full mt-4 overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ease-out ${total_average < 0 ? 'bg-red-400' : 'bg-white'}`}
                    style={{ width: `${Math.max(0, Math.min(100, Math.abs(total_average)))}%` }}
                ></div>
            </div>
            
            {isReadOnly && (
                <div className="mt-4 flex justify-center">
                    <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>غیر قابل ویرایش</span>
                    </div>
                </div>
            )}
        </div>
      </div>


      {/* REDESIGNED NOTEBOOK SECTION (ELEMENTOR SYSTEM) */}
      <div className="space-y-6">

        {/* Builder Mode Toggle Button */}
        {!isReadOnly && (
          <div className="flex justify-center">
            <button
              onClick={() => setIsBuilderMode(!isBuilderMode)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-md border transition-all transform active:scale-95 ${
                isBuilderMode
                  ? 'bg-amber-500 hover:bg-amber-600 border-amber-400 text-white shadow-amber-500/20'
                  : 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 border-primary-500 text-white shadow-primary-500/10'
              }`}
            >
              {isBuilderMode ? (
                <>
                  <X className="w-4 h-4" />
                  <span>پایان شخصی‌سازی و بازگشت به دفترچه</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4 animate-bounce" />
                  <span>⚙️ شخصی‌سازی و چیدمان برنامه (المنتور)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* VISUAL BUILDER MODE (wordpress elementor-style workspace) */}
        {isBuilderMode ? (
          <div className="bg-gray-50 dark:bg-gray-900/60 p-4 md:p-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 space-y-6 animate-scale-in">

            {/* Builder Header info */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-3">
              <div className="bg-amber-100 dark:bg-amber-950 p-2.5 rounded-xl text-amber-600 dark:text-amber-400">
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">صفحه کار چیدمان برنامه (طرح المنتور وردپرس)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  برنامه روزانه خود را دلخواه بچینید! اعمال مورد نیاز خود را با یک کلیک از کتابخانه جامع انتخاب کرده و وارد پنل کاری (دفترچه مراقبه) خود کنید. ضریب اهمیت (وزن) و نوع ارزیابی هر عمل را به دلخواه مشخص نمایید.
                </p>
              </div>
            </div>

            {/* Split Panel Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* Columns Left: Active Program (Chidemane Daftarche) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs mb-3 flex items-center justify-between border-b pb-2 border-gray-100 dark:border-gray-700">
                    <span>📑 دفترچه مراقبه روزانه شما ({toPersianDigits(activeDeeds.length)} مورد)</span>
                    <span className="text-[10px] text-gray-400">اعمال فعال در چک‌لیست</span>
                  </h4>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto pl-1">
                    {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
                      const deeds = activeDeedsByCategory[catKey] || [];
                      if (deeds.length === 0) return null;

                      return (
                        <div key={catKey} className="space-y-2">
                          <h5 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 px-1 pt-2">
                            {catInfo.icon}
                            {catInfo.label}
                          </h5>

                          <div className="space-y-2">
                            {deeds.map(deed => (
                              <div
                                key={deed.id}
                                className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col gap-2.5 transition-all"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                                    {deed.title}
                                  </span>

                                  {deed.isMandatory ? (
                                    <div className="text-[10px] bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>پیش‌فرض</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleDeedActive(deed)}
                                      className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 p-1 rounded-full transition"
                                      title="حذف از چک‌لیست"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Customizers: Weights & Type */}
                                <div className="flex justify-between items-center gap-3 border-t border-gray-100 dark:border-gray-800/80 pt-2 flex-wrap">

                                  {/* Weight selector */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-gray-400">ضریب (وزن):</span>
                                    <select
                                      value={deed.weight || 1}
                                      onChange={(e) => handleUpdateDeedWeight(deed.id, Number(e.target.value))}
                                      className="text-[10px] font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-primary-500"
                                    >
                                      {[1, 2, 3, 4, 5].map(w => (
                                        <option key={w} value={w}>{toPersianDigits(w)}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Type toggle switch (Qualitative/Scalar Slider or Quantitative/Binary Checkbox) */}
                                  {!deed.isMandatory && deed.type !== 'golden' && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-gray-400">ارزیابی:</span>
                                      <div className="inline-flex rounded-md shadow-sm bg-white dark:bg-gray-800 p-0.5 border border-gray-200 dark:border-gray-700">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateDeedType(deed.id, 'scalar')}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                            deed.type === 'scalar'
                                              ? 'bg-primary-500 text-white'
                                              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                          }`}
                                        >
                                          کیفی (اسلایدر)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateDeedType(deed.id, 'binary')}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${
                                            deed.type === 'binary'
                                              ? 'bg-primary-500 text-white'
                                              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                          }`}
                                        >
                                          باینری (بله-خیر)
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Read-only Types info */}
                                  {deed.isMandatory && (
                                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded">
                                      نماز اول وقت
                                    </span>
                                  )}
                                  {deed.type === 'golden' && (
                                    <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                      طلایی (بله-خیر)
                                    </span>
                                  )}

                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columns Right: Library & Custom Addition (Makhzane Jame' + Ta'rif_e Custom) */}
              <div className="lg:col-span-7 space-y-6">

                {/* 1. Predefined Library Catalog with Tabs */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-2 border-b pb-2 border-gray-100 dark:border-gray-700">
                    <Layers className="w-4 h-4 text-primary-500" />
                    <span>مخزن اعمال جامع (کتابخانه المنتور)</span>
                  </h4>

                  {/* Tabs Navigator */}
                  <div className="flex gap-1 overflow-x-auto pb-1 border-b border-gray-50 dark:border-gray-800 custom-scrollbar">
                    {Object.entries(CATEGORY_LABELS).map(([key, info]) => {
                      if (key === 'obligatory') return null; // Prayers are always default, no need to toggle
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setBuilderTab(key)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${
                            builderTab === key
                              ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/40 dark:border-primary-800 dark:text-primary-300'
                              : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                          }`}
                        >
                          {info.icon}
                          <span>{info.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Catalog Deeds under active Tab */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pl-1">
                    {masterTemplates
                      .filter(d => d.category === builderTab && !d.isMandatory)
                      .map(deed => {
                        const isActive = activeDeeds.some(ad => ad.id === deed.id);
                        return (
                          <button
                            key={deed.id}
                            type="button"
                            onClick={() => handleToggleDeedActive(deed)}
                            className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between text-xs font-bold group select-none ${
                              isActive
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400'
                                : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/40 dark:hover:bg-gray-900/70 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                              <span className="truncate">{deed.title}</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {deed.isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCustomDeedInBuilder(deed.id);
                                  }}
                                  className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition mr-1.5 opacity-0 group-hover:opacity-100"
                                  title="حذف کامل عمل"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                              }`}>
                                {isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    {masterTemplates.filter(d => d.category === builderTab && !d.isMandatory).length === 0 && (
                      <div className="col-span-2 text-center text-gray-400 dark:text-gray-600 py-6 text-xs">
                        عملی در این دسته‌بندی یافت نشد. می‌توانید با فرم زیر عمل شخصی اضافه کنید!
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Custom Deed Creator Form */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm space-y-4">
                  <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    <span>➕ تعریف عمل جدید شخصی</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* Title */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">عنوان عمل:</label>
                      <input
                        type="text"
                        value={newCustomTitle}
                        onChange={(e) => setNewCustomTitle(e.target.value)}
                        placeholder="مثلا: حفظ یک آیه از قرآن"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-1 focus:ring-primary-500 outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">دسته‌بندی (شاخه):</label>
                      <select
                        value={newCustomCategory}
                        onChange={(e) => {
                          setNewCustomCategory(e.target.value);
                          // Golden Category should enforce golden type
                          if (e.target.value === 'golden') {
                            setNewCustomType('golden');
                          } else if (newCustomType === 'golden') {
                            setNewCustomType('scalar');
                          }
                        }}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {Object.entries(CATEGORY_LABELS).map(([key, info]) => {
                          if (key === 'obligatory') return null; // Obligatory cannot be selected for custom deeds
                          return (
                            <option key={key} value={key}>{info.label}</option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Type Choice */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">نوع ارزیابی:</label>
                      <select
                        value={newCustomType}
                        disabled={newCustomCategory === 'golden'}
                        onChange={(e) => setNewCustomType(e.target.value as DeedType)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                      >
                        <option value="scalar">کیفی (اسلایدر ۰ تا ۱۰۰)</option>
                        <option value="binary">باینری (بله یا خیر)</option>
                        <option value="golden">عمل طلایی (پاداش ویژه)</option>
                      </select>
                    </div>

                    {/* Weight selection */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400">ضریب اهمیت (وزن):</label>
                      <select
                        value={newCustomWeight}
                        onChange={(e) => setNewCustomWeight(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {[1, 2, 3, 4, 5].map(w => (
                          <option key={w} value={w}>{toPersianDigits(w)}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomDeedInBuilder}
                    disabled={!newCustomTitle.trim()}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition"
                  >
                    ثبت و افزودن فوری به چک‌لیست
                  </button>
                </div>

              </div>

            </div>

            {/* Back Button sticky action */}
            <div className="flex justify-center pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
              <button
                type="button"
                onClick={() => setIsBuilderMode(false)}
                className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-full shadow-lg hover:shadow-primary-500/20 transform active:scale-95 transition"
              >
                ثبت نهایی تغییرات و بستن المنتور
              </button>
            </div>

          </div>
        ) : (
          /* STANDARD DIRECT VIEW MODE (Redesigned Active Notebook Checklist) */
          <div className="space-y-6">
            {activeDeeds.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8">
                <Info className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-1">چک‌لیست شما خالی است</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto mb-4">
                  هیچ عملی برای نمایش یافت نشد. دکمه شخصی‌سازی بالا را کلیک کنید تا اعمال مورد علاقه خود را بچینید!
                </p>
              </div>
            ) : (
              /* Grouped Sections by active deeds categories */
              Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
                const deeds = activeDeedsByCategory[catKey] || [];
                if (deeds.length === 0) return null;

                return (
                  <div key={catKey} className="space-y-3 animate-fade-in">

                    {/* Section Header */}
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-gray-500 dark:text-gray-400 font-bold text-xs flex items-center gap-1.5 select-none">
                            {catInfo.icon}
                            <span>{catInfo.label}</span>
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {toPersianDigits(deeds.length)} مورد
                        </span>
                    </div>

                    {/* Section Grid items */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                      {deeds.map(deed => (
                        <DeedInput
                          key={deed.id}
                          deed={deed}
                          value={scores[deed.id] || 0}
                          onChange={(val) => handleScoreChange(deed.id, val)}
                          customTitle={custom_titles[deed.id]}
                          onCustomTitleChange={(title) => handleTitleChange(deed.id, title)}
                          disabled={isReadOnly}
                        />
                      ))}
                    </div>

                  </div>
                );
              })
            )}

            {/* Sins Section (Always Default and Mandatory) */}
            <div className="mt-6">
                <SinInput
                    selectedSins={sins}
                    onChange={handleSinsChange}
                    disabled={isReadOnly}
                />
            </div>
          </div>
        )}

      </div>

      {/* Report Section (Always Default and Mandatory) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 mt-6">
        <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 text-sm select-none">
                گزارش به امام زمان (عج)
                <span className="text-xs text-red-500 font-normal bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md">اجباری</span>
            </label>
             {showValidationError && (
                <div className="flex items-center gap-1 text-red-500 text-xs font-bold animate-bounce">
                    <AlertCircle className="w-3 h-3" />
                    <span>لطفا تکمیل کنید</span>
                </div>
            )}
        </div>
        <textarea
            id="report-textarea"
            value={report}
            onChange={(e) => !isReadOnly && setReport(e.target.value)}
            placeholder={isReadOnly ? "گزارشی ثبت نشده است." : "دل‌نوشته یا گزارش اعمال امروز..."}
            disabled={isReadOnly}
            className={`w-full h-32 p-3 rounded-xl border outline-none resize-none text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${
                showValidationError
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-gray-200 dark:border-gray-600'
            } ${
                isReadOnly
                    ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
            }`}
        />
      </div>

      {/* Floating Action Button for Save */}
      {!isReadOnly && !isBuilderMode && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-3xl pb-4 flex justify-center z-[90] pointer-events-none">
            <button
                onClick={handleSave}
                disabled={isSaving}
                className={`pointer-events-auto flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-lg transform transition-all active:scale-95 ${
                    showSaveSuccess ? 'bg-green-600 dark:bg-green-700' : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'
                }`}
            >
                {isSaving ? (
                    <span>در حال ذخیره...</span>
                ) : showSaveSuccess ? (
                    <span>ذخیره شد!</span>
                ) : (
                    <>
                        <Save className="w-5 h-5" />
                        <span>ثبت اعمال</span>
                    </>
                )}
            </button>
        </div>
      )}
      
      <div className="h-8"></div>
    </div>
  );
};
