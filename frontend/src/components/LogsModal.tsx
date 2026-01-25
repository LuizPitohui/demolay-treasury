'use client';
import { useEffect, useState } from 'react';
import api from '@/services/api';
import { X, Terminal, Download, RefreshCw, Loader2 } from 'lucide-react';

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
  const [downloading, setDownloading] = useState(false); // NOVO: Estado para download
  
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

  // CORREÇÃO: Download via Blob com Token
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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl h-[80vh] bg-[#0a0a0a] border border-emerald-500/30 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col animate-in fade-in zoom-in duration-300 font-mono">
        
        {/* Header Terminal */}
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-emerald-500/20 bg-emerald-900/10 gap-4">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-emerald-500" />
            <h2 className="text-emerald-500 font-bold tracking-widest">ROOT_ACCESS // AUDIT_LOGS</h2>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Seletores */}
            <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-black border border-emerald-500/30 text-emerald-500 text-xs rounded p-1 focus:outline-none">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>Mês {m}</option>)}
            </select>
            <select value={ano} onChange={e => setAno(Number(e.target.value))} className="bg-black border border-emerald-500/30 text-emerald-500 text-xs rounded p-1 focus:outline-none">
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
            </select>

            <button 
                onClick={handleDownload} 
                disabled={downloading}
                className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-xs transition-all disabled:opacity-50"
            >
                {downloading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                    <Download className="w-3 h-3" />
                )}
                EXPORT PDF
            </button>
            <button onClick={onClose} className="text-emerald-700 hover:text-emerald-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo Terminal (Tabela) */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full text-emerald-600 gap-2">
                <RefreshCw className="animate-spin w-8 h-8" />
                <span className="text-xs animate-pulse">DECRYPTING DATA STREAMS...</span>
             </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0a0a0a] z-10">
                <tr className="text-emerald-700 border-b border-emerald-900/50 uppercase">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">User_ID</th>
                  <th className="pb-2">Event_Action</th>
                  <th className="pb-2 text-right">Origin_IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/20 text-emerald-400/80">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="py-2 font-mono opacity-70">
                        {log.data_criacao}
                    </td>
                    <td className="py-2 font-bold text-emerald-300">{log.usuario_nome}</td>
                    <td className="py-2">{log.acao}</td>
                    <td className="py-2 text-right font-mono opacity-60">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-emerald-500/20 bg-emerald-900/10 text-[10px] text-emerald-800 flex justify-between items-center">
            <span>SECURE CONNECTION ESTABLISHED</span>
            <span>TOTAL RECORDS: {logs.length}</span>
        </div>
      </div>
    </div>
  );
}