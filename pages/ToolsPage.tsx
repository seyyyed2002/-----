
import React, { useState, useEffect, useRef } from 'react';
import { BookHeart, ChevronLeft, Volume2, VolumeX, RotateCcw, Target, Trophy, Flame, Dumbbell, Plus, Trash2, CheckCircle, Calendar, X, AlertTriangle, Sparkles } from 'lucide-react';
import { ReportsPage } from './ReportsPage'; 
import { WorkoutPage } from './WorkoutPage';
import { toPersianDigits, toEnglishDigits, getTodayStr } from '../constants';
import { Challenge } from '../types';
import { loadChallenges, saveChallenges } from '../services/storage';

type ToolType = 'none' | 'reports' | 'counter' | 'challenges' | 'workout';

interface ToolsPageProps {
    initialTool?: ToolType;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ initialTool = 'none' }) => {
    const [activeTool, setActiveTool] = useState<ToolType>(initialTool);

    // Update active tool if initialTool prop changes (e.g. navigation from outside)
    useEffect(() => {
        if (initialTool && initialTool !== 'none') {
            setActiveTool(initialTool);
        }
    }, [initialTool]);

    // --- Counter Tool Logic ---
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(100);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [clickAnim, setClickAnim] = useState(false);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [tempTarget, setTempTarget] = useState('');
    
    // Audio Context Ref
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- Challenge Tool Logic ---
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [isAddChallengeOpen, setIsAddChallengeOpen] = useState(false);
    const [newChallengeTitle, setNewChallengeTitle] = useState('');
    const [newChallengeDays, setNewChallengeDays] = useState(40);
    
    // Delete Confirmation State
    const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);
    
    // Load tools state
    useEffect(() => {
        // Challenges
        setChallenges(loadChallenges());
    }, []);

    // Initialize Audio Context on first interaction
    const initAudio = () => {
        if (!audioCtxRef.current) {
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    audioCtxRef.current = new AudioContext();
                }
            } catch (e) {
                console.error("Audio init failed", e);
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playClickSound = () => {
        if (!soundEnabled) return;
        initAudio(); // Ensure context is ready

        try {
            const ctx = audioCtxRef.current;
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            // Soft "Bubble" / Modern UI Click
            const now = ctx.currentTime;

            osc.type = 'sine';
            // Start higher and drop quickly for a "pop" effect
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

            // Very short and soft envelope
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.01); // Soft attack
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); // Quick decay

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const updateCount = (newVal: number) => {
        setCount(newVal);
        
        // Trigger Animation
        if (newVal > count) {
            setClickAnim(true);
            setTimeout(() => setClickAnim(false), 150);
        }

        if (newVal > 0) {
            if (navigator.vibrate && soundEnabled) navigator.vibrate(15);
            if (newVal > count) playClickSound();
        }
    };

    const handleTargetSave = () => {
        if (tempTarget) {
            // tempTarget is already stored as English digits due to onChange logic
            const val = parseInt(tempTarget);
            if (val > 0) setTarget(val);
        }
        setIsTargetModalOpen(false);
    };

    // Challenge Functions
    const handleAddChallenge = () => {
        if (!newChallengeTitle.trim()) return;
        
        const newChallenge: Challenge = {
            id: `challenge_${Date.now()}`,
            title: newChallengeTitle,
            totalDays: newChallengeDays,
            startDate: getTodayStr(),
            completedDates: [],
            status: 'active'
        };

        const updated = [newChallenge, ...challenges];
        setChallenges(updated);
        saveChallenges(updated);
        setIsAddChallengeOpen(false);
        setNewChallengeTitle('');
        setNewChallengeDays(40);
    };

    const confirmDeleteChallenge = () => {
        if (challengeToDelete) {
            const updated = challenges.filter(c => c.id !== challengeToDelete);
            saveChallenges(updated);
            setChallenges(updated);
            setChallengeToDelete(null);
        }
    };

    const handleChallengeCheckIn = (id: string) => {
        const today = getTodayStr();
        const updated = challenges.map(c => {
            if (c.id === id) {
                if (c.completedDates.includes(today)) return c; // Already checked today

                const newCompleted = [...c.completedDates, today];
                let newStatus = c.status;
                if (newCompleted.length >= c.totalDays) {
                    newStatus = 'success';
                }
                return { ...c, completedDates: newCompleted, status: newStatus };
            }
            return c;
        });
        setChallenges(updated);
        saveChallenges(updated);
    };
    
    const handleChallengeToggleStatus = (id: string) => {
        const updated = challenges.map(c => {
            if (c.id === id) {
                 // Toggle between failed and active (allows user to mark as failed manually)
                 const nextStatus = c.status === 'failed' ? 'active' : 'failed';
                 return { ...c, status: nextStatus };
            }
            return c;
        });
        setChallenges(updated);
        saveChallenges(updated);
    }

    if (activeTool === 'reports') {
        return (
            <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setActiveTool('none')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">دل‌نوشته‌ها</h2>
                </div>
                <ReportsPage />
            </div>
        );
    }

    if (activeTool === 'workout') {
        return (
            <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setActiveTool('none')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">باشگاه ورزشی</h2>
                </div>
                <WorkoutPage />
            </div>
        );
    }

    if (activeTool === 'counter') {
        // Circular Progress Calculation
        const radius = 120;
        const stroke = 12;
        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (Math.min(count, target) / target) * circumference;

        return (
            <div className="animate-fade-in min-h-[calc(100vh-140px)] flex flex-col relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-lg pointer-events-none z-0">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                <div className="flex items-center justify-between mb-6 z-10">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTool('none')} className="p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                        <h2 className="font-bold text-gray-800 dark:text-gray-100">شمارنده ذکر</h2>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => {
                                setTempTarget(target.toString());
                                setIsTargetModalOpen(true);
                            }}
                            className="p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700 rounded-full text-indigo-600 dark:text-indigo-400"
                        >
                            <Target className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setSoundEnabled(!soundEnabled)} 
                            className={`p-2 backdrop-blur-md border border-white/20 dark:border-gray-700 rounded-full transition-colors ${soundEnabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white/50 dark:bg-gray-800/50 text-gray-400'}`}
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Target Modal */}
                {isTargetModalOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                         <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">تعیین هدف شمارش</h3>
                                <button onClick={() => setIsTargetModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-medium text-gray-500 mb-1">تعداد هدف</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={tempTarget}
                                    onChange={(e) => setTempTarget(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold text-lg"
                                    autoFocus
                                    placeholder="مثال: ۱۰۰"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsTargetModalOpen(false)}
                                    className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleTargetSave}
                                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
                                >
                                    تایید
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center gap-10 z-10">
                    {/* Main Counter Display */}
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl transition-all duration-150 ${clickAnim ? 'scale-110 opacity-40' : 'scale-100 opacity-20'}`}></div>
                        
                        {/* SVG Progress */}
                        <svg
                            height={radius * 2}
                            width={radius * 2}
                            className="rotate-[-90deg] drop-shadow-xl"
                        >
                            <circle
                                stroke="currentColor"
                                fill="transparent"
                                strokeWidth={stroke}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className="text-gray-200 dark:text-gray-800"
                            />
                            <circle
                                stroke="url(#gradient)"
                                fill="transparent"
                                strokeWidth={stroke}
                                strokeDasharray={circumference + ' ' + circumference}
                                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.3s ease' }}
                                strokeLinecap="round"
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                            />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#818cf8" />
                                    <stop offset="100%" stopColor="#c084fc" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Inner Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span 
                                className={`text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 transition-all duration-150 select-none ${clickAnim ? 'scale-125' : 'scale-100'}`}
                            >
                                {toPersianDigits(count)}
                            </span>
                            <span className="text-sm text-gray-400 font-medium mt-2 bg-white/80 dark:bg-gray-900/80 px-3 py-1 rounded-full backdrop-blur-sm border border-gray-100 dark:border-gray-700">
                                هدف: {toPersianDigits(target)}
                            </span>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-8 w-full max-w-xs justify-center">
                        <button 
                            onClick={() => updateCount(0)}
                            className="p-4 rounded-full bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-900/30 transition-all active:scale-95"
                            title="بازنشانی"
                        >
                            <RotateCcw className="w-6 h-6" />
                        </button>
                        
                        <button 
                            onClick={() => updateCount(count + 1)}
                            className="relative w-24 h-24 rounded-3xl group transition-transform active:scale-90 touch-manipulation outline-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-600 rounded-3xl shadow-lg shadow-indigo-500/40 transition-all duration-300 ${clickAnim ? 'brightness-125 shadow-indigo-500/60' : ''}`}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                <Plus className={`w-10 h-10 transition-transform duration-200 ${clickAnim ? 'rotate-90 scale-125' : ''}`} />
                            </div>
                            {/* Particle Effect Simulation */}
                             <div className={`absolute -inset-2 border border-indigo-400/30 rounded-[28px] opacity-0 transition-all duration-300 ${clickAnim ? 'scale-110 opacity-100' : 'scale-100'}`}></div>
                        </button>

                         <div className="w-14 h-14"></div> {/* Spacer to balance layout */}
                    </div>
                </div>
            </div>
        );
    }

    if (activeTool === 'challenges') {
        const today = getTodayStr();

        return (
            <div className="animate-fade-in pb-20">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setActiveTool('none')} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <h2 className="font-bold text-gray-800 dark:text-gray-100">چالش‌های معنوی</h2>
                    </div>
                    <button 
                        onClick={() => setIsAddChallengeOpen(true)}
                        className="flex items-center gap-1 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/50 transition"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>چله جدید</span>
                    </button>
                </div>

                {/* Add Challenge Modal */}
                {isAddChallengeOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">تعریف چله جدید</h3>
                                <button onClick={() => setIsAddChallengeOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">عنوان چالش</label>
                                    <input 
                                        type="text" 
                                        value={newChallengeTitle}
                                        onChange={(e) => setNewChallengeTitle(e.target.value)}
                                        placeholder="مثال: زیارت عاشورا"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">مدت زمان (روز)</label>
                                    <input 
                                        type="tel"
                                        inputMode="numeric"
                                        value={toPersianDigits(newChallengeDays)}
                                        onChange={(e) => {
                                            const englishVal = toEnglishDigits(e.target.value);
                                            const numericVal = englishVal.replace(/[^0-9]/g, '');
                                            setNewChallengeDays(Number(numericVal) || 0);
                                        }}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setIsAddChallengeOpen(false)}
                                    className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                >
                                    انصراف
                                </button>
                                <button 
                                    onClick={handleAddChallenge}
                                    disabled={!newChallengeTitle.trim()}
                                    className="flex-1 py-2 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    ایجاد
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {challengeToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700">
                             <div className="flex flex-col items-center text-center mb-4">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-3">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">حذف چالش</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    آیا مطمئن هستید که می‌خواهید این چالش را حذف کنید؟ این عملیات غیرقابل بازگشت است.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setChallengeToDelete(null)}
                                    className="flex-1 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
                                >
                                    انصراف
                                </button>
                                <button 
                                    onClick={confirmDeleteChallenge}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                                >
                                    بله، حذف کن
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="grid gap-4">
                    {challenges.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
                            <Flame className="w-8 h-8 mb-2 opacity-20" />
                            <span className="text-sm">هیچ چالشی فعال نیست</span>
                            <button onClick={() => setIsAddChallengeOpen(true)} className="text-xs text-orange-500 mt-2 hover:underline">ایجاد اولین چله</button>
                        </div>
                    ) : (
                        challenges.map(challenge => {
                            const progress = (challenge.completedDates.length / challenge.totalDays) * 100;
                            const isDoneToday = challenge.completedDates.includes(today);
                            const isCompleted = challenge.status === 'success';
                            const isFailed = challenge.status === 'failed';

                            return (
                                <div 
                                    key={challenge.id} 
                                    className={`relative rounded-2xl p-5 shadow-sm border transition-all duration-300 ${
                                        isCompleted ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                                        isFailed ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                                        'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                    }`}
                                >
                                    {/* Delete Button */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setChallengeToDelete(challenge.id);
                                        }}
                                        className="absolute top-4 left-4 p-2 bg-white/50 dark:bg-black/20 hover:bg-red-50 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-500 rounded-full transition-colors z-10"
                                        title="حذف چالش"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="flex justify-between items-start mb-4 pr-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl flex-shrink-0 ${
                                                isCompleted ? 'bg-green-100 text-green-600' :
                                                isFailed ? 'bg-red-100 text-red-600' :
                                                'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
                                            }`}>
                                                {isCompleted ? <Trophy className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${
                                                    isCompleted ? 'text-green-800 dark:text-green-100' :
                                                    isFailed ? 'text-red-800 dark:text-red-100' :
                                                    'text-gray-800 dark:text-gray-100'
                                                }`}>{challenge.title}</h3>
                                                <div className="flex items-center gap-2 text-xs opacity-70 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{toPersianDigits(challenge.totalDays)} روزه</span>
                                                    <span>•</span>
                                                    <span>شروع: {challenge.startDate}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCompleted && !isFailed && (
                                        <div className="mb-4">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-xs text-gray-500">پیشرفت</span>
                                                <div className="flex items-baseline gap-1">
                                                     <span className="font-bold text-lg text-orange-600 dark:text-orange-400">
                                                         {toPersianDigits(challenge.completedDates.length)}
                                                     </span>
                                                     <span className="text-xs text-gray-400">از {toPersianDigits(challenge.totalDays)}</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-l from-orange-400 to-red-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        {!isCompleted && !isFailed && (
                                            <button 
                                                onClick={() => handleChallengeCheckIn(challenge.id)}
                                                disabled={isDoneToday}
                                                className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                                    isDoneToday 
                                                        ? 'bg-green-100 text-green-700 cursor-default' 
                                                        : 'bg-gray-800 dark:bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-600 shadow-lg shadow-gray-400/20'
                                                }`}
                                            >
                                                {isDoneToday ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>امروز انجام شد</span>
                                                    </>
                                                ) : (
                                                    <span>ثبت انجام امروز</span>
                                                )}
                                            </button>
                                        )}
                                        
                                        {/* Status Toggle / Give Up Button */}
                                        {!isCompleted && (
                                            <button 
                                                onClick={() => handleChallengeToggleStatus(challenge.id)}
                                                className={`px-4 py-2.5 rounded-xl font-bold border transition-colors ${
                                                    isFailed
                                                        ? 'w-full bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                                        : 'border-red-100 text-red-400 hover:bg-red-50 hover:text-red-500 dark:border-red-900/30 dark:hover:bg-red-900/20'
                                                }`}
                                            >
                                                {isFailed ? 'شروع مجدد' : 'انصراف'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    }

    // Default: Tool Grid
    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 px-2">جعبه ابزار</h2>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => setActiveTool('reports')}
                    className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
                >
                    <div className="p-3 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-2xl group-hover:scale-110 transition-transform">
                        <BookHeart className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">دل‌نوشته</h3>
                        <span className="text-[10px] text-gray-400">ثبت گزارش روزانه</span>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTool('counter')}
                    className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
                >
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform">
                        <Target className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">ذکرشمار</h3>
                        <span className="text-[10px] text-gray-400">شمارنده با هدف</span>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTool('workout')}
                    className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
                >
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 rounded-2xl group-hover:scale-110 transition-transform">
                        <Dumbbell className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">باشگاه</h3>
                        <span className="text-[10px] text-gray-400">ثبت و تحلیل ورزش</span>
                    </div>
                </button>

                <button 
                    onClick={() => setActiveTool('challenges')}
                    className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 text-center group"
                >
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">چالش‌ها</h3>
                        <span className="text-[10px] text-gray-400">مسابقات معنوی</span>
                    </div>
                </button>
            </div>
        </div>
    );
};
