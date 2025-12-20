
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { HistoryPage } from './pages/HistoryPage';
import { QadaPage } from './pages/QadaPage';
import { ToolsPage } from './pages/ToolsPage';
import { LevelsPage } from './pages/LevelsPage';
import { syncAllFromSupabase } from './services/storage';

type Tab = 'dashboard' | 'calendar' | 'history' | 'qada' | 'tools' | 'levels';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    // Initial Sync
    syncAllFromSupabase().then(() => {
      setIsSyncing(false);
    });

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleDateSelectionFromCalendar = (date: string) => {
    setSelectedDate(date);
    setActiveTab('dashboard'); 
  };

  const handleWorkoutSelectionFromCalendar = (date: string) => {
    setSelectedDate(date);
    // Switch to tools -> workout
    // This requires ToolsPage to accept props to set active tool, or context.
    // For simplicity, we just navigate to dashboard for now as requested by user flow,
    // or we can just open Tools and let user navigate. 
    // Ideally, we'd refactor navigation state. 
    // Let's just point to dashboard for safety as per previous logic, or update ToolsPage later.
    // Actually, in the new structure, Workout is inside Tools. 
    // Let's keep it simple: Calendar clicks go to Dashboard.
    setActiveTab('dashboard');
  };

  if (isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm opacity-70">در حال همگام‌سازی...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isDark={isDark} toggleTheme={toggleTheme}>
      <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
        <Dashboard 
          key={selectedDate} 
          initialDate={selectedDate} 
          onDateChange={setSelectedDate}
        />
      </div>
      
      {activeTab === 'calendar' && (
        <CalendarPage 
            onSelectDate={handleDateSelectionFromCalendar} 
            onSelectWorkout={handleWorkoutSelectionFromCalendar}
        />
      )}
      {activeTab === 'history' && (
        <HistoryPage isDark={isDark} />
      )}
      {activeTab === 'qada' && (
        <QadaPage />
      )}
      {activeTab === 'tools' && (
        <ToolsPage />
      )}
      {activeTab === 'levels' && (
        <LevelsPage />
      )}
    </Layout>
  );
}

export default App;
