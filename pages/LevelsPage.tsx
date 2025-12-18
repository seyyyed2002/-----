
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { loadState, loadUserLevel } from '../services/storage';
import { toPersianDigits, DEEDS } from '../constants';
import { Check, X, Info, MapPin, Lock, Star, Crown, Tent } from 'lucide-react';

const MOKEB_NAMES: Record<number, string> = {
    10: 'موکب حبیب بن مظاهر',
    20: 'موکب حر',
    30: 'موکب قاسم بن الحسن',
    40: 'موکب علی اصغر',
    50: 'موکب علی اکبر',
    60: 'موکب حضرت زینب',
    70: 'موکب حضرت ابوالفضل',
    80: 'موکب حضرت رقیه',
    90: 'موکب امام حسین (ع)'
};

export const LevelsPage: React.FC = () => {
    const [currentAmoud, setCurrentAmoud] = useState(1);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const currentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const l = loadUserLevel();
        setCurrentAmoud(l.currentAmoud);
    }, []);

    // Auto scroll to current level
    useEffect(() => {
        if (currentRef.current) {
            currentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentAmoud]);

    // Get current week stats
    const weeklyProgress = useMemo(() => {
        const records = loadState();
        const today = new Date();
        const currentDay = today.getDay(); 
        const jsDayToIrDay = (jsDay: number) => (jsDay + 1) % 7;
        const todayIndex = jsDayToIrDay(currentDay);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - todayIndex);

        const days = [];
        const dayNames = ['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const record = records[dateStr];
            
            let status: 'pending' | 'success' | 'fail' = 'pending';
            
            if (record) {
                const cond1 = record.totalAverage >= 90;
                const cond2 = !Object.values(record.scores).some(s => s === -100);
                const gaze = record.scores['gaze_control'] || 0;
                const truth = record.scores['truthfulness'] || 0;
                const cond3 = gaze >= 90 && truth >= 90;
                const binaryDeeds = DEEDS.filter(d => d.type === 'binary');
                const cond4 = binaryDeeds.every(d => (record.scores[d.id] || 0) === 100);

                if (cond1 && cond2 && cond3 && cond4) {
                    status = 'success';
                } else {
                    status = 'fail';
                }
            } else if (dateStr < new Date().toISOString().split('T')[0]) {
                status = 'fail';
            }
            days.push({ name: dayNames[i], status });
        }
        return days;
    }, []);

    // Winding Path Logic
    const renderWindingPath = () => {
        const totalLevels = 100;
        const levelsPerRow = 4;
        const rows = [];

        // Create rows (bottom up: 1-4, 5-8 ...)
        for (let i = 0; i < totalLevels; i += levelsPerRow) {
            const chunk = Array.from({ length: Math.min(levelsPerRow, totalLevels - i) }, (_, j) => i + j + 1);
            rows.push(chunk);
        }

        // We want to render from top (100) down to bottom (1)
        // Reverse rows so 100 is at the top of the container
        const reversedRows = [...rows].reverse();

        return reversedRows.map((rowLevels, rowIndex) => {
            // Determine direction.
            // Original row 0 (1-4) should be LTR.
            // Original row 1 (5-8) should be RTL.
            // Since we reversed, we need to calculate based on original index.
            const originalRowIndex = rows.length - 1 - rowIndex;
            const isLTR = originalRowIndex % 2 === 0;

            return (
                <div key={rowIndex} className="relative py-4">
                    {/* The Path Connector (Horizontal) */}
                    <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-100 dark:bg-gray-700/50 -z-0 rounded-full mx-8"></div>
                    
                    {/* The Turn Connectors */}
                    {rowIndex < reversedRows.length - 1 && (
                        <div 
                            className={`absolute h-16 w-16 border-4 border-gray-100 dark:border-gray-700/50 -z-0 rounded-full
                            ${isLTR 
                                ? 'right-4 top-1/2 border-l-0 border-b-0 rounded-bl-none rounded-tr-3xl' // Turn right -> down
                                : 'left-4 top-1/2 border-r-0 border-b-0 rounded-br-none rounded-tl-3xl' // Turn left -> down
                            }`}
                            style={{ 
                                clipPath: isLTR ? 'inset(0 0 0 50%)' : 'inset(0 50% 0 0)', // Clip to make arc
                                width: '4rem',
                                height: '4rem',
                                transform: isLTR ? 'translateY(20%)' : 'translateY(20%)' // Adjust vertical alignment
                            }}
                        ></div>
                    )}
                    
                    {/* Actual Connector for turns - simplified implementation */}
                     {rowIndex < reversedRows.length - 1 && (
                        <div className={`absolute top-1/2 w-3 bg-gray-100 dark:bg-gray-700/50 h-[calc(100%+32px)] -z-0 ${isLTR ? 'right-8 rounded-tr-full rounded-br-full' : 'left-8 rounded-tl-full rounded-bl-full'}`}></div>
                     )}

                    <div className={`flex justify-between px-8 relative z-10 ${isLTR ? 'flex-row' : 'flex-row-reverse'}`}>
                        {rowLevels.map((level) => {
                            const isCompleted = level < currentAmoud;
                            const isCurrent = level === currentAmoud;
                            const isLocked = level > currentAmoud;
                            const isMilestone = level % 10 === 0 || level === 1;
                            const isLevel100 = level === 100;
                            const mokebName = MOKEB_NAMES[level];

                            return (
                                <div 
                                    key={level} 
                                    ref={isCurrent ? currentRef : null}
                                    className="flex flex-col items-center relative group min-w-[3.5rem]"
                                >
                                    <div 
                                        className={`
                                            rounded-full flex items-center justify-center border-4 shadow-sm transition-all duration-500 relative
                                            ${isLevel100 
                                                ? 'w-20 h-20 border-yellow-300 dark:border-yellow-600 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white shadow-xl shadow-amber-500/40 z-20' 
                                                : 'w-14 h-14'
                                            }
                                            ${!isLevel100 && isCurrent 
                                                ? 'bg-white border-blue-500 scale-110 shadow-lg shadow-blue-500/30 z-20' 
                                                : !isLevel100 && isCompleted 
                                                    ? 'bg-green-500 border-green-400 text-white' 
                                                    : !isLevel100 && 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                                            }
                                            ${!isLevel100 && isMilestone && !isCurrent && !isCompleted ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10' : ''}
                                        `}
                                    >
                                        {isCurrent && !isLevel100 && (
                                             <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20"></div>
                                        )}
                                        {isLevel100 && !isCompleted && !isCurrent && (
                                            <div className="absolute inset-0 rounded-full animate-pulse bg-amber-400 opacity-20"></div>
                                        )}
                                        {isLevel100 && (
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
                                        )}

                                        {isLevel100 ? (
                                            <Crown className={`w-10 h-10 ${isCompleted || isCurrent ? 'text-white drop-shadow-md animate-pulse' : 'text-white/80'}`} />
                                        ) : isCurrent ? (
                                            <div className="w-full h-full rounded-full overflow-hidden bg-blue-500 flex items-center justify-center">
                                                <MapPin className="w-6 h-6 text-white animate-bounce" />
                                            </div>
                                        ) : isCompleted ? (
                                            <Check className="w-6 h-6" />
                                        ) : isLocked ? (
                                             isMilestone ? <Tent className="w-6 h-6 text-yellow-500 fill-yellow-500" /> :
                                             <span className="text-sm font-bold font-mono opacity-50">{level}</span>
                                        ) : (
                                            <span className="text-sm font-bold">{toPersianDigits(level)}</span>
                                        )}
                                    </div>
                                    
                                    {isCurrent && (
                                        <div className={`absolute -top-10 ${isLevel100 ? 'bg-amber-600' : 'bg-blue-600'} text-white text-xs font-bold px-3 py-1 rounded-xl shadow-lg animate-fade-in whitespace-nowrap z-30`}>
                                            {isLevel100 ? 'سرباز امام زمان (عج)' : mokebName ? mokebName : `عمود ${toPersianDigits(level)}`}
                                            <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${isLevel100 ? 'bg-amber-600' : 'bg-blue-600'} rotate-45`}></div>
                                        </div>
                                    )}

                                    {isLevel100 && !isCurrent && (
                                        <div className="absolute -top-10 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap z-30 border border-white/20">
                                            سرباز امام زمان (عج)
                                        </div>
                                    )}
                                    
                                    {isMilestone && !isCurrent && !isLevel100 && (
                                        <div className="absolute -bottom-6 text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-2 py-0.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 whitespace-nowrap z-10 w-max text-center backdrop-blur-sm">
                                            {mokebName || `عمود ${toPersianDigits(level)}`}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            
            {/* Header / Current Status */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <div className="text-indigo-100 text-xs font-medium mb-1">موقعیت فعلی</div>
                        <h2 className="text-3xl font-black mb-2 flex items-baseline gap-2">
                            عمود {toPersianDigits(currentAmoud)}
                            <span className="text-sm font-normal opacity-80">از ۱۰۰</span>
                        </h2>
                        <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
                            {currentAmoud === 100 ? 'سرباز امام زمان (عج)' : 'در مسیر بندگی'}
                        </span>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                        <MapPin className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6 bg-black/20 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-white h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${currentAmoud}%` }}
                    ></div>
                </div>
            </div>

            {/* Weekly Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-green-500 rounded-full"></div>
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">مجوز صعود هفته</h3>
                    </div>
                    <button onClick={() => setIsInfoOpen(!isInfoOpen)} className="text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-gray-700/50 p-1.5 rounded-full transition-colors">
                        <Info className="w-4 h-4" />
                    </button>
                </div>

                {isInfoOpen && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl text-xs text-gray-600 dark:text-gray-300 mb-6 leading-6 border border-blue-100 dark:border-blue-800/30 animate-scale-in origin-top">
                        <p className="font-bold mb-2 text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-800 pb-1">شرایط صعود به عمود بعدی:</p>
                        <ul className="space-y-1.5">
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"></div>میانگین امتیاز کل بالای ۹۰</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"></div>عدم داشتن نماز قضا</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"></div>نمره کنترل نگاه و صداقت بالای ۹۰</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 bg-blue-400 rounded-full"></div>انجام کامل تمام اعمال قراردادی (۶ مورد)</li>
                        </ul>
                        <div className="mt-3 text-red-500 bg-white dark:bg-gray-900/50 p-2 rounded-lg border border-red-100 dark:border-red-900/30 flex gap-2">
                            <div className="min-w-[4px] bg-red-400 rounded-full"></div>
                            <p>اگر حتی یک روز از هفته شرایط فوق را نداشته باشید، این هفته متوقف می‌شوید.</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-start pt-2">
                    {weeklyProgress.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2 group">
                            <div className={`
                                w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300
                                ${day.status === 'success' ? 'bg-green-500 border-green-500 text-white shadow-green-200 dark:shadow-none shadow-md' : 
                                  day.status === 'fail' ? 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-900/50 text-red-400' : 
                                  'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-300'}
                            `}>
                                {day.status === 'success' && <Check className="w-4 h-4" />}
                                {day.status === 'fail' && <X className="w-4 h-4" />}
                                {day.status === 'pending' && <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></span>}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{day.name.charAt(0)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Path Visualizer - Standard Winding Map */}
            <div className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 px-4 py-1 rounded-full text-xs font-bold text-amber-700 dark:text-amber-500 z-10 shadow-sm flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    هدف نهایی
                </div>
                
                <div className="py-8">
                    {renderWindingPath()}
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-1 rounded-full text-xs font-bold text-gray-400 border border-gray-100 dark:border-gray-700 z-10 shadow-sm">
                    شروع
                </div>
            </div>
        </div>
    );
};
