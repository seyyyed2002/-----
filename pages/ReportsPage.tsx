
import React, { useMemo, useState } from 'react';
import { loadState } from '../services/storage';
import { BookHeart, Calendar, Quote, Star, X, ChevronLeft } from 'lucide-react';
import { toPersianDigits } from '../constants';
import { DailyRecord } from '../types';

export const ReportsPage: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<DailyRecord | null>(null);

    const reports = useMemo(() => {
        const data = loadState();
        const list = Object.values(data)
            .filter(record => record.report && record.report.trim().length > 0)
            .sort((a, b) => b.date.localeCompare(a.date)); // Newest first
        return list;
    }, []);

    const getScoreBadgeStyle = (score: number) => {
        if (score >= 100) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
        if (score >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
        if (score >= 50) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
    };

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600 animate-fade-in">
                <BookHeart className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center px-8">هنوز هیچ دل‌نوشته یا گزارشی ثبت نشده است.<br/>در صفحه «امروز» می‌توانید گزارش خود را بنویسید.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-4">
            
            {/* Modal for Full Report */}
            {selectedReport && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                             <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">
                                    {new Date(selectedReport.date).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                             </div>
                             <button onClick={() => setSelectedReport(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                                 <X className="w-5 h-5 text-gray-500" />
                             </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <p className="text-gray-700 dark:text-gray-200 text-sm leading-8 whitespace-pre-wrap">
                                {selectedReport.report}
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button 
                                onClick={() => setSelectedReport(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                بستن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-2 rounded-xl text-primary-600 dark:text-primary-400">
                    <BookHeart className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-gray-800 dark:text-gray-100">گنجینه دل‌نوشته‌ها</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">گزارش‌های روزانه شما به محضر امام زمان (عج)</p>
                </div>
            </div>

            <div className="space-y-4 relative">
                {/* Timeline Line */}
                <div className="absolute right-[27px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 -z-10"></div>

                {reports.map((record) => (
                    <div key={record.date} className="relative pr-14 group">
                        {/* Timeline Dot */}
                        <div className="absolute right-[22px] top-5 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10 group-hover:scale-125 transition-transform"></div>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3 border-b border-gray-50 dark:border-gray-700/50 pb-2">
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="font-medium">
                                        {new Date(record.date).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold ${getScoreBadgeStyle(record.total_average)}`}>
                                    {record.total_average >= 100 && <Star className="w-3 h-3 fill-current" />}
                                    <span>امتیاز: {toPersianDigits(record.total_average)}</span>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <Quote className="absolute -top-1 -right-1 w-6 h-6 text-primary-100 dark:text-primary-900/20 transform rotate-180" />
                                <div className="relative z-10">
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-8 whitespace-pre-wrap line-clamp-3">
                                        {record.report}
                                    </p>
                                    <button 
                                        onClick={() => setSelectedReport(record)}
                                        className="mt-2 text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline"
                                    >
                                        خواندن کامل
                                        <ChevronLeft className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
