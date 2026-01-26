'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { ArrowLeft, Plus, Calendar, TrendingUp, TrendingDown, DollarSign, PartyPopper, CheckCircle, X, Pencil, Archive, RefreshCcw } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle'; // Import do botão

// --- FUNÇÃO AUXILIAR PARA CORRIGIR DATAS ---
const formatarData = (dataISO: string | null) => {
  if (!dataISO) return 'Data não definida';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO; 
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

export default function EventosPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoParaEditar, setEventoParaEditar] = useState<any | null>(null);
  
  // Formulário
  const [formNome, setFormNome] = useState('');
  const [formData, setFormData] = useState('');

  const fetchEventos = async () => {
    try {
      const res = await api.get('/eventos/');
      setEventos(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEventos(); }, []);

  const abrirModal = (evento?: any) => {
      if (evento) {
          setEventoParaEditar(evento);
          setFormNome(evento.nome);
          setFormData(evento.data_evento || '');
      } else {
          setEventoParaEditar(null);
          setFormNome('');
          setFormData('');
      }
      setIsModalOpen(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        nome: formNome,
        data_evento: formData || null,
        status: eventoParaEditar ? eventoParaEditar.status : 'ATIVO' 
    };

    try {
        if (eventoParaEditar) {
            await api.put(`/eventos/${eventoParaEditar.id}/`, payload);
            alert("Evento atualizado!");
        } else {
            await api.post('/eventos/', payload);
            alert("Evento criado!");
        }
        setIsModalOpen(false);
        fetchEventos();
    } catch (err) {
        alert("Erro ao salvar evento.");
    }
  };

  const toggleStatus = async (evento: any) => {
      const novoStatus = evento.status === 'ATIVO' ? 'CONCLUIDO' : 'ATIVO';
      const acao = novoStatus === 'CONCLUIDO' ? 'finalizar' : 'reabrir';
      
      if (!confirm(`Deseja realmente ${acao} o evento "${evento.nome}"?`)) return;

      try {
          await api.patch(`/eventos/${evento.id}/`, { status: novoStatus });
          fetchEventos();
      } catch (err) {
          alert(`Erro ao ${acao} evento.`);
      }
  };

  return (
    <main className="min-h-screen p-6 pb-20 font-sans transition-colors duration-300
      bg-slate-50 text-slate-900
      dark:bg-[#050505] dark:text-white">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/" className="p-3 rounded-xl transition-colors border shadow-sm
              bg-white border-slate-200 text-slate-500 hover:bg-slate-100
              dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                Eventos & Projetos
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gestão de Lucratividade</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <ThemeToggle /> {/* Botão de Tema */}
            <button 
                onClick={() => abrirModal()}
                className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
                <Plus className="w-5 h-5" /> NOVO EVENTO
            </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventos.map((ev) => {
            const isConcluido = ev.status === 'CONCLUIDO';
            return (
                <div key={ev.id} className={`p-6 rounded-3xl transition-all group relative overflow-hidden shadow-xl border
                    ${isConcluido 
                        ? 'bg-slate-100 border-slate-200 opacity-75 hover:opacity-100 dark:bg-slate-900/40 dark:border-slate-800' 
                        : 'bg-white border-slate-100 hover:border-purple-200 dark:bg-[#0f0f11] dark:border-white/5 dark:hover:border-purple-500/30'
                    }`}>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <h2 className={`text-xl font-bold mb-1 transition-colors ${
                                isConcluido 
                                ? 'text-slate-400 line-through decoration-slate-400 dark:text-slate-500 dark:decoration-slate-600' 
                                : 'text-slate-800 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400'
                            }`}>
                                {ev.nome}
                            </h2>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-500">
                                <Calendar className="w-3 h-3" />
                                {formatarData(ev.data_evento)}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => abrirModal(ev)}
                                className="p-2 rounded-lg transition-all
                                bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600
                                dark:bg-slate-800 dark:hover:bg-blue-600/20 dark:hover:text-blue-400"
                                title="Editar Informações"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            
                            <button 
                                onClick={() => toggleStatus(ev)}
                                className={`p-2 rounded-lg transition-all ${
                                    isConcluido
                                    ? 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600/20 dark:hover:text-emerald-400'
                                    : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600 dark:bg-slate-800 dark:hover:bg-amber-500/20 dark:hover:text-amber-400'
                                }`}
                                title={isConcluido ? "Reabrir Evento" : "Finalizar Evento"}
                            >
                                {isConcluido ? <RefreshCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                            !isConcluido 
                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                            : 'bg-slate-200 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}>
                            {!isConcluido ? 'EM ANDAMENTO' : 'CONCLUÍDO (Arquivado)'}
                        </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 mb-4 relative z-10 ${isConcluido ? 'opacity-50 grayscale' : ''}`}>
                        <div className="p-3 rounded-xl border
                            bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10">
                            <p className="text-[10px] uppercase font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><TrendingUp className="w-3 h-3"/> Receita</p>
                            <p className="text-lg font-mono text-emerald-700 dark:text-emerald-300">R$ {ev.total_entradas}</p>
                        </div>
                        <div className="p-3 rounded-xl border
                            bg-rose-50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10">
                            <p className="text-[10px] uppercase font-bold flex items-center gap-1 text-rose-600 dark:text-rose-400"><TrendingDown className="w-3 h-3"/> Despesa</p>
                            <p className="text-lg font-mono text-rose-700 dark:text-rose-300">R$ {ev.total_saidas}</p>
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border flex justify-between items-center relative z-10 ${
                        ev.lucro >= 0 
                        ? 'bg-slate-50 border-emerald-200 dark:bg-slate-800/50 dark:border-emerald-500/30' 
                        : 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-500/30'
                    }`}>
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Resultado</span>
                        <span className={`text-xl font-bold font-mono ${
                            ev.lucro >= 0 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                            {ev.lucro >= 0 ? '+' : ''} R$ {ev.lucro}
                        </span>
                    </div>
                </div>
            );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in rounded-2xl
                bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                        {eventoParaEditar ? '✏️ Editar Evento' : '✨ Novo Evento'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400 hover:text-slate-600 dark:hover:text-white" /></button>
                </div>

                <form onSubmit={handleSalvar} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">Nome do Evento</label>
                        <input 
                            required 
                            autoFocus
                            placeholder="Ex: Feijoada 2026" 
                            value={formNome}
                            onChange={e => setFormNome(e.target.value)}
                            className="w-full rounded-xl p-3 outline-none border transition-colors
                            bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500
                            dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-purple-500"
                        />
                    </div>
                    <div>
                         <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">Data (Opcional)</label>
                        <input 
                            type="date"
                            value={formData}
                            onChange={e => setFormData(e.target.value)}
                            className="w-full rounded-xl p-3 outline-none border transition-colors
                            bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-500
                            dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-purple-500"
                        />
                    </div>
                    <button className="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-bold text-white shadow-lg transition-all">
                        {eventoParaEditar ? 'ATUALIZAR' : 'CRIAR EVENTO'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </main>
  );
}