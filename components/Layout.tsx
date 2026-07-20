
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Calendar, History, Moon, Sun, Dumbbell, Grid2X2, Map, Settings, LogIn } from 'lucide-react';
import { loadUserLevel } from '../services/storage';
import { toPersianDigits } from '../constants';
import { SettingsModal } from '../pages/SettingsPage';
import { AuthModal } from '../pages/AuthPage';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'calendar' | 'history' | 'tools' | 'levels';
  onTabChange: (tab: any) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isDark, toggleTheme }) => {
  const [currentAmoud, setCurrentAmoud] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Poll level in case it changes
  useEffect(() => {
      const l = loadUserLevel();
      setCurrentAmoud(l.currentAmoud);
      
      const interval = setInterval(() => {
          const updated = loadUserLevel();
          if (updated.currentAmoud !== currentAmoud) {
              setCurrentAmoud(updated.currentAmoud);
          }
      }, 2000);
      return () => clearInterval(interval);
  }, [currentAmoud]);
  
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button 
                  onClick={toggleTheme}
                  className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded-lg transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/50"
                >
                    {isDark ? (
                       <Sun className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                    ) : (
                       <Moon className="w-5 h-5 text-primary-600" />
                    )}
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">محاسبه نفس</h1>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">یا صاحب الزمان (عج)</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {/* Settings Icon */}
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                {/* Login/Signup Icon */}
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="bg-gradient-to-r from-primary-600 to-primary-500 p-2 rounded-lg transition-colors hover:from-primary-700 hover:to-primary-600 shadow-md shadow-primary-500/30"
                >
                    <LogIn className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>
      </header>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />
      
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-[100] transform-gpu transition-colors duration-300"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto flex justify-between items-center pb-2 overflow-x-auto gap-1">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3.5rem] flex-1 ${
              activeTab === 'dashboard' 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-medium whitespace-nowrap">امروز</span>
          </button>

          <button
            onClick={() => onTabChange('calendar')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3.5rem] flex-1 ${
              activeTab === 'calendar' 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[9px] font-medium whitespace-nowrap">تقویم</span>
          </button>


          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3.5rem] flex-1 ${
              activeTab === 'history' 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[9px] font-medium whitespace-nowrap">تحلیل</span>
          </button>

          <button
            onClick={() => onTabChange('tools')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3.5rem] flex-1 ${
              activeTab === 'tools' 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Grid2X2 className="w-5 h-5" />
            <span className="text-[9px] font-medium whitespace-nowrap">سایر امکانات</span>
          </button>
          
           <button
            onClick={() => onTabChange('levels')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[3.5rem] flex-1 ${
              activeTab === 'levels' 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[9px] font-medium whitespace-nowrap">مسیر</span>
          </button>

        </div>
      </nav>
    </div>
  );
};
