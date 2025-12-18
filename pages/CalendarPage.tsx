
import React, { useState, useMemo } from 'react';
import { getRecord, loadState } from '../services/storage';
import { getTodayStr, toPersianDigits } from '../constants';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';

interface CalendarPageProps {
  onSelectDate: (date: string) => void;
  onSelectWorkout: (date: string) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onSelectDate, onSelectWorkout }) => {
  const [displayDate, setDisplayDate] = useState(new Date());

  const allRecords = useMemo(() => loadState(), [displayDate]);

  const monthTitle = displayDate.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });

  const generateCalendarDays = () => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const d = new Date(year, month, i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        days.push(dateStr);
    }
    
    return days;
  };

  const days = generateCalendarDays();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'bg-primary-500 text-white';
    if (score >= 70) return 'bg-primary-300 dark:bg-primary-700 text-primary-900 dark:text-primary-100';
    if (score >= 50) return 'bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100';
    return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(displayDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setDisplayDate(newDate);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{monthTitle}</h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400 dark:text-gray-500">
            <span>۱ش</span>
            <span>۲ش</span>
            <span>۳ش</span>
            <span>۴ش</span>
            <span>۵ش</span>
            <span>ج</span>
            <span>ش</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
            {days.map((dateStr, idx) => {
                if (!dateStr) return <div key={idx} className="aspect-square"></div>;
                
                const record = allRecords[dateStr];
                const hasScore = record !== undefined;
                const score = record?.totalAverage || 0;
                
                // Check if workouts exist for this day
                const hasWorkout = record?.workouts && (Object.values(record.workouts) as number[]).some(v => v > 0);
                
                const dayNum = new Date(dateStr).toLocaleDateString('fa-IR', { day: 'numeric' });
                const isToday = dateStr === getTodayStr();

                return (
                    <div
                        key={dateStr}
                        onClick={() => onSelectDate(dateStr)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-transform hover:scale-105 cursor-pointer ${
                             hasScore ? getScoreColor(score) : 'bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
                        } ${isToday ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-primary-500' : ''}`}
                    >
                        <span className="text-sm font-bold">{dayNum}</span>
                        <div className="flex gap-0.5 mt-0.5">
                            {hasScore && (
                                <span className="text-[9px] opacity-80">{toPersianDigits(score)}</span>
                            )}
                        </div>
                        {hasWorkout && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectWorkout(dateStr);
                                }}
                                className="absolute -top-2.5 -right-2.5 z-20 cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                                title="مشاهده آمار ورزشی این روز"
                            >
                                <div className="bg-purple-600 dark:bg-purple-500 text-white p-1.5 rounded-full border-[3px] border-white dark:border-gray-800 shadow-md">
                                    <Dumbbell className="w-3.5 h-3.5 fill-current" />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-primary-500"></div>عالی</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-primary-300 dark:bg-primary-700"></div>خوب</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-200 dark:bg-yellow-700"></div>متوسط</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/50"></div>نیاز به تلاش</div>
         <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400"><Dumbbell className="w-3 h-3" />فعالیت ورزشی</div>
      </div>
    </div>
  );
};
