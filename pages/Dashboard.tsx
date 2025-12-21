
import React, { useEffect, useMemo, useState } from 'react';
import { DEEDS, getTodayStr, toPersianDigits } from '../constants';
import { DailyRecord, DeedDefinition, DeedType } from '../types';
import { saveRecord, getRecord, loadSettings, saveCustomDeed, removeCustomDeed, loadQada, saveQada } from '../services/storage';
import { DeedInput } from '../components/DeedInput';
import { SinInput } from '../components/SinInput';
import { Save, ChevronLeft, ChevronRight, Lock, Star, Plus, X, AlertCircle } from 'lucide-react';

interface DashboardProps {
  initialDate?: string;
  onDateChange?: (date: string) => void;
}

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
  
  // Custom Deeds State
  const [customDeeds, setCustomDeeds] = useState<DeedDefinition[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<DeedType>('binary');
  const [newDeedTitle, setNewDeedTitle] = useState('');

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

  // Combine static and custom deeds
  const allDeeds = useMemo(() => [...DEEDS, ...customDeeds], [customDeeds]);

  // Calculate readonly state
  const today = getTodayStr();
  const isReadOnly = date !== today;

  // Load data and settings
  useEffect(() => {
    // Load Custom Deeds from Settings
    const settings = loadSettings();
    setCustomDeeds(settings.customDeeds);

    const record = getRecord(date);
    if (record) {
      setScores(record.scores);
      setReport(record.report);
      setCustomTitles(record.custom_titles || {});
      setSins(record.sins || []);
    } else {
      const initialScores: Record<string, number> = {};
      setScores(initialScores);
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

  // --- Add/Remove Deed Logic ---
  const openAddModal = (type: DeedType) => {
    setAddModalType(type);
    setNewDeedTitle('');
    setIsAddModalOpen(true);
  };

  const handleAddDeed = () => {
    if (!newDeedTitle.trim()) return;
    const id = `custom_${addModalType}_${Date.now()}`;
    const newDeed: DeedDefinition = {
        id,
        title: newDeedTitle,
        type: addModalType,
        isCustom: true
    };
    
    // Save to persistence
    const updatedList = saveCustomDeed(newDeed);
    setCustomDeeds(updatedList);
    setIsAddModalOpen(false);
  };

  const handleDeleteCustomDeed = (id: string) => {
      const updatedList = removeCustomDeed(id);
      setCustomDeeds(updatedList);
      
      // Clean up current score state for this deleted deed
      const newScores = { ...scores };
      delete newScores[id];
      setScores(newScores);
  };
  // ----------------------

  const total_average = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let goldenBonus = 0;

    allDeeds.forEach((deed) => {
      const score = scores[deed.id] || 0;

      if (deed.type === 'golden') {
          // Golden logic: Add to bonus, do not affect base average denominator
          if (score === 100) {
              if (deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand') {
                  goldenBonus += 20;
              } else {
                  goldenBonus += 10;
              }
          }
      } else {
          // Normal deeds contribute to weighted average
          let weight = 1;
          
          if (deed.type === 'prayer') {
             weight = 2;
          } else if (deed.id === 'gaze_control' || deed.id === 'truthfulness') {
            weight = 3;
          }
          
          totalWeightedScore += score * weight;
          totalWeight += weight;
      }
    });

    const baseAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    
    // Apply Sin Penalty (-10 per sin count)
    const penalty = sins.length * 10;
    
    const finalScore = baseAverage + goldenBonus - penalty;
    
    return Math.round(finalScore);
  }, [scores, sins, allDeeds]);

  const goldenStarsCount = useMemo(() => {
    let count = 0;
    allDeeds.forEach(d => {
        if (d.type === 'golden' && scores[d.id] === 100) {
            // Add 2 stars for night prayer, 1 for others
            if (d.id === 'golden_night_prayer' || d.id === 'golden_father_hand' || d.id === 'golden_mother_hand') {
                count += 2;
            } else {
                count += 1;
            }
        }
    });
    return count;
  }, [scores, allDeeds]);

  const getScoreColorClass = (score: number) => {
    if (score > 100) {
        // Golden Gradient for > 100 with intense shine
        return 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-yellow-300 shadow-yellow-500/50';
    }

    if (score < 0) return 'bg-gradient-to-br from-red-800 to-rose-950';
    
    const tens = Math.floor(score / 10);
    
    switch (tens) {
        case 0: return 'bg-gradient-to-br from-red-600 to-orange-800'; // 0-9
        case 1: return 'bg-gradient-to-br from-orange-700 to-orange-900'; // 10-19
        case 2: return 'bg-gradient-to-br from-orange-600 to-amber-800'; // 20-29
        case 3: return 'bg-gradient-to-br from-orange-500 to-amber-700'; // 30-39
        case 4: return 'bg-gradient-to-br from-amber-600 to-yellow-700'; // 40-49
        case 5: return 'bg-gradient-to-br from-yellow-600 to-lime-800'; // 50-59
        case 6: return 'bg-gradient-to-br from-lime-600 to-green-800'; // 60-69
        case 7: return 'bg-gradient-to-br from-green-600 to-emerald-800'; // 70-79
        case 8: return 'bg-gradient-to-br from-emerald-600 to-teal-800'; // 80-89
        case 9: return 'bg-gradient-to-br from-teal-500 to-cyan-700'; // 90-99
        case 10: return 'bg-gradient-to-br from-cyan-500 to-blue-600'; // 100
        default: return 'bg-gradient-to-br from-cyan-500 to-blue-600'; // Fallback
    }
  };

  const handleSave = () => {
    if (isReadOnly) return;

    // Validation
    if (!report || !report.trim()) {
        setShowValidationError(true);
        // Auto hide error after a few seconds
        setTimeout(() => setShowValidationError(false), 2500);
        
        // Try to focus/scroll to textarea
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

    // Helper to check Qada logic
    const updateQadaForPrayer = (key: string, qadaKeys: ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[]) => {
        const isNowQada = scores[key] === -100;
        const wasQada = originalScores[key] === -100;

        if (isNowQada && !wasQada) {
            // Added Qada
            qadaKeys.forEach(k => qadaData[k] += 1);
            qadaChanged = true;
        } else if (!isNowQada && wasQada) {
            // Removed Qada
            qadaKeys.forEach(k => qadaData[k] = Math.max(0, qadaData[k] - 1));
            qadaChanged = true;
        }
    };

    updateQadaForPrayer('prayer_fajr', ['fajr']);
    updateQadaForPrayer('prayer_dhuhr', ['dhuhr', 'asr']);
    updateQadaForPrayer('prayer_maghrib', ['maghrib', 'isha']);

    if (qadaChanged) {
        saveQada(qadaData);
        if (Object.values(scores).some(v => v === -100) && !Object.values(originalScores).some(v => v === -100)) {
             // Only show added toast if it was a net addition (simplification) or just let it save silently as part of global save
        }
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

      {/* Add Deed Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                          افزودن مورد جدید
                      </h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <input 
                      type="text" 
                      value={newDeedTitle}
                      onChange={(e) => setNewDeedTitle(e.target.value)}
                      placeholder="عنوان عمل را وارد کنید..."
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none mb-6"
                      autoFocus
                  />
                  
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setIsAddModalOpen(false)}
                        className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                          انصراف
                      </button>
                      <button 
                        onClick={handleAddDeed}
                        disabled={!newDeedTitle.trim()}
                        className="flex-1 py-2 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                          افزودن
                      </button>
                  </div>
              </div>
          </div>
      )}  

      {/* Date Selector & Score Card */}
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

      {/* Deeds List */}
      <div className="space-y-3">
        {/* Binary Section */}
        <div className="flex items-center justify-between px-2">
            <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm">اعمال قراردادی</h3>
            <button 
                onClick={() => openAddModal('binary')}
                className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
            {allDeeds.filter(d => d.type === 'binary').map(deed => (
            <DeedInput
                key={deed.id}
                deed={deed}
                value={scores[deed.id] || 0}
                onChange={(val) => handleScoreChange(deed.id, val)}
                disabled={isReadOnly}
                onDelete={deed.isCustom ? () => handleDeleteCustomDeed(deed.id) : undefined}
            />
            ))}
        </div>

        {/* Scalar Section */}
        <div className="flex items-center justify-between px-2 mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 font-bold text-sm">مراقبه‌های اخلاقی (کیفی)</h3>
            <button 
                onClick={() => openAddModal('scalar')}
                className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-1">
            {allDeeds.filter(d => d.type === 'scalar' || d.type === 'prayer').map(deed => (
            <DeedInput
                key={deed.id}
                deed={deed}
                value={scores[deed.id] || 0}
                onChange={(val) => handleScoreChange(deed.id, val)}
                disabled={isReadOnly}
                onDelete={deed.isCustom ? () => handleDeleteCustomDeed(deed.id) : undefined}
            />
            ))}
        </div>

        {/* Golden Section */}
        <div className="flex items-center justify-between px-2 mt-6">
            <h3 className="text-yellow-600 dark:text-yellow-500 font-bold text-sm flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" />
                اعمال طلایی (پاداش ویژه)
            </h3>
            <button 
                onClick={() => openAddModal('golden')}
                className="w-6 h-6 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center hover:bg-yellow-100 hover:text-yellow-600 transition"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-1">
            {allDeeds.filter(d => d.type === 'golden').map(deed => (
            <DeedInput
                key={deed.id}
                deed={deed}
                value={scores[deed.id] || 0}
                onChange={(val) => handleScoreChange(deed.id, val)}
                customTitle={custom_titles[deed.id]}
                onCustomTitleChange={(title) => handleTitleChange(deed.id, title)}
                disabled={isReadOnly}
                onDelete={deed.isCustom ? () => handleDeleteCustomDeed(deed.id) : undefined}
            />
            ))}
        </div>

        {/* Sins Section */}
        <div className="mt-6">
            <SinInput 
                selectedSins={sins} 
                onChange={handleSinsChange} 
                disabled={isReadOnly}
            />
        </div>

      </div>

      {/* Report Section */}
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border shadow-sm transition-all duration-300 mt-6 ${showValidationError ? 'border-red-400 ring-2 ring-red-100 dark:ring-red-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
        <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2">
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
            className={`w-full h-32 p-3 rounded-xl border border-gray-200 dark:border-gray-600 outline-none resize-none text-gray-600 dark:text-gray-300 text-sm leading-relaxed transition-colors placeholder-gray-400 dark:placeholder-gray-500 ${isReadOnly ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed' : 'bg-white dark:bg-gray-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'}`}
        />
      </div>

      {/* Floating Action Button for Save */}
      {!isReadOnly && (
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
