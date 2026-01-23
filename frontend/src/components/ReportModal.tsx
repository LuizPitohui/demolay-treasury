'use client';

import { useState } from 'react';
import api from '@/services/api'; // Para pegar a URL base
import { X, FileText, Calendar, Download } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ModalProps) {
  const dataAtual = new Date();
  const [mes, setMes] = useState(dataAtual.getMonth() + 1); // JS começa mês em 0
  const [ano, setAno] = useState(dataAtual.getFullYear());

  if (!isOpen) return null;

  const meses = [
    { v: 1, n: 'Janeiro' }, { v: 2, n: 'Fevereiro' }, { v: 3, n: 'Março' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Maio' }, { v: 6, n: 'Junho' },
    { v: 7, n: 'Julho' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Setembro' },
    { v: 10, n: 'Outubro' }, { v: 11, n: 'Novembro' }, { v: 12, n: 'Dezembro' }
  ];

  const anos = [2025, 2026, 2027]; // Adicione mais se precisar

  const handleDownload = () => {
    // Monta a URL manualmente para abrir em nova aba
    // A baseURL do axios geralmente é http://127.0.0.1:8000/api
    const baseURL = api.defaults.baseURL || 'http://127.0.0.1:8000/api';
    const url = `${baseURL}/relatorio/pdf/?mes=${mes}&ano=${ano}`;
    
    window.open(url, '_blank'); // Abre o PDF numa nova aba
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" /> Relatório Mensal
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-4">
          <p className="text-slate-400 text-sm mb-4">
            Selecione o período para gerar o balancete oficial com saldo anterior e histórico.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Seletor de Mês */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Mês</label>
              <select 
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500/50 [&>option]:bg-slate-800"
              >
                {meses.map((m) => (
                  <option key={m.v} value={m.v}>{m.n}</option>
                ))}
              </select>
            </div>

            {/* Seletor de Ano */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Ano</label>
              <select 
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-blue-500/50 [&>option]:bg-slate-800"
              >
                {anos.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleDownload}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
}