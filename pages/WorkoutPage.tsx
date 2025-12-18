
import React, { useEffect, useState, useMemo } from 'react';
import { WORKOUTS, getTodayStr, toPersianDigits, toEnglishDigits } from '../constants';
import { getRecord, saveRecord, loadWorkoutPRs, saveWorkoutPRs, loadWorkoutSettings, saveCustomWorkout, removeCustomWorkout } from '../services/storage';
import { DailyRecord, WorkoutDefinition } from '../types';
import { Dumbbell, Trophy, Plus, Trash2, X, ChevronLeft, ChevronRight, Save, Check } from 'lucide-react';

interface WorkoutPageProps {
    initialDate?: string;
    onDateChange?: (date: string) => void;
}

export const WorkoutPage: React.FC<WorkoutPageProps> = ({ initialDate, onDateChange }) => {
    const [date, setDate] = useState(initialDate || getTodayStr());
    
    // Form State (Local)
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Data State
    const [prs, setPrs] = useState<Record<string, number>>({});
    const [newPrIds, setNewPrIds] = useState<string[]>([]);
    
    // Custom Workouts State
    const [customWorkouts, setCustomWorkouts] = useState<WorkoutDefinition[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUnit, setNewUnit] = useState('تعداد');

    // Combine default and custom workouts
    const allWorkouts = useMemo(() => [...WORKOUTS, ...customWorkouts], [customWorkouts]);

    // 1. Load Data on Date Change
    useEffect(() => {
        // Load Settings & PRs
        const settings = loadWorkoutSettings();
        setCustomWorkouts(settings.customWorkouts);
        const loadedPrs = loadWorkoutPRs();
        setPrs(loadedPrs);

        // Load Record for Selected Date
        const record = getRecord(date);
        if (record && record.workouts) {
            // Convert numbers to strings for input fields
            const stringValues: Record<string, string> = {};
            Object.entries(record.workouts).forEach(([k, v]) => {
                const val = v as number;
                stringValues[k] = val > 0 ? val.toString() : '';
            });
            setFormValues(stringValues);
        } else {
            setFormValues({});
        }
        
        setHasChanges(false);
        setNewPrIds([]);
        if (onDateChange) onDateChange(date);

    }, [date, onDateChange]);

    // 2. Handle Input Change (Local State Only)
    const handleInputChange = (workoutId: string, valStr: string) => {
        // Parse input: convert Persian/Arabic to English, then filter non-digits
        const englishVal = toEnglishDigits(valStr);
        const numericVal = englishVal.replace(/[^0-9]/g, '');

        setFormValues(prev => ({
            ...prev,
            [workoutId]: numericVal
        }));
        setHasChanges(true);
    };

    // 3. Handle Save (Commit to Storage)
    const handleSave = () => {
        setIsSaving(true);
        
        // Prepare data for storage
        const numericWorkouts: Record<string, number> = {};
        const potentialNewPrs: string[] = [];
        const updatedPrs = { ...prs };
        let prsChanged = false;

        Object.entries(formValues).forEach(([id, valStr]) => {
            const val = parseInt(valStr as string) || 0;
            if (val > 0) {
                numericWorkouts[id] = val;
                
                // Check PR
                const currentPr = updatedPrs[id] || 0;
                if (val > currentPr) {
                    updatedPrs[id] = val;
                    potentialNewPrs.push(id);
                    prsChanged = true;
                }
            }
        });

        // Save Daily Record
        const record = getRecord(date) || createEmptyRecord(date);
        record.workouts = numericWorkouts;
        record.updatedAt = Date.now(); // Ensure refresh
        saveRecord(record);

        // Save PRs if changed
        if (prsChanged) {
            saveWorkoutPRs(updatedPrs);
            setPrs(updatedPrs);
        }

        setNewPrIds(potentialNewPrs);
        
        setTimeout(() => {
            setIsSaving(false);
            setHasChanges(false);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 2000);
        }, 600);
    };

    const handleAddWorkout = () => {
        if (!newTitle.trim()) return;
        
        const id = `custom_workout_${Date.now()}`;
        const newWorkout: WorkoutDefinition = {
            id,
            title: newTitle,
            unit: newUnit,
            isCustom: true
        };
        
        const updatedList = saveCustomWorkout(newWorkout);
        setCustomWorkouts(updatedList);
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewUnit('تعداد');
    };

    const handleDeleteWorkout = (id: string) => {
        if(window.confirm('آیا از حذف این تمرین اطمینان دارید؟')) {
            const updatedList = removeCustomWorkout(id);
            setCustomWorkouts(updatedList);
            
            // Clean up form value if exists
            if (formValues[id]) {
                const newValues = { ...formValues };
                delete newValues[id];
                setFormValues(newValues);
                setHasChanges(true);
            }
        }
    };

    const createEmptyRecord = (dateStr: string): DailyRecord => ({
        date: dateStr,
        scores: {},
        sins: [],
        customTitles: {},
        report: '',
        totalAverage: 0,
        workouts: {},
        updatedAt: Date.now()
    });

    const changeDate = (days: number) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const newDateStr = `${year}-${month}-${day}`;
        
        const today = getTodayStr();
        if (days > 0 && newDateStr > today) return;
        
        setDate(newDateStr);
    };

    const persianDate = new Date(date).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const today = getTodayStr();

    return (
        <div className="space-y-6 animate-fade-in pb-20 relative">
            
            {/* Header / Date Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                 <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><ChevronRight className="w-5 h-5" /></button>
                 <div className="text-center">
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        {date === today ? 'تمرینات امروز' : 'آرشیو تمرینات'}
                    </h2>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{persianDate}</div>
                 </div>
                 <button 
                    onClick={() => changeDate(1)} 
                    className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition ${date === today ? 'opacity-30 cursor-not-allowed' : ''}`}
                    disabled={date === today}
                >
                    <ChevronLeft className="w-5 h-5" />
                 </button>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                                افزودن تمرین جدید
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">نام تمرین</label>
                                <input 
                                    type="text" 
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="مثال: طناب زدن"
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">واحد اندازه‌گیری</label>
                                <select
                                    value={newUnit}
                                    onChange={(e) => setNewUnit(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
                                >
                                    <option value="تعداد">تعداد</option>
                                    <option value="ثانیه">ثانیه</option>
                                    <option value="دقیقه">دقیقه</option>
                                    <option value="متر">متر</option>
                                    <option value="کیلومتر">کیلومتر</option>
                                    <option value="ست">ست</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsAddModalOpen(false)}
                                className="flex-1 py-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                انصراف
                            </button>
                            <button 
                                onClick={handleAddWorkout}
                                disabled={!newTitle.trim()}
                                className="flex-1 py-2 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                افزودن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* List Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                    <Dumbbell className="w-5 h-5" />
                    <h3 className="font-bold">ثبت فعالیت‌ها</h3>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1 text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 px-3 py-1.5 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition"
                >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تمرین جدید</span>
                </button>
            </div>

            {/* Workout List */}
            <div className="space-y-3">
                {allWorkouts.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-40 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700 text-gray-400">
                        <Dumbbell className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-sm">تمرینی تعریف نشده است</span>
                     </div>
                ) : (
                    allWorkouts.map(workout => {
                        const pr = prs[workout.id] || 0;
                        const isNewPr = newPrIds.includes(workout.id);
                        // Convert display value to Persian digits
                        const displayValue = toPersianDigits(formValues[workout.id] || '');

                        return (
                            <div key={workout.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-700 dark:text-gray-200">{workout.title}</span>
                                        {workout.isCustom && (
                                            <button 
                                                onClick={() => handleDeleteWorkout(workout.id)}
                                                className="text-gray-300 hover:text-red-400 transition"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                        <Trophy className="w-3 h-3 text-yellow-500" />
                                        <span>رکورد: {toPersianDigits(pr)} {workout.unit}</span>
                                        {isNewPr && (
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                                رکورد جدید!
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={displayValue}
                                        onChange={(e) => handleInputChange(workout.id, e.target.value)}
                                        placeholder="۰"
                                        className="w-20 text-center font-bold text-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-1 focus:ring-2 focus:ring-cyan-500 outline-none text-gray-800 dark:text-gray-100 placeholder-gray-300"
                                    />
                                    <span className="text-xs text-gray-400 w-8 text-center">{workout.unit}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            {/* Save Button */}
            <div className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 transition-all duration-300 z-20 ${hasChanges ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                 <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-lg shadow-cyan-500/30 transition-all active:scale-95 ${
                        showSaveSuccess ? 'bg-green-600' : 'bg-cyan-600 hover:bg-cyan-700'
                    }`}
                >
                    {isSaving ? (
                        <span>در حال ذخیره...</span>
                    ) : showSaveSuccess ? (
                        <>
                           <Check className="w-5 h-5" />
                           <span>ذخیره شد</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            <span>ثبت تغییرات</span>
                        </>
                    )}
                </button>
            </div>

        </div>
    );
};
