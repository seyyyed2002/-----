
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTodayStr, toPersianDigits } from '../constants';
import { AppSettings, DailyRecord, DeedDefinition, DeedType } from '../types';
import { DEED_SNAPSHOT_KEY, getConfiguredDeeds, getRecordDeeds, serializeDeedSnapshot, saveRecord, getRecord, loadSettings, saveCustomDeed, saveDeedConfiguration, loadQada, saveQada, saveSettings, removeCustomDeed } from '../services/storage';
import { DeedInput } from '../components/DeedInput';
import { DeedManagerModal } from '../components/DeedManagerModal';
import { SinInput } from '../components/SinInput';
import { Save, ChevronLeft, ChevronRight, Lock, Star, Plus, X, AlertCircle, Settings2, Sliders, Edit2, Eye, EyeOff, Trash2, ChevronDown } from 'lucide-react';

interface DashboardProps {
  initialDate?: string;
  onDateChange?: (date: string) => void;
}

const InlineDeedEditor: React.FC<{
  deed: DeedDefinition;
  weight: number;
  scoringSystem: 'weighted_average' | 'points_sum';
  onWeightChange: (weight: number) => void;
  onToggleActive: () => void;
  onTitleChange: (title: string) => void;
  onDelete?: () => void;
}> = ({ deed, weight, scoringSystem, onWeightChange, onToggleActive, onTitleChange, onDelete }) => {
  const [localTitle, setLocalTitle] = useState(deed.title);

  useEffect(() => {
    setLocalTitle(deed.title);
  }, [deed.title]);

  return (
    <div className={`p-4 rounded-2xl border transition-all bg-white dark:bg-gray-800 shadow-sm flex flex-col gap-3 ${
      deed.isActive === false ? 'border-dashed opacity-60 border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-750'
    }`}>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleActive}
          className={`p-2 rounded-xl transition ${
            deed.isActive !== false 
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
              : 'bg-gray-100 text-gray-400 dark:bg-gray-700'
          }`}
          title={deed.isActive !== false ? 'غیرفعال کردن' : 'فعال کردن'}
        >
          {deed.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={localTitle}
          onChange={(e) => {
            setLocalTitle(e.target.value);
            onTitleChange(e.target.value);
          }}
          className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />

        {deed.isCustom && onDelete && (
          <button
            onClick={onDelete}
            className="text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl p-2 transition"
            title="حذف عمل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        <span className="text-gray-400 dark:text-gray-500 font-medium">
          {scoringSystem === 'points_sum' ? 'امتیاز اختصاصی:' : 'وزن عمل (ضریب تاثیر):'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeightChange(Math.max(scoringSystem === 'points_sum' ? 0 : 1, weight - (scoringSystem === 'points_sum' ? 5 : 1)))}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200"
          >
            -
          </button>
          <span className="font-bold text-gray-800 dark:text-gray-200 w-8 text-center text-sm">
            {toPersianDigits(weight)}
          </span>
          <button
            onClick={() => onWeightChange(weight + (scoringSystem === 'points_sum' ? 5 : 1))}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center font-bold text-gray-700 dark:text-gray-200"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ initialDate, onDateChange }) => {
  const [date, setDate] = useState(initialDate || getTodayStr());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [sins, setSins] = useState<string[]>([]);
  const [custom_titles, setCustomTitles] = useState<Record<string, string>>({});
  const [report, setReport] = useState('');
  const [savedTotalAverage, setSavedTotalAverage] = useState<number | null>(null);
  const [recordDeeds, setRecordDeeds] = useState<DeedDefinition[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [showQadaAdded, setShowQadaAdded] = useState(false);
  
  // Daily deed configuration
  const [settings, setSettings] = useState<AppSettings>({ customDeeds: [] });
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<DeedType>('binary');
  const [newDeedTitle, setNewDeedTitle] = useState('');
  const closeManager = useCallback(() => setIsManagerOpen(false), []);

  // Customizable scoring states
  const [isConfigControlOpen, setIsConfigControlOpen] = useState(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [scoringSystem, setScoringSystem] = useState<'weighted_average' | 'points_sum'>('weighted_average');
  const [targetPoints, setTargetPoints] = useState(100);
  const [sinPenalty, setSinPenalty] = useState(10);
  const [deedWeights, setDeedWeights] = useState<Record<string, number>>({});

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

  const configuredDeeds = useMemo(() => getConfiguredDeeds(settings, true), [settings]);
  const allDeeds = useMemo(
    () => configuredDeeds.filter(deed => deed.isActive !== false),
    [configuredDeeds]
  );

  // Calculate readonly state
  const today = getTodayStr();
  const isReadOnly = date !== today;
  const displayedDeeds = isReadOnly 
    ? (recordDeeds ?? []) 
    : (isInlineEditMode ? configuredDeeds : allDeeds);

  // Load data and settings
  useEffect(() => {
    const loadedSettings = loadSettings();
    const knownDeeds = getConfiguredDeeds(loadedSettings, true);
    setSettings(loadedSettings);

    // Load customizable scoring configs
    setScoringSystem(loadedSettings.scoringSystem || 'weighted_average');
    setTargetPoints(loadedSettings.targetPoints || 100);
    setSinPenalty(loadedSettings.sinPenalty !== undefined ? loadedSettings.sinPenalty : 10);
    
    // Set custom/default weights
    const initialWeights: Record<string, number> = {};
    knownDeeds.forEach(deed => {
      if (loadedSettings.deedWeights && loadedSettings.deedWeights[deed.id] !== undefined) {
        initialWeights[deed.id] = loadedSettings.deedWeights[deed.id];
      } else {
        // fallbacks
        if (deed.type === 'prayer') {
          initialWeights[deed.id] = 2;
        } else if (deed.id === 'gaze_control' || deed.id === 'truthfulness') {
          initialWeights[deed.id] = 3;
        } else if (deed.type === 'golden') {
          const isDouble = deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand';
          initialWeights[deed.id] = isDouble ? 20 : 10;
        } else {
          initialWeights[deed.id] = 1;
        }
      }
    });
    setDeedWeights(initialWeights);

    const record = getRecord(date);
    if (record) {
      setScores(record.scores);
      setReport(record.report);
      setCustomTitles(record.custom_titles || {});
      setSins(record.sins || []);
      setSavedTotalAverage(record.total_average);
      setRecordDeeds(getRecordDeeds(record, knownDeeds));
    } else {
      const initialScores: Record<string, number> = {};
      setScores(initialScores);
      setReport('');
      setCustomTitles({});
      setSins([]);
      setSavedTotalAverage(null);
      setRecordDeeds(null);
    }
    
    if (onDateChange) onDateChange(date);
  }, [date, onDateChange, isInlineEditMode]);

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
    saveCustomDeed(newDeed);
    setSettings(loadSettings());
    setIsAddModalOpen(false);
  };

  const handleSaveDeedConfiguration = (deeds: DeedDefinition[]) => {
    const updatedSettings = saveDeedConfiguration(deeds);
    setSettings(updatedSettings);
    setIsManagerOpen(false);
  };

  const handleSaveSettings = (updates: Partial<AppSettings>) => {
    const updatedSettings = {
      ...settings,
      ...updates
    };
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  const handleWeightChange = (deedId: string, weight: number) => {
    const updatedWeights = { ...deedWeights, [deedId]: weight };
    setDeedWeights(updatedWeights);
    handleSaveSettings({ deedWeights: updatedWeights });
  };

  const handleDeedToggleActive = (deedId: string, isActive: boolean) => {
    const updatedPreferences = {
      ...(settings.deedPreferences || {}),
      [deedId]: {
        ...(settings.deedPreferences?.[deedId] || {}),
        isActive
      }
    };
    const updatedSettings = { ...settings, deedPreferences: updatedPreferences };
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  const handleDeedTitleEdit = (deedId: string, title: string) => {
    const updatedPreferences = {
      ...(settings.deedPreferences || {}),
      [deedId]: {
        ...(settings.deedPreferences?.[deedId] || {}),
        title
      }
    };
    const updatedSettings = { ...settings, deedPreferences: updatedPreferences };
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
  };

  const handleRemoveCustomDeed = (deedId: string) => {
    removeCustomDeed(deedId);
    setSettings(loadSettings());
  };

  const applyPreset = (presetType: 'minimalist' | 'ethical' | 'comprehensive' | 'default') => {
    let updatedSettings: Partial<AppSettings> = {};
    const loadedSettings = loadSettings();
    const allKnownDeeds = getConfiguredDeeds(loadedSettings, true);
    
    const deedPreferences: Record<string, any> = {};
    const localWeights: Record<string, number> = {};
    
    if (presetType === 'minimalist') {
      allKnownDeeds.forEach(deed => {
        if (deed.type === 'prayer') {
          deedPreferences[deed.id] = { isActive: true };
          if (deed.id === 'prayer_fajr') localWeights[deed.id] = 30;
          if (deed.id === 'prayer_dhuhr') localWeights[deed.id] = 35;
          if (deed.id === 'prayer_maghrib') localWeights[deed.id] = 35;
        } else {
          deedPreferences[deed.id] = { isActive: false };
        }
      });
      updatedSettings = {
        scoringSystem: 'points_sum',
        targetPoints: 100,
        sinPenalty: 10,
        deedWeights: localWeights,
        deedPreferences
      };
    } else if (presetType === 'ethical') {
      allKnownDeeds.forEach(deed => {
        const isCore = deed.type === 'prayer' || deed.id === 'gaze_control' || deed.id === 'truthfulness' || deed.id === 'sleep_time';
        deedPreferences[deed.id] = { isActive: isCore };
        
        if (deed.id === 'gaze_control') localWeights[deed.id] = 25;
        else if (deed.id === 'truthfulness') localWeights[deed.id] = 25;
        else if (deed.id === 'sleep_time') localWeights[deed.id] = 10;
        else if (deed.type === 'prayer') localWeights[deed.id] = 15;
        else localWeights[deed.id] = 5;
      });
      updatedSettings = {
        scoringSystem: 'points_sum',
        targetPoints: 100,
        sinPenalty: 10,
        deedWeights: localWeights,
        deedPreferences
      };
    } else if (presetType === 'comprehensive') {
      allKnownDeeds.forEach(deed => {
        deedPreferences[deed.id] = { isActive: true };
        if (deed.type === 'prayer') localWeights[deed.id] = 15;
        else if (deed.id === 'gaze_control' || deed.id === 'truthfulness') localWeights[deed.id] = 10;
        else if (deed.type === 'golden') {
          const isDouble = deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand';
          localWeights[deed.id] = isDouble ? 20 : 10;
        } else {
          localWeights[deed.id] = 5;
        }
      });
      updatedSettings = {
        scoringSystem: 'points_sum',
        targetPoints: 100,
        sinPenalty: 10,
        deedWeights: localWeights,
        deedPreferences
      };
    } else {
      // Default: Reset to weighted average defaults
      allKnownDeeds.forEach(deed => {
        deedPreferences[deed.id] = { isActive: true };
        if (deed.type === 'prayer') localWeights[deed.id] = 2;
        else if (deed.id === 'gaze_control' || deed.id === 'truthfulness') localWeights[deed.id] = 3;
        else if (deed.type === 'golden') {
          const isDouble = deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand';
          localWeights[deed.id] = isDouble ? 20 : 10;
        } else {
          localWeights[deed.id] = 1;
        }
      });
      updatedSettings = {
        scoringSystem: 'weighted_average',
        targetPoints: 100,
        sinPenalty: 10,
        deedWeights: localWeights,
        deedPreferences
      };
    }
    
    const finalSettings = {
      ...settings,
      ...updatedSettings
    };
    saveSettings(finalSettings);
    setSettings(finalSettings);
    
    // update local state
    setScoringSystem(finalSettings.scoringSystem || 'weighted_average');
    setDeedWeights(finalSettings.deedWeights || {});
  };

  const calculatedTotalAverage = useMemo(() => {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let totalEarnedPoints = 0;
    let goldenBonus = 0;

    allDeeds.forEach((deed) => {
      const score = scores[deed.id] || 0;
      
      const deedVal = deedWeights[deed.id] !== undefined 
        ? deedWeights[deed.id] 
        : (deed.type === 'prayer' ? 2 : (deed.id === 'gaze_control' || deed.id === 'truthfulness' ? 3 : 1));

      if (deed.type === 'golden') {
          if (score === 100) {
              const goldenVal = deedWeights[deed.id] !== undefined
                ? deedWeights[deed.id]
                : (deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand' ? 20 : 10);
              goldenBonus += goldenVal;
          }
      } else {
          if (scoringSystem === 'points_sum') {
              totalEarnedPoints += (score / 100) * deedVal;
          } else {
              totalWeightedScore += score * deedVal;
              totalWeight += deedVal;
          }
      }
    });

    let finalScore = 0;
    if (scoringSystem === 'points_sum') {
        finalScore = totalEarnedPoints + goldenBonus - (sins.length * sinPenalty);
    } else {
        const baseAverage = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
        finalScore = baseAverage + goldenBonus - (sins.length * sinPenalty);
    }

    // Clamp score to 100 max and -100 min
    return Math.min(100, Math.max(-100, Math.round(finalScore)));
  }, [scores, sins, allDeeds, scoringSystem, sinPenalty, deedWeights]);

  const total_average = isReadOnly && savedTotalAverage !== null
    ? savedTotalAverage
    : calculatedTotalAverage;

  const goldenStarsCount = useMemo(() => {
    let count = 0;
    displayedDeeds.forEach(d => {
        if (d.type === 'golden' && scores[d.id] === 100) {
            const bonusVal = deedWeights[d.id] !== undefined ? deedWeights[d.id] : (d.id === 'golden_night_prayer' || d.id === 'golden_father_hand' || d.id === 'golden_mother_hand' ? 20 : 10);
            if (bonusVal >= 20) {
                count += 2;
            } else if (bonusVal > 0) {
                count += 1;
            }
        }
    });
    return count;
  }, [scores, displayedDeeds, deedWeights]);

  const getScoreColorClass = (score: number) => {
    if (score >= 100) {
        // Golden Gradient for >= 100 with intense shine
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

    const scoresToSave = { ...scores };
    allDeeds.forEach(deed => {
      if (scoresToSave[deed.id] === undefined) {
        scoresToSave[deed.id] = 0;
      }
    });

    const record: DailyRecord = {
      date,
      scores: scoresToSave,
      sins,
      custom_titles: {
        ...custom_titles,
        [DEED_SNAPSHOT_KEY]: serializeDeedSnapshot(allDeeds)
      },
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

      {isManagerOpen && (
        <DeedManagerModal
          deeds={configuredDeeds}
          onClose={closeManager}
          onSave={handleSaveDeedConfiguration}
        />
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
         
         {/* Starry Animation for Golden Score (>= 100) */}
         {total_average >= 100 && (
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
                    <span className={`text-6xl font-black tracking-tighter leading-none ${total_average >= 100 ? 'drop-shadow-lg' : ''}`}>
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

      {/* Stats Summary Bar */}
      {!isReadOnly && (
          <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">🕌 نمازها</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                      {toPersianDigits(allDeeds.filter(d => d.type === 'prayer' && scores[d.id] === 100).length)} از {toPersianDigits(allDeeds.filter(d => d.type === 'prayer').length)}
                  </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">📖 ادعیه/قرآن</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                      {toPersianDigits(allDeeds.filter(d => d.type === 'binary' && scores[d.id] === 100).length)} از {toPersianDigits(allDeeds.filter(d => d.type === 'binary').length)}
                  </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">✨ طلایی</span>
                  <span className="text-sm font-black text-yellow-600 dark:text-yellow-500 mt-1 block">
                      {toPersianDigits(allDeeds.filter(d => d.type === 'golden' && scores[d.id] === 100).length)} مورد
                  </span>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">⚠️ خطاها</span>
                  <span className="text-sm font-black text-red-500 mt-1 block">
                      {toPersianDigits(sins.length)} خطا
                  </span>
              </div>
          </div>
      )}

      {/* Quick Dashboard Action / Settings Panel */}
      {!isReadOnly && (
          <div className="flex gap-3">
              <button
                  onClick={() => setIsConfigControlOpen(!isConfigControlOpen)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-xs font-bold text-gray-700 dark:text-gray-200 transition-all hover:scale-[1.02] active:scale-95 hover:shadow-md"
              >
                  <Sliders className="w-4 h-4 text-primary-500" />
                  <span>تنظیم روش امتیازدهی و قالب‌ها</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isConfigControlOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <button
                  onClick={() => setIsInlineEditMode(!isInlineEditMode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-xs font-bold shadow-sm ${
                      isInlineEditMode 
                          ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700 hover:shadow-md'
                  }`}
              >
                  <Edit2 className="w-4 h-4 text-primary-500" />
                  <span>{isInlineEditMode ? 'خروج از حالت ویرایش' : 'ویرایش عنوان و امتیازها'}</span>
              </button>
          </div>
      )}

      {/* Expandable Config Control Center */}
      {isConfigControlOpen && !isReadOnly && (
          <div className="animate-fade-in bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-100 dark:border-gray-700 rounded-3xl p-5 shadow-lg space-y-5">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary-500" />
                  <span>مرکز مدیریت و شخصی‌سازی برنامه روزانه</span>
              </h3>
              
              {/* Scoring System Mode Selector */}
              <div className="grid grid-cols-2 gap-3">
                  <button
                      onClick={() => {
                          setScoringSystem('weighted_average');
                          handleSaveSettings({ scoringSystem: 'weighted_average' });
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                          scoringSystem === 'weighted_average'
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 ring-1 ring-primary-500'
                              : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100/50'
                      }`}
                  >
                      <span className="font-bold text-xs text-gray-800 dark:text-gray-200">⚖️ میانگین وزنی (Weighted)</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal">
                          کیفیت کل اعمال با تاثیرگذاری وزن هر عمل (مناسب برای خودسازی تعادلی)
                      </span>
                  </button>
                  
                  <button
                      onClick={() => {
                          setScoringSystem('points_sum');
                          handleSaveSettings({ scoringSystem: 'points_sum' });
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col gap-1 ${
                          scoringSystem === 'points_sum'
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20 ring-1 ring-primary-500'
                              : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100/50'
                      }`}
                  >
                      <span className="font-bold text-xs text-gray-800 dark:text-gray-200">⚡ مجموع امتیاز تجمعی (Points Sum)</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal">
                          هر کار امتیاز خاص خود را دارد و جمع آن امتیاز نهایی است (سقف ۱۰۰)
                      </span>
                  </button>
              </div>

              {/* Sliders for penalties and config */}
              <div className="grid gap-4 sm:grid-cols-2 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                          <span>هدف نهایی روزانه:</span>
                          <span className="text-primary-600 dark:text-primary-400">{toPersianDigits(100)} امتیاز</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg w-full relative overflow-hidden">
                          <div className="h-full bg-primary-500 w-full"></div>
                      </div>
                      <span className="text-[10px] text-gray-400 block">حداکثر امتیاز برنامه روی ۱۰۰ قفل شده است.</span>
                  </div>

                  {/* Sin Penalty Slider */}
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
                          <span>جریمه هر گناه/خطا:</span>
                          <span className="text-red-500">{toPersianDigits(sinPenalty)}- امتیاز</span>
                      </div>
                      <input
                          type="range"
                          min="0"
                          max="30"
                          step="5"
                          value={sinPenalty}
                          onChange={(e) => {
                              const val = Number(e.target.value);
                              setSinPenalty(val);
                              handleSaveSettings({ sinPenalty: val });
                          }}
                          className="w-full accent-red-500 cursor-pointer h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none"
                      />
                  </div>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block px-1">🚀 قالب‌های آماده برنامه روزانه:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                          onClick={() => applyPreset('minimalist')}
                          className="py-2.5 px-2 rounded-xl bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 text-green-700 dark:text-green-300 text-xs font-bold transition-all border border-green-100 dark:border-green-900/50"
                      >
                          🕌 فقط نمازها (حداقلی)
                      </button>
                      <button
                          onClick={() => applyPreset('ethical')}
                          className="py-2.5 px-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/20 dark:hover:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 text-xs font-bold transition-all border border-cyan-100 dark:border-cyan-900/50"
                      >
                          🌱 خودسازی اخلاقی
                      </button>
                      <button
                          onClick={() => applyPreset('comprehensive')}
                          className="py-2.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all border border-purple-100 dark:border-purple-900/50"
                      >
                          🌟 برنامه جامع
                      </button>
                      <button
                          onClick={() => applyPreset('default')}
                          className="py-2.5 px-2 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all border border-gray-200 dark:border-gray-700"
                      >
                          🔄 پیش‌فرض اولیه
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Deeds List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">معیارهای امتیاز روزانه</h2>
            <p className="mt-1 text-[11px] text-gray-400">
              {isReadOnly
                ? savedTotalAverage === null
                  ? 'گزارشی برای این روز ثبت نشده است'
                  : `${toPersianDigits(displayedDeeds.length)} مورد ثبت‌شده در این روز`
                : `${toPersianDigits(allDeeds.length)} مورد فعال و قابل محاسبه`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs font-bold text-primary-600 transition hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400"
          >
            <Settings2 className="h-4 w-4" />
            شخصی‌سازی کلی
          </button>
        </div>

        {/* Category: 🕌 نماز و عبادات */}
        {displayedDeeds.filter(d => d.type === 'prayer').length > 0 && (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-2">
                        <span>🕌</span>
                        <span>نماز و عبادات</span>
                    </h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                    {displayedDeeds.filter(d => d.type === 'prayer').map(deed => (
                        isInlineEditMode ? (
                            <InlineDeedEditor
                                key={deed.id}
                                deed={deed}
                                weight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : 2}
                                scoringSystem={scoringSystem}
                                onWeightChange={(w) => handleWeightChange(deed.id, w)}
                                onToggleActive={() => handleDeedToggleActive(deed.id, deed.isActive !== false ? false : true)}
                                onTitleChange={(t) => handleDeedTitleEdit(deed.id, t)}
                                onDelete={() => handleRemoveCustomDeed(deed.id)}
                            />
                        ) : (
                            <DeedInput
                                key={deed.id}
                                deed={deed}
                                value={scores[deed.id] || 0}
                                onChange={(val) => handleScoreChange(deed.id, val)}
                                disabled={isReadOnly}
                                scoringSystem={scoringSystem}
                                deedWeight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : 2}
                            />
                        )
                    ))}
                </div>
            </div>
        )}

        {/* Category: 📖 ادعیه و زیارات */}
        {displayedDeeds.filter(d => d.type === 'binary').length > 0 && (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2">
                        <span>📖</span>
                        <span>ادعیه و زیارات</span>
                    </h3>
                    {!isReadOnly && (
                        <button 
                            onClick={() => openAddModal('binary')}
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    {displayedDeeds.filter(d => d.type === 'binary').map(deed => (
                        isInlineEditMode ? (
                            <InlineDeedEditor
                                key={deed.id}
                                deed={deed}
                                weight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : 1}
                                scoringSystem={scoringSystem}
                                onWeightChange={(w) => handleWeightChange(deed.id, w)}
                                onToggleActive={() => handleDeedToggleActive(deed.id, deed.isActive !== false ? false : true)}
                                onTitleChange={(t) => handleDeedTitleEdit(deed.id, t)}
                                onDelete={() => handleRemoveCustomDeed(deed.id)}
                            />
                        ) : (
                            <DeedInput
                                key={deed.id}
                                deed={deed}
                                value={scores[deed.id] || 0}
                                onChange={(val) => handleScoreChange(deed.id, val)}
                                disabled={isReadOnly}
                                scoringSystem={scoringSystem}
                                deedWeight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : 1}
                            />
                        )
                    ))}
                </div>
            </div>
        )}

        {/* Category: 🌱 مراقبه‌های اخلاقی */}
        {displayedDeeds.filter(d => d.type === 'scalar').length > 0 && (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-cyan-600 dark:text-cyan-400 font-bold text-sm flex items-center gap-2">
                        <span>🌱</span>
                        <span>مراقبه‌های اخلاقی و سلوکی</span>
                    </h3>
                    {!isReadOnly && (
                        <button 
                            onClick={() => openAddModal('scalar')}
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-primary-100 hover:text-primary-600 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                    {displayedDeeds.filter(d => d.type === 'scalar').map(deed => (
                        isInlineEditMode ? (
                            <InlineDeedEditor
                                key={deed.id}
                                deed={deed}
                                weight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : (deed.id === 'gaze_control' || deed.id === 'truthfulness' ? 3 : 1)}
                                scoringSystem={scoringSystem}
                                onWeightChange={(w) => handleWeightChange(deed.id, w)}
                                onToggleActive={() => handleDeedToggleActive(deed.id, deed.isActive !== false ? false : true)}
                                onTitleChange={(t) => handleDeedTitleEdit(deed.id, t)}
                                onDelete={() => handleRemoveCustomDeed(deed.id)}
                            />
                        ) : (
                            <DeedInput
                                key={deed.id}
                                deed={deed}
                                value={scores[deed.id] || 0}
                                onChange={(val) => handleScoreChange(deed.id, val)}
                                disabled={isReadOnly}
                                scoringSystem={scoringSystem}
                                deedWeight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : (deed.id === 'gaze_control' || deed.id === 'truthfulness' ? 3 : 1)}
                            />
                        )
                    ))}
                </div>
            </div>
        )}

        {/* Category: ✨ اعمال طلایی */}
        {displayedDeeds.filter(d => d.type === 'golden').length > 0 && (
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-yellow-600 dark:text-yellow-500 font-bold text-sm flex items-center gap-2">
                        <Star className="w-4 h-4 fill-current animate-pulse text-yellow-500" />
                        <span>اعمال طلایی (پاداش ویژه)</span>
                    </h3>
                    {!isReadOnly && (
                        <button 
                            onClick={() => openAddModal('golden')}
                            className="w-6 h-6 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center hover:bg-yellow-100 hover:text-yellow-600 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-1">
                    {displayedDeeds.filter(d => d.type === 'golden').map(deed => (
                        isInlineEditMode ? (
                            <InlineDeedEditor
                                key={deed.id}
                                deed={deed}
                                weight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : (deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand' ? 20 : 10)}
                                scoringSystem={scoringSystem}
                                onWeightChange={(w) => handleWeightChange(deed.id, w)}
                                onToggleActive={() => handleDeedToggleActive(deed.id, deed.isActive !== false ? false : true)}
                                onTitleChange={(t) => handleDeedTitleEdit(deed.id, t)}
                                onDelete={() => handleRemoveCustomDeed(deed.id)}
                            />
                        ) : (
                            <DeedInput
                                key={deed.id}
                                deed={deed}
                                value={scores[deed.id] || 0}
                                onChange={(val) => handleScoreChange(deed.id, val)}
                                customTitle={custom_titles[deed.id]}
                                onCustomTitleChange={(title) => handleTitleChange(deed.id, title)}
                                disabled={isReadOnly}
                                scoringSystem={scoringSystem}
                                deedWeight={deedWeights[deed.id] !== undefined ? deedWeights[deed.id] : (deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand' ? 20 : 10)}
                            />
                        )
                    ))}
                </div>
            </div>
        )}

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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all duration-300 mt-6">
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
      {!isReadOnly && !isManagerOpen && !isAddModalOpen && (
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
