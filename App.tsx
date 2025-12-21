
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
  // Add state to pass tool selection
  const [selectedTool, setSelectedTool] = useState<'workout' | 'none'>('none');
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
    setSelectedTool('workout');
    setActiveTab('tools');
  };

  // Reset selected tool when tab changes
  const handleTabChange = (tab: Tab) => {
      setActiveTab(tab);
      if (tab !== 'tools') {
          setSelectedTool('none');
      }
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
    <Layout activeTab={activeTab} onTabChange={handleTabChange} isDark={isDark} toggleTheme={toggleTheme}>
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
        <ToolsPage
            key={selectedTool === 'workout' ? 'tools-workout' : 'tools-default'}
            initialTool={selectedTool === 'workout' ? 'workout' : undefined}
        />
      )}
      {activeTab === 'levels' && (
        <LevelsPage />
      )}
    </Layout>
  );
}

export default App;
