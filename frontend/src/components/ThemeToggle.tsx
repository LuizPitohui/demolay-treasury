'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl transition-all duration-300 border backdrop-blur-md group
      bg-white/80 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-orange-500 hover:shadow-lg
      dark:bg-slate-800 dark:border-white/10 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-yellow-400"
      title={theme === 'light' ? "Ativar Modo Escuro" : "Ativar Modo Claro"}
    >
      <div className="relative w-5 h-5">
        <Sun className={`absolute inset-0 w-5 h-5 transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0`} />
        <Moon className={`absolute inset-0 w-5 h-5 transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100`} />
      </div>
    </button>
  );
}