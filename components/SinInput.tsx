
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SINS_LIST, toPersianDigits } from '../constants';
import { AlertCircle, Plus, X } from 'lucide-react';

interface SinInputProps {
  selectedSins: string[];
  onChange: (sins: string[]) => void;
  disabled?: boolean;
}

export const SinInput: React.FC<SinInputProps> = ({ selectedSins, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSin = (sinId: string) => {
    if (disabled) return;
    onChange([...selectedSins, sinId]);
    setIsOpen(false);
  };

  const handleIncrementSin = (sinId: string) => {
      if (disabled) return;
      onChange([...selectedSins, sinId]);
  };

  const handleRemoveAllInstances = (sinId: string) => {
    if (disabled) return;
    onChange(selectedSins.filter(id => id !== sinId));
  };

  // Group selected sins by ID to count occurrences
  const groupedSins = useMemo(() => {
      const counts: Record<string, number> = {};
      selectedSins.forEach(id => {
          counts[id] = (counts[id] || 0) + 1;
      });
      return counts;
  }, [selectedSins]);

  return (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-3xl border border-red-100 dark:border-red-900/30 shadow-sm transition-colors duration-300 ${disabled ? 'opacity-80' : ''}`}>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-bold text-sm">محاسبه خطاها و گناهان</h3>
        </div>
        <span className="text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 px-2 py-1 rounded-lg">
          هر خطا ۱۰ امتیاز منفی
        </span>
      </div>

      <div className="space-y-4">
        {/* Dropdown Trigger */}
        {!disabled && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20"
            >
              <span>افزودن گناه یا خطا...</span>
              <Plus className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                {SINS_LIST.map((sin) => (
                  <button
                    key={sin.id}
                    onClick={() => handleAddSin(sin.id)}
                    className="w-full text-right px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-50 dark:border-gray-800 last:border-0"
                  >
                    {sin.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {Object.keys(groupedSins).length === 0 ? (
             <div className="w-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 py-2 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                <span className="text-xs">موردی ثبت نشده است (الحمدلله)</span>
             </div>
          ) : (
            Object.entries(groupedSins).map(([sinId, count]) => {
              const sin = SINS_LIST.find(s => s.id === sinId);
              const countNum = count as number;
              return (
                <div 
                    key={sinId}
                    className="animate-scale-in relative group flex items-stretch select-none"
                >
                  {/* Badge for count > 1 */}
                  {countNum > 1 && (
                      <div className="absolute -top-2 -right-2 z-10 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                          {toPersianDigits(countNum)}
                      </div>
                  )}
                  
                  <button
                    onClick={() => handleIncrementSin(sinId)}
                    disabled={disabled}
                    className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-300 px-3 py-2 rounded-r-lg border-l-0 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                    title="برای افزایش تعداد کلیک کنید"
                  >
                    {sin?.title || 'ناشناخته'}
                  </button>
                  
                  {!disabled && (
                    <button 
                        onClick={() => handleRemoveAllInstances(sinId)}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 rounded-l-lg flex items-center justify-center transition-colors"
                        title="حذف تمام موارد"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {selectedSins.length > 0 && (
            <div className="flex justify-end border-t border-gray-50 dark:border-gray-700 pt-2">
                <span className="text-xs font-bold text-red-500 dark:text-red-400">
                    مجموع کسر امتیاز: {toPersianDigits(selectedSins.length * 10)}-
                </span>
            </div>
        )}

      </div>
    </div>
  );
};
