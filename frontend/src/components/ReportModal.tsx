'use client';

import { useState } from 'react';
import api from '@/services/api'; 
import { X, FileText, Download, Loader2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ModalProps) {
  const dataAtual = new Date();
  const [mes, setMes] = useState(dataAtual.getMonth() + 1);
  const [ano, setAno] = useState(dataAtual.getFullYear());
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const meses = [
    { v: 1, n: 'Janeiro' }, { v: 2, n: 'Fevereiro' }, { v: 3, n: 'Março' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Maio' }, { v: 6, n: 'Junho' },
    { v: 7, n: 'Julho' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Setembro' },
    { v: 10, n: 'Outubro' }, { v: 11, n: 'Novembro' }, { v: 12, n: 'Dezembro' }
  ];

  const anos = [2025, 2026, 2027];

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/relatorio/pdf/?mes=${mes}&ano=${ano}`, {
        responseType: 'blob',
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Balancete_${mes.toString().padStart(2, '0')}-${ano}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao baixar o relatório. Verifique sua conexão ou login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 rounded-2xl border
        bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b 
            bg-slate-50 border-slate-200 dark:bg-white/5 dark:border-white/5 rounded-t-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <FileText className="w-5 h-5 text-blue-500" /> Relatório Mensal
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-4">
          <p className="text-sm mb-4 text-slate-600 dark:text-slate-400">
            Selecione o período para gerar o balancete oficial com saldo anterior e histórico.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Seletor de Mês */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase text-slate-500 dark:text-slate-400">Mês</label>
              <select 
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-3 outline-none border transition-colors
                bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500
                dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500"
              >
                {meses.map((m) => (
                  <option key={m.v} value={m.v}>{m.n}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Ano */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase text-slate-500 dark:text-slate-400">Ano</label>
              <select 
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-full rounded-xl px-3 py-3 outline-none border transition-colors
                bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500
                dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando PDF...
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" /> Baixar PDF
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}