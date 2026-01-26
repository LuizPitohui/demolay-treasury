'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { X, Terminal, Download, RefreshCw, Loader2, ShieldCheck } from 'lucide-react';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogItem {
  id: number;
  usuario_nome: string;
  acao: string;
  data_criacao: string;
  ip_address: string;
}

export default function LogsModal({ isOpen, onClose }: LogsModalProps) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  
  // Estados para filtro de data
  const dataHoje = new Date();
  const [mes, setMes] = useState(dataHoje.getMonth() + 1);
  const [ano, setAno] = useState(dataHoje.getFullYear());

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs/');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/logs/pdf/?mes=${mes}&ano=${ano}`, {
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Auditoria_${mes}-${ano}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error(error);
      alert('Erro ao exportar logs.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col animate-in fade-in zoom-in duration-300 font-mono shadow-2xl rounded-xl border
        bg-white border-slate-200
        dark:bg-[#0a0a0a] dark:border-emerald-500/30 dark:shadow-[0_0_50px_rgba(16,185,129,0.1)]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4 border-b transition-colors
            bg-slate-50 border-slate-200
            dark:bg-emerald-900/10 dark:border-emerald-500/20">
          
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-200 dark:bg-emerald-500/10">
                <Terminal className="w-5 h-5 text-slate-600 dark:text-emerald-500" />
            </div>
            <h2 className="font-bold tracking-widest text-sm md:text-base
                text-slate-700
                dark:text-emerald-500">
                AUDIT_LOGS // SYSTEM_ACCESS
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Seletores */}
            <select 
                value={mes} 
                onChange={e => setMes(Number(e.target.value))} 
                className="text-xs rounded p-1.5 focus:outline-none border transition-colors
                bg-white border-slate-300 text-slate-700
                dark:bg-black dark:border-emerald-500/30 dark:text-emerald-500"
            >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mês {m}</option>)}
            </select>
            <select 
                value={ano} 
                onChange={e => setAno(Number(e.target.value))} 
                className="text-xs rounded p-1.5 focus:outline-none border transition-colors
                bg-white border-slate-300 text-slate-700
                dark:bg-black dark:border-emerald-500/30 dark:text-emerald-500"
            >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
            </select>

            <button 
                onClick={handleDownload} 
                disabled={downloading}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-all disabled:opacity-50 border
                bg-white border-slate-300 text-slate-600 hover:bg-slate-100
                dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
            >
                {downloading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <Download className="w-3 h-3" />
                )}
                EXPORT PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo (Tabela) */}
        <div className="flex-1 overflow-auto p-0 custom-scrollbar bg-white dark:bg-[#0a0a0a]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full gap-2
                text-slate-400 dark:text-emerald-600">
                <RefreshCw className="animate-spin w-8 h-8" />
                <span className="text-xs animate-pulse tracking-wider">LOADING DATA STREAMS...</span>
             </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10
                bg-slate-50 text-slate-500 border-b border-slate-200
                dark:bg-[#0a0a0a] dark:text-emerald-700 dark:border-emerald-900/50">
                <tr className="uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">User_ID</th>
                  <th className="py-3 px-4 font-semibold">Event_Action</th>
                  <th className="py-3 px-4 font-semibold text-right">Origin_IP</th>
                </tr>
              </thead>
              <tbody className="divide-y 
                divide-slate-100 text-slate-600
                dark:divide-emerald-900/20 dark:text-emerald-400/80">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors
                    hover:bg-slate-50
                    dark:hover:bg-emerald-500/5">
                    <td className="py-2.5 px-4 font-mono opacity-80">
                        {log.data_criacao}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-emerald-300">
                        {log.usuario_nome}
                    </td>
                    <td className="py-2.5 px-4">
                        {log.acao}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono opacity-60">
                        {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t flex justify-between items-center text-[10px] uppercase
            bg-slate-50 border-slate-200 text-slate-400
            dark:bg-emerald-900/10 dark:border-emerald-500/20 dark:text-emerald-800">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> SECURE CONNECTION ESTABLISHED</span>
            <span>TOTAL RECORDS: {logs.length}</span>
        </div>
      </div>
    </div>
  );
}