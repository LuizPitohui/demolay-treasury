'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { Search, DollarSign, ArrowLeft, AlertCircle, CheckCircle, Copy } from 'lucide-react';

// --- MODAL DE PAGAMENTO ---
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  membros: any[];
  onSuccess: () => void;
  initialId: number | null;
  chavePix: string; // <--- NOVO: Recebe a chave PIX
}

function PaymentModal({ isOpen, onClose, membros, onSuccess, initialId, chavePix }: PaymentModalProps) {
  const [selectedMembroId, setSelectedMembroId] = useState('');
  const [mensalidades, setMensalidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialId) {
      setSelectedMembroId(String(initialId));
    } else if (isOpen && !initialId) {
      setSelectedMembroId('');
      setMensalidades([]);
    }
  }, [isOpen, initialId]);

  useEffect(() => {
    if (selectedMembroId) {
      const m = membros.find((x: any) => x.id === Number(selectedMembroId));
      if (m) setMensalidades(m.mensalidades_abertas);
    } else {
      setMensalidades([]);
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
      onSuccess();
      onClose();
    } catch (error) {
      alert("Erro ao registrar pagamento");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500" /> Receber Mensalidade
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* --- EXIBIÇÃO DA CHAVE PIX (NOVO) --- */}
        {chavePix && (
            <div className="mb-6 bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-xl flex justify-between items-center">
                <div>
                    <p className="text-[10px] uppercase font-bold text-indigo-400">Chave PIX do Capítulo</p>
                    <p className="text-sm font-mono text-white select-all">{chavePix}</p>
                </div>
                <button 
                    onClick={() => navigator.clipboard.writeText(chavePix)}
                    className="p-2 hover:bg-white/10 rounded-lg text-indigo-300 transition-colors"
                    title="Copiar"
                >
                    <Copy className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* Busca de Membro */}
        <div className="mb-6">
          <label className="text-xs text-slate-400 uppercase font-bold">DeMolay</label>
          <select
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white mt-1 focus:border-indigo-500 outline-none"
            onChange={(e) => setSelectedMembroId(e.target.value)}
            value={selectedMembroId}
          >
            <option value="">-- Selecione ou Busque --</option>
            {membros.map((m: any) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>

        {/* Lista de Dívidas */}
        {selectedMembroId ? (
          <div className="space-y-3 max-h-[300px] overflow-auto custom-scrollbar">
            <h3 className="text-sm text-slate-400 font-bold uppercase border-b border-slate-800 pb-2">
                Pendências em Aberto ({mensalidades.length})
            </h3>
            
            {mensalidades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-emerald-500 gap-2 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
                <p className="font-bold">Tudo em dia!</p>
              </div>
            ) : (
              mensalidades.map((mens: any) => (
                <div key={mens.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                  <div>
                    <p className="text-white font-bold text-lg capitalize">
                        {new Date(mens.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                            {mens.status}
                        </span>
                        <span className="text-xs text-slate-400">Venc: {new Date(mens.data_vencimento).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-white font-mono text-lg font-bold">R$ {mens.valor}</span>
                    <button
                      onClick={() => handlePay(mens.id)}
                      disabled={loading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-1"
                    >
                      <DollarSign className="w-3 h-3" /> PAGAR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
            <div className="text-center py-10 text-slate-600">
                Selecione um membro para ver as mensalidades.
            </div>
        )}
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL ---
export default function MembrosPage() {
  const [membros, setMembros] = useState<any[]>([]);
  const [pixKey, setPixKey] = useState(''); // <--- Estado para a chave PIX
  const [busca, setBusca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preSelectedId, setPreSelectedId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/membros/');
      setMembros(res.data);
      
      // Busca também a configuração para pegar a chave PIX
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
    <main className="min-h-screen bg-[#050505] p-6 text-white pb-20 font-sans selection:bg-indigo-500/30">
      
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link href="/" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-slate-300">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              Membros
            </h1>
            <p className="text-slate-400 text-sm">Gestão de Mensalidades</p>
          </div>
        </div>

        <button
          onClick={() => openPaymentModal(null)}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-400/20 transition-all active:scale-95"
        >
          <DollarSign className="w-5 h-5" /> RECEBIMENTO AVULSO
        </button>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar DeMolay..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 pl-12 text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {membrosFiltrados.map((membro) => (
          <div key={membro.id} className="bg-[#0f0f11] border border-white/5 p-5 rounded-2xl hover:border-indigo-500/30 transition-all group flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1" title={membro.nome}>
                        {membro.nome}
                    </h3>
                    <span className="text-xs text-slate-600 font-mono">ID: {membro.dm_id}</span>
                </div>
                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    membro.status === 'REGULAR'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                    {membro.status}
                </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                    {membro.mensalidades_abertas.length > 0 ? (
                        <>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-500/20 text-rose-500">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-rose-400">{membro.mensalidades_abertas.length} Pendências</span>
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500">
                                <CheckCircle className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-emerald-500">Em dia</span>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end">
                <button
                    onClick={() => openPaymentModal(membro.id)}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-3 py-2 rounded-lg transition-all flex items-center gap-1"
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
        chavePix={pixKey} // <--- Passamos a chave PIX aqui
      />
    </main>
  );
}