'use client';

import { useState } from 'react';
import api from '@/services/api';
import { Lock, User, Loader2, ShieldCheck, Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle'; // Opcional: Adicionar botão de tema no login

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login/', { username, password });
      const { token } = response.data;
      onLoginSuccess(token);
    } catch (err) {
      setError('Acesso Negado. Verifique suas credenciais.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500
        bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] 
        from-slate-100 via-slate-200 to-slate-300
        dark:from-slate-900 dark:via-[#0f172a] dark:to-black">
      
      {/* Botão de Tema Flutuante no Canto */}
      <div className="absolute top-6 right-6">
          <ThemeToggle />
      </div>

      <div className="w-full max-w-md backdrop-blur-xl border rounded-3xl shadow-2xl p-8 relative overflow-hidden animate-in fade-in zoom-in duration-500
        bg-white/70 border-white/60
        dark:bg-white/5 dark:border-white/10">
        
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

        <div className="flex flex-col items-center mb-8">
            {/* ÁREA DA LOGO */}
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 ring-4 overflow-hidden relative shadow-[0_0_30px_rgba(147,51,234,0.3)]
                bg-white ring-slate-100
                dark:bg-white/10 dark:ring-white/5">
                
                {!imageError ? (
                  <img 
                    src="/logo_capitulo.png" 
                    alt="Logo Capítulo 29" 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)} 
                  />
                ) : (
                  <Shield className="w-12 h-12 text-slate-400" />
                )}

            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-center text-slate-800 dark:text-white">Capítulo Unidos da Esperança nº 29</h1>
            <p className="text-sm mt-2 flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Área Restrita • Tesouraria
            </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
                <div className="p-3 rounded-xl text-sm text-center font-medium animate-pulse border
                    bg-red-100 border-red-200 text-red-600
                    dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                    {error}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase ml-1 text-slate-500 dark:text-slate-400">Usuário / ID</label>
                <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full rounded-xl py-3 pl-12 pr-4 outline-none border transition-colors
                        bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10
                        dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder-slate-600 dark:focus:border-purple-500"
                        placeholder="Identificação"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase ml-1 text-slate-500 dark:text-slate-400">Senha de Acesso</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full rounded-xl py-3 pl-12 pr-4 outline-none border transition-colors
                        bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10
                        dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder-slate-600 dark:focus:border-purple-500"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-95 mt-4 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" /> : "ACESSAR SISTEMA"}
            </button>
        </form>

        <p className="text-center text-xs mt-6 text-slate-400 dark:text-slate-600">
            Sistema Nexus v1.0 • Servidor Arasaka
        </p>

      </div>
    </div>
  );
}