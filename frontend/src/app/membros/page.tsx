'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { Search, DollarSign, ArrowLeft, AlertCircle, CheckCircle, Copy, Printer, History, FileText } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle'; // Import do botão de tema

// --- MODAL DE PAGAMENTO & RECIBO ---
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  membros: any[];
  onSuccess: () => void;
  initialId: number | null;
  chavePix: string;
}

function PaymentModal({ isOpen, onClose, membros, onSuccess, initialId, chavePix }: PaymentModalProps) {
  const [selectedMembroId, setSelectedMembroId] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDENTES' | 'HISTORICO'>('PENDENTES');
  
  const [pendencias, setPendencias] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialId) {
      setSelectedMembroId(String(initialId));
      setActiveTab('PENDENTES');
    } else if (isOpen && !initialId) {
      setSelectedMembroId('');
      setPendencias([]);
      setHistorico([]);
    }
  }, [isOpen, initialId]);

  // Carrega dados quando seleciona membro
  useEffect(() => {
    if (selectedMembroId) {
      const m = membros.find((x: any) => x.id === Number(selectedMembroId));
      if (m) {
        setPendencias(m.mensalidades_abertas);
        setHistorico(m.historico_pagamentos || []); // Carrega histórico
      }
    } else {
      setPendencias([]);
      setHistorico([]);
    }
  }, [selectedMembroId, membros]);

  const handlePay = async (mensalidadeId: number) => {
    if (!confirm("Confirmar recebimento?")) return;
    setLoading(true);
    try {
      await api.post(`/membros/${selectedMembroId}/pagar_mensalidade/`, {
        mensalidade_id: mensalidadeId
      });
      alert("Pagamento registrado!");
      onSuccess(); // Recarrega os dados (o item vai sair de pendente e ir para histórico)
    } catch (error) {
      alert("Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async (mensalidadeId: number) => {
    try {
      const response = await api.get(`/recibo/${mensalidadeId}/`, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Recibo_${mensalidadeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Erro ao gerar recibo.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in duration-200 rounded-2xl
        bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <DollarSign className="text-emerald-500" /> Caixa & Recibos
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
        </div>

        {/* Chave PIX */}
        {chavePix && (
            <div className="mb-6 p-3 rounded-xl flex justify-between items-center border
                bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-500/30">
                <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Chave PIX do Capítulo</p>
                    <p className="text-sm font-mono select-all text-slate-700 dark:text-white">{chavePix}</p>
                </div>
                <button 
                    onClick={() => navigator.clipboard.writeText(chavePix)}
                    className="p-2 rounded-lg transition-colors
                    hover:bg-indigo-100 text-indigo-500
                    dark:hover:bg-white/10 dark:text-indigo-300"
                    title="Copiar"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* Seleção de Membro */}
        <div className="mb-6">
          <label className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400">DeMolay</label>
          <select
            className="w-full rounded-lg p-3 mt-1 outline-none border transition-colors
            bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500
            dark:bg-slate-800 dark:border-slate-700 dark:text-white"
            onChange={(e) => setSelectedMembroId(e.target.value)}
            value={selectedMembroId}
          >
            <option value="">-- Selecione ou Busque --</option>
            {membros.map((m: any) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>

        {selectedMembroId ? (
          <>
            {/* ABAS DE NAVEGAÇÃO */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                <button 
                    onClick={() => setActiveTab('PENDENTES')}
                    className={`flex-1 pb-2 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'PENDENTES' 
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    <AlertCircle className="w-4 h-4" /> A PAGAR ({pendencias.length})
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORICO')}
                    className={`flex-1 pb-2 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                        activeTab === 'HISTORICO' 
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                    <History className="w-4 h-4" /> HISTÓRICO
                </button>
            </div>

            {/* CONTEÚDO DAS LISTAS */}
            <div className="space-y-3 max-h-[300px] overflow-auto custom-scrollbar">
                
                {/* LISTA DE PENDÊNCIAS */}
                {activeTab === 'PENDENTES' && (
                    pendencias.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-xl border
                            bg-emerald-50 border-emerald-200 text-emerald-600
                            dark:bg-emerald-500/5 dark:border-emerald-500/20 dark:text-emerald-500">
                            <CheckCircle className="w-8 h-8" />
                            <p className="font-bold">Tudo pago!</p>
                        </div>
                    ) : (
                        pendencias.map((mens: any) => (
                            <div key={mens.id} className="flex justify-between items-center p-4 rounded-xl border transition-colors
                                bg-slate-50 border-slate-200 hover:border-rose-300
                                dark:bg-slate-800 dark:border-slate-700 dark:hover:border-rose-500/30">
                                <div>
                                    <p className="font-bold text-sm capitalize text-slate-700 dark:text-white">
                                        {new Date(mens.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </p>
                                    <span className="text-xs font-bold text-rose-500 dark:text-rose-400">Venceu: {new Date(mens.data_vencimento).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-mono font-bold text-slate-800 dark:text-white">R$ {mens.valor}</span>
                                    <button
                                        onClick={() => handlePay(mens.id)}
                                        disabled={loading}
                                        className="px-3 py-1 rounded text-xs font-bold text-white transition-all flex items-center gap-1
                                        bg-emerald-600 hover:bg-emerald-500"
                                    >
                                        <DollarSign className="w-3 h-3" /> RECEBER
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                )}

                {/* LISTA DE HISTÓRICO (RECIBOS) */}
                {activeTab === 'HISTORICO' && (
                    historico.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">Nenhum pagamento recente encontrado.</div>
                    ) : (
                        historico.map((mens: any) => (
                            <div key={mens.id} className="flex justify-between items-center p-4 rounded-xl border transition-colors
                                bg-slate-50 border-slate-200 hover:border-blue-300
                                dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-blue-500/30">
                                <div>
                                    <p className="font-bold text-sm capitalize text-slate-600 dark:text-slate-300">
                                        {new Date(mens.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </p>
                                    <span className="text-[10px] px-2 py-0.5 rounded border font-bold
                                        bg-emerald-100 text-emerald-600 border-emerald-200
                                        dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                                        PAGO
                                    </span>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-mono text-sm text-slate-500 dark:text-slate-400">R$ {mens.valor}</span>
                                    <button
                                        onClick={() => handlePrintReceipt(mens.id)}
                                        className="px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 border
                                        bg-white border-slate-300 text-blue-600 hover:bg-blue-50
                                        dark:bg-slate-700 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-600"
                                    >
                                        <Printer className="w-3 h-3" /> IMPRIMIR RECIBO
                                    </button>
                                </div>
                            </div>
                        ))
                    )
                )}

            </div>
          </>
        ) : (
            <div className="text-center py-10 text-slate-500 dark:text-slate-600">
                Selecione um membro para gerenciar.
            </div>
        )}
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function MembrosPage() {
  const [membros, setMembros] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState('');
  const [busca, setBusca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedId, setPreSelectedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/membros/');
      setMembros(res.data);
      const resConfig = await api.get('/configuracao/');
      setPixKey(resConfig.data.chave_pix);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPaymentModal = (id: number | null = null) => {
    setPreSelectedId(id);
    setIsModalOpen(true);
  };

  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    String(m.dm_id).includes(busca)
  );

  return (
    <main className="min-h-screen p-6 pb-20 font-sans transition-colors duration-300
      bg-slate-50 text-slate-900
      dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-[#1a103c] dark:to-black dark:text-white">
      
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/" className="p-3 rounded-xl transition-colors border shadow-sm
            bg-white border-slate-200 text-slate-500 hover:bg-slate-100
            dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400">
              Membros
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gestão de Mensalidades</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <ThemeToggle /> {/* Botão de Tema aqui */}
            
            <button
                onClick={() => openPaymentModal(null)}
                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
                <DollarSign className="w-5 h-5" /> RECEBIMENTO AVULSO
            </button>
        </div>
      </header>

      {/* BARRA DE BUSCA */}
      <div className="relative mb-8 shadow-sm group">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          type="text"
          placeholder="Buscar DeMolay..."
          className="w-full rounded-2xl p-3 pl-12 outline-none transition-all border
          bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
          dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-indigo-500"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* GRADE DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {membrosFiltrados.map((membro) => (
          <div key={membro.id} className="p-5 rounded-2xl transition-all group flex flex-col justify-between h-full shadow-md hover:shadow-xl border
            bg-white border-slate-100 hover:border-indigo-200
            dark:bg-[#0f0f11] dark:border-white/5 dark:hover:border-indigo-500/30">
            
            <div>
                <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg transition-colors line-clamp-1
                        text-slate-700 group-hover:text-indigo-600
                        dark:text-slate-200 dark:group-hover:text-indigo-400" title={membro.nome}>
                        {membro.nome}
                    </h3>
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-600">ID: {membro.dm_id}</span>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    membro.status === 'REGULAR'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                }`}>
                    {membro.status}
                </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    {membro.mensalidades_abertas.length > 0 ? (
                        <>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-500">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-rose-500 dark:text-rose-400">{membro.mensalidades_abertas.length} Pendências</span>
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-500">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500">Em dia</span>
                        </>
                    )}
                </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end">
                <button
                    onClick={() => openPaymentModal(membro.id)}
                    className="text-xs font-bold px-3 py-2 rounded-lg transition-all flex items-center gap-1
                    text-indigo-600 hover:bg-indigo-50
                    dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/10"
                >
                    VER DETALHES & PAGAR →
                </button>
            </div>
          </div>
        ))}
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        membros={membros}
        onSuccess={fetchData}
        initialId={preSelectedId} 
        chavePix={pixKey}
      />
    </main>
  );
}