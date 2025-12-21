import React from 'react';
import { WorkoutDefinition } from '../types';
import { X, Check } from 'lucide-react';

interface WorkoutSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    workouts: WorkoutDefinition[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export const WorkoutSelectorModal: React.FC<WorkoutSelectorModalProps> = ({
    isOpen,
    onClose,
    workouts,
    selectedId,
    onSelect
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header is hidden based on screenshot, but typically good to have.
                    However, the screenshot shows just a list.
                    I'll add a subtle close button or just rely on clicking outside/selecting.
                    For better UX, I'll just render the list as shown in the screenshot.
                */}

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {workouts.map((workout) => (
                        <button
                            key={workout.id}
                            onClick={() => {
                                onSelect(workout.id);
                                onClose();
                            }}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedId === workout.id
                                    ? 'border-indigo-600 dark:border-indigo-400'
                                    : 'border-gray-300 dark:border-gray-500'
                                }`}>
                                    {selectedId === workout.id && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                    )}
                                </div>
                                <span className={`text-sm ${
                                    selectedId === workout.id
                                    ? 'font-bold text-gray-800 dark:text-gray-100'
                                    : 'text-gray-600 dark:text-gray-300'
                                }`}>
                                    {workout.title} ({workout.unit})
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Optional cancel button at bottom if needed, but clicking outside works */}
            </div>
        </div>
    );
};
