
import React, { useEffect, useState } from 'react';
import { loadQada, saveQada, getRecord, saveRecord } from '../services/storage';
import { QadaCounts, DailyRecord } from '../types';
import { QADA_ITEMS, getTodayStr, toPersianDigits } from '../constants';
import { 
    Check, 
    Plus, 
    Sun, 
    Moon, 
    Sunrise, 
    Sunset, 
    Briefcase, 
    Archive, 
    TrendingDown,
    CheckCircle2
} from 'lucide-react';

export const QadaPage: React.FC = () => {
    const [counts, setCounts] = useState<QadaCounts>({
        fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ayat: 0, fasting: 0
    });
    const [performedToday, setPerformedToday] = useState<Record<string, number>>({});

    useEffect(() => {
        const loaded = loadQada();
        setCounts(loaded);
        
        // Load today's performed counts
        const todayStr = getTodayStr();
        const record = getRecord(todayStr);
        if (record && record.performed_qada) {
            setPerformedToday(record.performed_qada);
        }
    }, []);

    const updateCount = (key: keyof QadaCounts, delta: number) => {
        const currentVal = counts[key];
        const newVal = Math.max(0, currentVal + delta);
        
        if (currentVal === newVal) return;

        // Update Global Qada Storage
        const newCounts = { ...counts, [key]: newVal };
        setCounts(newCounts);
        saveQada(newCounts);

        // If decreased debt (performed), log to today's record
        if (delta < 0) {
            const todayStr = getTodayStr();
            const record = getRecord(todayStr) || createEmptyRecord(todayStr);
            
            const currentPerformed = record.performed_qada?.[key] || 0;
            const newPerformed = currentPerformed + 1;
            
            const updatedPerformedMap = {
                ...(record.performed_qada || {}),
                [key]: newPerformed
            };
            
            record.performed_qada = updatedPerformedMap;
            saveRecord(record);
            setPerformedToday(updatedPerformedMap);
        }
    };

    const createEmptyRecord = (date: string): DailyRecord => ({
        date,
        scores: {},
        sins: [],
        custom_titles: {},
        report: '',
        total_average: 0,
        performed_qada: {},
        updated_at: Date.now()
    });

    // Uniform configuration for all items
    const getIcon = (key: string) => {
        switch (key) {
            case 'fajr': return <Sunrise className="w-6 h-6" />;
            case 'dhuhr': return <Sun className="w-6 h-6" />;
            case 'asr': return <Sun className="w-6 h-6 opacity-80" />;
            case 'maghrib': return <Sunset className="w-6 h-6" />;
            case 'isha': return <Moon className="w-6 h-6" />;
            case 'ayat': return <Archive className="w-6 h-6" />;
            case 'fasting': return <Briefcase className="w-6 h-6" />;
            default: return <Archive className="w-6 h-6" />;
        }
    };

    const totalMissed = (Object.values(counts) as number[]).reduce((a: number, b: number) => a + b, 0);
    const totalPerformedToday = (Object.values(performedToday) as number[]).reduce((a: number, b: number) => a + b, 0);

    // Group items
    const dailyPrayers = QADA_ITEMS.filter(i => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(i.key));
    const otherObligations = QADA_ITEMS.filter(i => ['ayat', 'fasting'].includes(i.key));

    const QadaCard: React.FC<{ item: typeof QADA_ITEMS[0] }> = ({ item }) => {
        const count = counts[item.key];
        const performed = performedToday[item.key] || 0;
        
        // Common Styling
        const containerClasses = "relative p-4 rounded-3xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800";
        const iconBgClass = "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400";
        const btnClass = "bg-green-600 hover:bg-green-700 text-white";

        return (
            <div className={containerClasses}>
                {/* Top Row: Icon, Title, Quick Add Debt */}
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl shadow-sm ${iconBgClass}`}>
                            {getIcon(item.key)}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">{item.title}</h3>
                            {count === 0 ? (
                                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                    تسویه شد
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {toPersianDigits(count)} مورد باقی‌مانده
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Add Debt Button */}
                    <button 
                        onClick={() => updateCount(item.key, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="افزودن به قضا (قضا شد)"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Middle: Big Count Display */}
                <div className="flex items-end justify-between mb-4 px-1">
                     <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black ${count > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-green-500'}`}>
                            {toPersianDigits(count)}
                        </span>
                        {performed > 0 && (
                            <span className="text-[10px] text-green-600 dark:text-green-400 animate-pulse font-bold">
                                (+{toPersianDigits(performed)} امروز)
                            </span>
                        )}
                     </div>
                </div>

                {/* Bottom: Main Action Button */}
                <button 
                    onClick={() => updateCount(item.key, -1)}
                    disabled={count === 0}
                    className={`w-full py-3 rounded-xl font-bold shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 ${btnClass} ${count === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                    {count === 0 ? (
                        <>
                           <CheckCircle2 className="w-5 h-5" />
                           <span>تکمیل شد</span>
                        </>
                    ) : (
                        <>
                           <Check className="w-5 h-5" />
                           <span>یک مورد ادا کردم</span>
                        </>
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-8">
            
            {/* Hero Section - Themed to match Levels/Dashboard (Indigo/Purple) */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                 {/* Background patterns */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

                 <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-sm text-indigo-100 mb-2 font-medium">وضعیت کلی تعهدات</span>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-6xl font-black tracking-tighter drop-shadow-sm">{toPersianDigits(totalMissed)}</span>
                        <span className="text-lg text-indigo-100 font-medium">قضای باقی‌مانده</span>
                    </div>

                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 w-full flex items-center justify-between border border-white/20 shadow-inner">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl text-green-600 shadow-sm">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-indigo-100 font-medium">عملکرد امروز</div>
                                <div className="font-bold text-lg">{toPersianDigits(totalPerformedToday)} مورد ادا شد</div>
                            </div>
                        </div>
                        {totalPerformedToday > 0 && (
                            <div className="flex items-center gap-1 text-white text-xs font-bold bg-green-500/30 px-2 py-1 rounded-lg border border-green-400/30">
                                <TrendingDown className="w-3 h-3" />
                                <span>کاهش بدهی</span>
                            </div>
                        )}
                    </div>
                 </div>
            </div>

            {/* Daily Prayers Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                    <h2 className="font-bold text-gray-700 dark:text-gray-200">نمازهای یومیه</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {dailyPrayers.map(item => (
                        <QadaCard key={item.key} item={item} />
                    ))}
                </div>
            </div>

            {/* Other Obligations Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1 h-5 bg-indigo-300 rounded-full"></div>
                    <h2 className="font-bold text-gray-700 dark:text-gray-200">سایر واجبات</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {otherObligations.map(item => (
                        <QadaCard key={item.key} item={item} />
                    ))}
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-400 dark:text-gray-600 pt-4 pb-8">
                «خداوند جبران کننده گذشته‌هاست»
            </div>
        </div>
    );
};
