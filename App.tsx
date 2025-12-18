
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CalendarPage } from './pages/CalendarPage';
import { HistoryPage } from './pages/HistoryPage';
import { QadaPage } from './pages/QadaPage';
import { ToolsPage } from './pages/ToolsPage';
import { LevelsPage } from './pages/LevelsPage';

type Tab = 'dashboard' | 'calendar' | 'history' | 'qada' | 'tools' | 'levels';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
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
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
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
