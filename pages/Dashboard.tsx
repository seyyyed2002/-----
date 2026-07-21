
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTodayStr, toPersianDigits, CATEGORY_META } from '../constants';
import { AppSettings, DailyRecord, ActiveDeed, DeedCategory } from '../types';
import {
  DEED_SNAPSHOT_KEY, getConfiguredDeeds, getRecordDeeds,
  serializeDeedSnapshot, saveRecord, getRecord,
  loadSettings, saveSettings, saveActiveDeeds,
  loadQada, saveQada
} from '../services/storage';
import { DeedInput } from '../components/DeedInput';
import { SinInput } from '../components/SinInput';
import { DeedLibraryModal } from '../components/DeedLibraryModal';
import {
  Save, ChevronLeft, ChevronRight, Lock, Star, AlertCircle,
  BookOpen, Settings2, GripVertical, Trash2, Edit3, X, Check, Sliders
} from 'lucide-react';

// ─── Drag & Drop helpers ───────────────────────────────────────────────────
let dragSrc: string | null = null;

// ─── Inline edit card for each deed in the board ─────────────────────────
const ActiveDeedCard: React.FC<{
  deed: ActiveDeed;
  score: number;
  isReadOnly: boolean;
  isEditMode: boolean;
  totalPoints: number;
  onScoreChange: (val: number) => void;
  onPointsChange: (pts: number) => void;
  onTitleChange: (title: string) => void;
  onTypeToggle: () => void;
  onRemove: () => void;
  onDragStart: (id: string) => void;
  onDrop: (targetId: string) => void;
}> = ({
  deed, score, isReadOnly, isEditMode, totalPoints,
  onScoreChange, onPointsChange, onTitleChange, onTypeToggle, onRemove,
  onDragStart, onDrop
}) => {
  const meta = CATEGORY_META[deed.category] || CATEGORY_META.custom;
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(deed.title);

  useEffect(() => setLocalTitle(deed.title), [deed.title]);

  const pct = totalPoints > 0 ? Math.round((deed.points / totalPoints) * 100) : 0;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden
        ${meta.bgColor} ${meta.borderColor}
        ${isEditMode ? 'shadow-md' : 'shadow-sm hover:shadow-md'}
      `}
      draggable={isEditMode && !deed.isLocked}
      onDragStart={() => onDragStart(deed.id)}
      onDragOver={e => e.preventDefault()}
      onDrop={() => onDrop(deed.id)}
    >
      {isEditMode ? (
        /* ─── Edit Mode ───────────────────────────────────────────────── */
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            {!deed.isLocked && (
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" />
            )}
            {deed.isLocked && (
              <Lock className={`w-4 h-4 flex-shrink-0 ${meta.color}`} />
            )}

            {/* Title */}
            {editingTitle ? (
              <input
                autoFocus
                type="text"
                value={localTitle}
                onChange={e => setLocalTitle(e.target.value)}
                onBlur={() => { onTitleChange(localTitle); setEditingTitle(false); }}
                onKeyDown={e => { if (e.key === 'Enter') { onTitleChange(localTitle); setEditingTitle(false); } }}
                className="flex-1 min-w-0 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
              />
            ) : (
              <span className={`flex-1 text-sm font-semibold truncate ${meta.color}`}>{deed.title}</span>
            )}

            {!deed.isLocked && !editingTitle && (
              <button onClick={() => setEditingTitle(true)} className="p-1 rounded-lg hover:bg-white/60 transition">
                <Edit3 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
              </button>
            )}
            {!deed.isLocked && (
              <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition">
                <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
              </button>
            )}
          </div>

          {/* Points + Type controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 dark:text-gray-500">امتیاز:</span>
            <button onClick={() => onPointsChange(Math.max(5, deed.points - 5))}
              className="w-6 h-6 rounded-lg bg-white/70 dark:bg-gray-700 font-bold flex items-center justify-center hover:bg-white">−</button>
            <span className="font-bold w-7 text-center">{toPersianDigits(deed.points)}</span>
            <button onClick={() => onPointsChange(deed.points + 5)}
              className="w-6 h-6 rounded-lg bg-white/70 dark:bg-gray-700 font-bold flex items-center justify-center hover:bg-white">+</button>

            <span className={`mr-auto text-[10px] ${meta.color} opacity-70`}>{toPersianDigits(pct)}٪ از کل</span>

            {!deed.isLocked && (
              <button
                onClick={onTypeToggle}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition
                  ${deed.type === 'binary'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 border-emerald-200'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 border-blue-200'}`}
              >
                {deed.type === 'binary' ? '✅ باینری' : '📊 کیفی'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ─── Normal Mode: show DeedInput-like UI ─────────────────────── */
        <div className="p-3">
          {deed.type === 'binary' ? (
            <div className="flex items-center gap-3">
              {deed.isLocked && <Lock className={`w-3.5 h-3.5 flex-shrink-0 ${meta.color} opacity-60`} />}
              <span className={`flex-1 text-sm font-medium ${meta.color}`}>{deed.title}</span>
              <span className="text-xs text-gray-400">{toPersianDigits(deed.points)} امتیاز</span>
              <button
                onClick={() => !isReadOnly && onScoreChange(score === 100 ? 0 : 100)}
                disabled={isReadOnly}
                className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center
                  ${score === 100
                    ? `${meta.bgColor.replace('bg-', 'bg-')} border-current ${meta.color} shadow-sm`
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300'
                  } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
              >
                {score === 100 && <Check className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            /* Scalar slider */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${meta.color}`}>{deed.title}</span>
                <span className="text-xs font-bold text-gray-500">{toPersianDigits(score)}٪</span>
              </div>
              <input
                type="range" min="0" max="100" step="10"
                value={score}
                onChange={e => !isReadOnly && onScoreChange(Number(e.target.value))}
                disabled={isReadOnly}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-violet-500 bg-gray-200 dark:bg-gray-700"
              />
              <div className="flex justify-between text-[10px] text-gray-300">
                {[0,10,20,30,40,50,60,70,80,90,100].map(v => (
                  <button key={v} onClick={() => !isReadOnly && onScoreChange(v)}
                    className={`w-5 h-5 rounded-full transition-all text-[9px] font-bold
                      ${score === v ? `${meta.bgColor} ${meta.color} ring-1 ring-current` : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'}`}>
                    {v === 0 ? '۰' : v === 100 ? '۱۰۰' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Dashboard ──────────────────────────────────────────────────────────────

interface DashboardProps {
  initialDate?: string;
  onDateChange?: (date: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialDate, onDateChange }) => {
  const [date, setDate] = useState(initialDate || getTodayStr());
  const [scores, setScores] = useState<Record<string, number>>({});
  const [sins, setSins] = useState<string[]>([]);
  const [report, setReport] = useState('');
  const [savedTotalAverage, setSavedTotalAverage] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);

  const [settings, setSettings] = useState<AppSettings>({ customDeeds: [] });
  const [activeDeeds, setActiveDeeds] = useState<ActiveDeed[]>([]);
  const [sinPenalty, setSinPenalty] = useState(10);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSinPenaltyOpen, setIsSinPenaltyOpen] = useState(false);

  // Random stars for golden score animation
  const randomStars = useMemo(() =>
    Array.from({ length: 40 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 2,
      delay: `${Math.random() * 3}s`,
      duration: `${Math.random() * 2 + 2}s`,
    })), []);

  const today = getTodayStr();
  const isReadOnly = date !== today;

  // Load data
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    setSinPenalty(loaded.sinPenalty !== undefined ? loaded.sinPenalty : 10);
    setActiveDeeds(loaded.activeDeeds || []);

    const record = getRecord(date);
    if (record) {
      setScores(record.scores);
      setReport(record.report);
      setSins(record.sins || []);
      setSavedTotalAverage(record.total_average);
    } else {
      setScores({});
      setReport('');
      setSins([]);
      setSavedTotalAverage(null);
    }
    if (onDateChange) onDateChange(date);
  }, [date, onDateChange]);

  // Persist activeDeeds changes
  const persistActiveDeeds = useCallback((deeds: ActiveDeed[]) => {
    const updated = saveActiveDeeds(deeds);
    setSettings(updated);
    setActiveDeeds(deeds);
  }, []);

  // ─── Library callbacks ──────────────────────────────────────────────
  const handleAddFromLibrary = useCallback((deed: ActiveDeed) => {
    setActiveDeeds(prev => {
      // prevent duplicates
      if (prev.some(d => d.libraryId === deed.libraryId)) return prev;
      const updated = [...prev, { ...deed, sortOrder: prev.length }];
      persistActiveDeeds(updated);
      return updated;
    });
  }, [persistActiveDeeds]);

  const handleRemoveFromBoard = useCallback((deedId: string) => {
    setActiveDeeds(prev => {
      const updated = prev.filter(d => d.id !== deedId);
      persistActiveDeeds(updated);
      return updated;
    });
  }, [persistActiveDeeds]);

  // ─── Inline edit callbacks ──────────────────────────────────────────
  const handlePointsChange = useCallback((deedId: string, pts: number) => {
    setActiveDeeds(prev => {
      const updated = prev.map(d => d.id === deedId ? { ...d, points: pts } : d);
      persistActiveDeeds(updated);
      return updated;
    });
  }, [persistActiveDeeds]);

  const handleTitleChange = useCallback((deedId: string, title: string) => {
    setActiveDeeds(prev => {
      const updated = prev.map(d => d.id === deedId ? { ...d, title } : d);
      persistActiveDeeds(updated);
      return updated;
    });
  }, [persistActiveDeeds]);

  const handleTypeToggle = useCallback((deedId: string) => {
    setActiveDeeds(prev => {
      const updated = prev.map(d =>
        d.id === deedId ? { ...d, type: d.type === 'binary' ? 'scalar' : 'binary' as 'binary' | 'scalar' } : d
      );
      persistActiveDeeds(updated);
      return updated;
    });
  }, [persistActiveDeeds]);

  // ─── Drag & Drop reorder ────────────────────────────────────────────
  const handleDragStart = useCallback((id: string) => { dragSrc = id; }, []);
  const handleDrop = useCallback((targetId: string) => {
    if (!dragSrc || dragSrc === targetId) return;
    setActiveDeeds(prev => {
      const arr = [...prev];
      const srcIdx = arr.findIndex(d => d.id === dragSrc);
      const tgtIdx = arr.findIndex(d => d.id === targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      const [moved] = arr.splice(srcIdx, 1);
      arr.splice(tgtIdx, 0, moved);
      const updated = arr.map((d, i) => ({ ...d, sortOrder: i }));
      persistActiveDeeds(updated);
      dragSrc = null;
      return updated;
    });
  }, [persistActiveDeeds]);

  // ─── Score calculation ──────────────────────────────────────────────
  const totalPoints = useMemo(() =>
    activeDeeds.filter(d => d.category !== 'sins').reduce((s, d) => s + d.points, 0),
    [activeDeeds]
  );

  const calculatedScore = useMemo(() => {
    let earned = 0;
    activeDeeds.forEach(deed => {
      if (deed.category === 'sins') return;
      const s = scores[deed.id] || 0;
      earned += (s / 100) * deed.points;
    });
    const penalty = sins.length * sinPenalty;
    const pct = totalPoints > 0 ? (earned / totalPoints) * 100 : 0;
    return Math.min(100, Math.max(-100, Math.round(pct - (penalty / totalPoints) * 100)));
  }, [scores, sins, activeDeeds, sinPenalty, totalPoints]);

  const total_average = isReadOnly && savedTotalAverage !== null
    ? savedTotalAverage
    : calculatedScore;

  // Group active deeds by category
  const deedsByCategory = useMemo(() => {
    const groups: Record<string, ActiveDeed[]> = {};
    [...activeDeeds].sort((a, b) => a.sortOrder - b.sortOrder).forEach(d => {
      if (!groups[d.category]) groups[d.category] = [];
      groups[d.category].push(d);
    });
    return groups;
  }, [activeDeeds]);

  const categoryOrder: DeedCategory[] = [
    'prayers_obligatory', 'prayers_optional', 'duas', 'quran', 'ziyarat',
    'golden', 'ethical', 'charity', 'knowledge', 'physical', 'custom'
  ];
  const activeCategories = categoryOrder.filter(cat => deedsByCategory[cat]?.length);

  // Score card color
  const getScoreColor = (s: number) => {
    if (s >= 100) return 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-yellow-300 shadow-yellow-500/50';
    if (s < 0) return 'bg-gradient-to-br from-red-800 to-rose-950';
    const tens = Math.floor(s / 10);
    const palette = [
      'bg-gradient-to-br from-red-600 to-orange-800',
      'bg-gradient-to-br from-orange-700 to-orange-900',
      'bg-gradient-to-br from-orange-600 to-amber-800',
      'bg-gradient-to-br from-orange-500 to-amber-700',
      'bg-gradient-to-br from-amber-600 to-yellow-700',
      'bg-gradient-to-br from-yellow-600 to-lime-800',
      'bg-gradient-to-br from-lime-600 to-green-800',
      'bg-gradient-to-br from-green-600 to-emerald-800',
      'bg-gradient-to-br from-emerald-600 to-teal-800',
      'bg-gradient-to-br from-teal-500 to-cyan-700',
    ];
    return palette[tens] || palette[0];
  };

  // Change date
  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    const nd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (days > 0 && nd > today) return;
    setDate(nd);
  };

  // Save record
  const handleSave = () => {
    if (isReadOnly) return;
    if (!report.trim()) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 2500);
      document.getElementById('report-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('report-textarea')?.focus();
      return;
    }
    setIsSaving(true);

    // Qada logic for obligatory prayers
    const originalRecord = getRecord(date);
    const originalScores = originalRecord?.scores || {};
    const qadaData = loadQada();
    let qadaChanged = false;

    const updateQada = (key: string, keys: ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[]) => {
      const isNow = scores[key] === -100;
      const was = originalScores[key] === -100;
      if (isNow && !was) { keys.forEach(k => qadaData[k]++); qadaChanged = true; }
      else if (!isNow && was) { keys.forEach(k => qadaData[k] = Math.max(0, qadaData[k] - 1)); qadaChanged = true; }
    };
    updateQada('prayer_fajr', ['fajr']);
    updateQada('prayer_dhuhr', ['dhuhr', 'asr']);
    updateQada('prayer_maghrib', ['maghrib', 'isha']);
    if (qadaChanged) saveQada(qadaData);

    const record: DailyRecord = {
      date, scores, sins, report, total_average,
      custom_titles: {},
      updated_at: Date.now()
    };
    saveRecord(record);

    setTimeout(() => {
      setIsSaving(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    }, 400);
  };

  const persianDate = new Date(date).toLocaleDateString('fa-IR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="space-y-5 relative" dir="rtl">

      {/* Library Modal */}
      <DeedLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        activeDeeds={activeDeeds}
        onAdd={handleAddFromLibrary}
        onRemove={handleRemoveFromBoard}
      />

      {/* ─── Score Card ─────────────────────────────────────────────────── */}
      <div className={`${getScoreColor(total_average)} rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transition-all duration-700`}>

        {total_average >= 100 && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-white/20 to-transparent rotate-45 animate-pulse" style={{ animationDuration: '3s' }} />
            {randomStars.map((star, i) => (
              <div key={i} className="absolute bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                style={{ top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`, animationDuration: star.duration, animationDelay: star.delay, opacity: Math.random() * 0.5 + 0.3 }} />
            ))}
          </div>
        )}

        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none z-0">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2" fill="currentColor" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#p)" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* Date nav */}
          <div className="flex justify-between items-center mb-5">
            <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-white/20 rounded-full transition">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h2 className="text-base font-bold opacity-90">
                {isReadOnly ? (date < today ? 'امتیاز روز گذشته' : 'روز آینده') : 'امتیاز امروز'}
              </h2>
              <div className="text-xs opacity-75 mt-0.5">{persianDate}</div>
            </div>
            <button onClick={() => changeDate(1)} disabled={date === today}
              className={`p-1.5 hover:bg-white/20 rounded-full transition ${date === today ? 'opacity-30 cursor-not-allowed' : ''}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Big score */}
          <div className="flex flex-col items-center">
            <div className="flex items-end gap-2" dir="ltr">
              <span className={`text-6xl font-black tracking-tighter leading-none ${total_average >= 100 ? 'drop-shadow-lg' : ''}`}>
                {toPersianDigits(total_average)}
              </span>
              <span className="text-xl mb-2 opacity-70 font-bold">/ ۱۰۰</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-black/20 h-2 rounded-full mt-4 overflow-hidden">
            <div className={`h-full transition-all duration-1000 ease-out ${total_average < 0 ? 'bg-red-400' : 'bg-white'}`}
              style={{ width: `${Math.max(0, Math.min(100, Math.abs(total_average)))}%` }} />
          </div>

          {isReadOnly && (
            <div className="mt-3 flex justify-center">
              <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <Lock className="w-3 h-3" /> <span>غیر قابل ویرایش</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stats strip ─────────────────────────────────────────────────── */}
      {!isReadOnly && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold">🕌 نمازها</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {toPersianDigits(activeDeeds.filter(d => d.category === 'prayers_obligatory' && scores[d.id] === 100).length)}
              {' '}/{' '}
              {toPersianDigits(activeDeeds.filter(d => d.category === 'prayers_obligatory').length)}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold">✅ انجام شده</div>
            <div className="text-sm font-black text-violet-600 dark:text-violet-400 mt-0.5">
              {toPersianDigits(activeDeeds.filter(d => d.category !== 'sins' && scores[d.id] === 100).length)} مورد
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="text-[10px] text-gray-400 font-bold">⚠️ خطاها</div>
            <div className="text-sm font-black text-red-500 mt-0.5">{toPersianDigits(sins.length)} خطا</div>
          </div>
        </div>
      )}

      {/* ─── Action bar ──────────────────────────────────────────────────── */}
      {!isReadOnly && (
        <div className="flex gap-2">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 مدیریت دفترم</span>
          </button>
          <button
            onClick={() => setIsEditMode(e => !e)}
            className={`flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl font-bold text-sm transition border ${
              isEditMode
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-100 dark:border-gray-700'
            }`}
          >
            {isEditMode ? <><X className="w-4 h-4" /> بستن ویرایش</> : <><Settings2 className="w-4 h-4" /> ویرایش</>}
          </button>
          <button
            onClick={() => setIsSinPenaltyOpen(o => !o)}
            className="py-3 px-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition hover:bg-gray-50"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sin penalty settings */}
      {isSinPenaltyOpen && !isReadOnly && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400">
            <span>جریمه هر گناه/خطا:</span>
            <span className="text-red-500">{toPersianDigits(sinPenalty)}− امتیاز</span>
          </div>
          <input
            type="range" min="0" max="30" step="5" value={sinPenalty}
            onChange={e => {
              const val = Number(e.target.value);
              setSinPenalty(val);
              const s = { ...settings, sinPenalty: val };
              saveSettings(s);
              setSettings(s);
            }}
            className="w-full accent-red-500 cursor-pointer"
          />
          <div className="text-[10px] text-gray-400">
            کل امتیاز قابل کسب: {toPersianDigits(totalPoints)} امتیاز (بدون جریمه)
          </div>
        </div>
      )}

      {/* ─── Deed Board ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        {activeCategories.map(cat => {
          const meta = CATEGORY_META[cat];
          const deeds = deedsByCategory[cat] || [];

          return (
            <div key={cat} className="space-y-2">
              {/* Category header */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${meta.bgColor} ${meta.borderColor} border`}>
                <span className="text-lg">{meta.emoji}</span>
                <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 ${meta.color} mr-auto`}>
                  {toPersianDigits(deeds.length)}
                </span>
                {cat === 'prayers_obligatory' && <Lock className={`w-3 h-3 ${meta.color} opacity-60`} />}
              </div>

              {/* Deeds in this category */}
              <div className={`grid gap-2 ${deeds[0]?.type === 'scalar' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {deeds.map(deed => (
                  <ActiveDeedCard
                    key={deed.id}
                    deed={deed}
                    score={scores[deed.id] || 0}
                    isReadOnly={isReadOnly}
                    isEditMode={isEditMode}
                    totalPoints={totalPoints}
                    onScoreChange={val => setScores(p => ({ ...p, [deed.id]: val }))}
                    onPointsChange={pts => handlePointsChange(deed.id, pts)}
                    onTitleChange={title => handleTitleChange(deed.id, title)}
                    onTypeToggle={() => handleTypeToggle(deed.id)}
                    onRemove={() => handleRemoveFromBoard(deed.id)}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {activeDeeds.length <= 3 && !isReadOnly && (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-gray-400 text-sm mb-3">دفتر مراقبه‌ات خالی است!</p>
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              📚 اعمال را از کتابخانه انتخاب کن
            </button>
          </div>
        )}
      </div>

      {/* ─── Sins Section ───────────────────────────────────────────────── */}
      <div>
        <SinInput selectedSins={sins} onChange={s => !isReadOnly && setSins(s)} disabled={isReadOnly} />
      </div>

      {/* ─── Report Section ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 text-sm">
            🌟 گزارش به امام زمان (عج)
            <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> اجباری
            </span>
          </label>
          {showValidationError && (
            <div className="flex items-center gap-1 text-red-500 text-xs font-bold animate-bounce">
              <AlertCircle className="w-3 h-3" /> لطفا تکمیل کنید
            </div>
          )}
        </div>
        <textarea
          id="report-textarea"
          value={report}
          onChange={e => !isReadOnly && setReport(e.target.value)}
          placeholder={isReadOnly ? 'گزارشی ثبت نشده است.' : 'دل‌نوشته یا گزارش اعمال امروز به حضرت...'}
          disabled={isReadOnly}
          className={`w-full h-32 p-3 rounded-xl border outline-none resize-none text-sm leading-relaxed transition-colors text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 ${
            showValidationError
              ? 'border-red-500 ring-1 ring-red-500 bg-red-50/50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-600'
          } ${isReadOnly ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed' : 'bg-white dark:bg-gray-800 focus:border-violet-400 focus:ring-1 focus:ring-violet-400'}`}
        />
      </div>

      {/* ─── FAB Save ─────────────────────────────────────────────────── */}
      {!isReadOnly && !isLibraryOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-3xl pb-4 flex justify-center z-[90] pointer-events-none">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`pointer-events-auto flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-xl transform transition-all active:scale-95 ${
              showSaveSuccess ? 'bg-green-600' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {isSaving ? <span>در حال ذخیره...</span>
              : showSaveSuccess ? <span>✅ ذخیره شد!</span>
              : <><Save className="w-5 h-5" /><span>ثبت اعمال</span></>}
          </button>
        </div>
      )}

      <div className="h-10" />
    </div>
  );
};
