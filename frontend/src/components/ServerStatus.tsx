'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';

export default function ServerStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  const checkStatus = async () => {
    try {
      await api.get('/health/');
      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Checa a cada 30s
    return () => clearInterval(interval);
  }, []);

  if (isOnline === null) return <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-500 animate-pulse"></span>;

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md border transition-colors
        bg-white/50 border-slate-200
        dark:bg-black/20 dark:border-white/5">
      
      <span className="text-[10px] font-mono uppercase tracking-wider font-bold
        text-slate-500 
        dark:text-slate-400">
        {isOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
      </span>
      
      <span className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-all duration-500 ${
        isOnline 
          ? 'bg-emerald-500 shadow-emerald-500 animate-pulse' 
          : 'bg-rose-500 shadow-rose-500'
      }`}></span>
    </div>
  );
}