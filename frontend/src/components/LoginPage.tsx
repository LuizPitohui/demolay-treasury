'use client';

import { useState } from 'react';
import Image from 'next/image'; // <--- Import Otimizado
import api from '@/services/api';
import { Lock, User, Loader2, ShieldCheck, Shield } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false); // <--- Novo estado para controlar erro de imagem

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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black p-4">
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 relative overflow-hidden animate-in fade-in zoom-in duration-500">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>

        <div className="flex flex-col items-center mb-8">
            {/* ÁREA DA LOGO INTELIGENTE */}
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 ring-4 ring-white/5 shadow-[0_0_30px_rgba(147,51,234,0.3)] overflow-hidden relative">
                
                {!imageError ? (
                  /* Tenta carregar a imagem */
                  <img 
                    src="/logo_capitulo.png" 
                    alt="Logo Capítulo 29" 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)} // Se falhar, ativa o modo escudo
                  />
                ) : (
                  /* Se falhar, mostra o Escudo DeMolay genérico */
                  <Shield className="w-12 h-12 text-slate-400" />
                )}

            </div>
            
            <h1 className="text-2xl font-bold text-white tracking-tight text-center">Capítulo Unidos da Esperança nº 29</h1>
            <p className="text-slate-400 text-sm mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Área Restrita • Tesouraria
            </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium animate-pulse">
                    {error}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Usuário / ID</label>
                <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Identificação"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha de Acesso</label>
                <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
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

        <p className="text-center text-xs text-slate-600 mt-6">
            Sistema Nexus v1.0 • Servidor Arasaka
        </p>

      </div>
    </div>
  );
}