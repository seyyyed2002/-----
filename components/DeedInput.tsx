

import React, { useState, useEffect, useRef } from 'react';
import { DeedDefinition } from '../types';
import { Check, X, Star, Edit2, Trash2 } from 'lucide-react';
import { toPersianDigits } from '../constants';

interface DeedInputProps {
  deed: DeedDefinition;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  customTitle?: string;
  onCustomTitleChange?: (title: string) => void;
  onDelete?: () => void;
}

const CustomSlider = ({ 
  value, 
  onChange, 
  disabled, 
  isQada = false 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  disabled?: boolean; 
  isQada?: boolean;
}) => {
  return (
    <div className="w-full h-8 relative flex items-center">
      <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full shadow-inner overflow-hidden relative">
        {/* Fill */}
        <div 
            className={`absolute top-0 right-0 bottom-0 transition-all duration-300 ease-out rounded-full ${
                isQada 
                    ? 'bg-red-100 w-full opacity-0' // Hide fill if Qada (value is 0 effectively)
                    : 'bg-gradient-to-l from-green-300 to-green-600'
            }`}
            style={{ width: isQada ? '0%' : `${value}%` }}
        />
      </div>

      {/* Thumb - Custom Visual */}
      {!isQada && (
          <div 
            className="absolute w-6 h-6 bg-white dark:bg-gray-200 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)] border border-gray-200 dark:border-gray-500 pointer-events-none z-10 flex items-center justify-center transition-all duration-300"
            style={{ 
                right: `calc(${value}% - 12px)` // Center the thumb
            }}
          >
             <div className={`w-2 h-2 rounded-full ${value === 100 ? 'bg-green-600' : 'bg-green-400'}`}></div>
          </div>
      )}

      {/* Native Input - Invisible Overlay */}
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={isQada ? 0 : value}
        disabled={disabled || isQada}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`absolute inset-0 w-full h-full opacity-0 z-20 ${disabled || isQada ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      />
    </div>
  );
};

export const DeedInput: React.FC<DeedInputProps> = ({ 
  deed, 
  value, 
  onChange, 
  disabled,
  customTitle,
  onCustomTitleChange,
  onDelete
}) => {
  // Handle Golden Deeds
  if (deed.type === 'golden') {
    const isDone = value === 100;
    // Determine bonus points
    const isDoubleBonus = deed.id === 'golden_night_prayer' || deed.id === 'golden_father_hand' || deed.id === 'golden_mother_hand';
    const bonusPoints = isDoubleBonus ? 20 : 10;

    return (
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-colors duration-300 group ${
            isDone 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-yellow-200'
        } ${disabled ? 'opacity-80' : ''}`}>
            
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <div className={`p-2 rounded-full flex-shrink-0 ${isDone ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isDoubleBonus ? (
                        <div className="flex items-center gap-0.5">
                            <Star className={`w-4 h-4 ${isDone ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            <Star className={`w-4 h-4 ${isDone ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        </div>
                    ) : (
                        <Star className={`w-5 h-5 ${isDone ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    )}
                </div>
                
                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${isDone ? 'text-yellow-800 dark:text-yellow-100' : 'text-gray-700 dark:text-gray-200'}`}>
                            {customTitle || deed.title}
                        </span>
                        {deed.isCustom && !disabled && onDelete && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                className="text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors p-1.5 z-20 relative flex-shrink-0"
                                title="حذف این مورد"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 mt-0.5">
                        {toPersianDigits(bonusPoints)}+ امتیاز
                    </span>
                </div>
            </div>

            <button
                onClick={() => !disabled && onChange(isDone ? 0 : 100)}
                disabled={disabled}
                className={`w-14 h-8 rounded-full flex-shrink-0 flex items-center transition-colors duration-300 p-1 justify-end ${
                    isDone ? (disabled ? 'bg-yellow-300 dark:bg-yellow-800' : 'bg-yellow-500') : 'bg-gray-200 dark:bg-gray-600'
                } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDone ? 'translate-x-6' : 'translate-x-0'}`}>
                    {isDone ? <Check className={`w-4 h-4 ${disabled ? 'text-yellow-300' : 'text-yellow-500'}`} /> : <X className="w-4 h-4 text-gray-400" />}
                </div>
            </button>
        </div>
    );
  }

  if (deed.type === 'binary') {
    const isDone = value === 100;
    return (
      <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between transition-colors ${disabled ? 'opacity-80' : 'hover:border-primary-200 dark:hover:border-primary-800'}`}>
        <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-200 font-medium">{deed.title}</span>
            {deed.isCustom && !disabled && onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors p-1.5 z-20 relative flex-shrink-0"
                    title="حذف این مورد"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
        <button
          onClick={() => !disabled && onChange(isDone ? 0 : 100)}
          disabled={disabled}
          className={`w-14 h-8 rounded-full flex-shrink-0 flex items-center transition-colors duration-300 p-1 justify-end ${
            isDone ? (disabled ? 'bg-primary-300 dark:bg-primary-800' : 'bg-primary-500') : 'bg-gray-200 dark:bg-gray-600'
          } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDone ? 'translate-x-6' : 'translate-x-0'}`}>
             {isDone ? <Check className={`w-4 h-4 ${disabled ? 'text-primary-300' : 'text-primary-500'}`} /> : <X className="w-4 h-4 text-gray-400" />}
          </div>
        </button>
      </div>
    );
  }

  if (deed.type === 'prayer') {
    const isQada = value === -100;
    const displayValue = isQada ? 0 : value;

    return (
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col gap-6 transition-colors ${
        isQada 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
          : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'
      } ${disabled ? 'opacity-80' : ''}`}>
        
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className={`font-medium ${isQada ? 'text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-200'}`}>
                {deed.title}
                </span>
                {deed.isCustom && !disabled && onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors p-1.5 z-20 relative flex-shrink-0"
                        title="حذف این مورد"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${isQada ? 'text-red-700 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    قضا شد
                </span>
                <button
                    onClick={() => {
                        if (disabled) return;
                        onChange(isQada ? 0 : -100);
                    }}
                    disabled={disabled}
                    className={`w-14 h-8 rounded-full flex-shrink-0 flex items-center transition-colors duration-300 p-1 justify-end ${
                        isQada ? (disabled ? 'bg-red-300 dark:bg-red-800' : 'bg-red-500') : 'bg-gray-200 dark:bg-gray-600'
                    } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${isQada ? 'translate-x-6' : 'translate-x-0'}`}>
                        {isQada ? <Check className={`w-4 h-4 ${disabled ? 'text-red-300' : 'text-red-500'}`} /> : <X className="w-4 h-4 text-gray-400" />}
                    </div>
                </button>
            </div>
        </div>

        <div className="w-full">
             <div className="flex justify-between items-center mb-2">
                 <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0">placeholder</span>
                 <span dir="ltr" className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                    isQada 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : displayValue >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                        : displayValue >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                  {isQada ? toPersianDigits('-100') : toPersianDigits(displayValue)}
                </span>
             </div>
             
            <CustomSlider 
                value={displayValue} 
                onChange={onChange} 
                disabled={disabled} 
                isQada={isQada}
            />
            
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1 mt-2">
                <span>ضعیف</span>
                <span>متوسط</span>
                <span>عالی</span>
            </div>
        </div>
      </div>
    );
  }

  // Standard Scalar (Non-Prayer)
  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3 transition-colors ${disabled ? 'opacity-80' : 'hover:border-primary-200 dark:hover:border-primary-800'}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="text-gray-700 dark:text-gray-200 font-medium">{deed.title}</span>
            {deed.isCustom && !disabled && onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-red-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors p-1.5 z-20 relative flex-shrink-0"
                    title="حذف این مورد"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
        <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
            value >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
            value >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
        }`}>
          {toPersianDigits(value)}
        </span>
      </div>
      
      <CustomSlider 
        value={value} 
        onChange={onChange} 
        disabled={disabled} 
      />

      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
        <span>ضعیف</span>
        <span>متوسط</span>
        <span>عالی</span>
      </div>
    </div>
  );
};