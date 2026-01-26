'use client';

import { useState, useEffect } from 'react';
import api from '@/services/api';
import { X, Save, DollarSign, AlignLeft, Tag, Calendar, PartyPopper } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: any | null;
}

export default function NewTransactionModal({ isOpen, onClose, onSuccess, transactionToEdit }: ModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário
  const [tipo, setTipo] = useState('SAIDA');
  const [valor, setValor] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('OUTRO_SAIDA');
  const [descricao, setDescricao] = useState('');
  const [eventoId, setEventoId] = useState(''); 
  
  const [eventos, setEventos] = useState<any[]>([]);

  // Carrega eventos quando abre
  useEffect(() => {
    if (isOpen) {
        api.get('/eventos/').then(res => {
            const todosEventos = res.data;
            const eventosFiltrados = todosEventos.filter((ev: any) => 
                ev.status === 'ATIVO' || 
                (transactionToEdit && transactionToEdit.evento_id === ev.id)
            );
            setEventos(eventosFiltrados); 
        });

        if (transactionToEdit) {
            setTipo(transactionToEdit.tipo);
            setValor(transactionToEdit.valor);
            setNome(transactionToEdit.nome);
            setCategoria(transactionToEdit.categoria);
            setDescricao(transactionToEdit.descricao || '');
            setEventoId(transactionToEdit.evento_id || '');
        } else {
            setTipo('SAIDA');
            setValor('');
            setNome('');
            setCategoria('OUTRO_SAIDA');
            setDescricao('');
            setEventoId('');
        }
    }
  }, [isOpen, transactionToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      tipo,
      valor: parseFloat(valor.replace(',', '.')),
      nome,
      categoria,
      descricao,
      evento_id: eventoId || null
    };

    try {
      if (transactionToEdit) {
        await api.put(`/transacoes/${transactionToEdit.id}/`, payload);
      } else {
        await api.post('/transacoes/', payload);
      }
      alert('Salvo com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in duration-200 rounded-2xl border
        bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                {transactionToEdit ? '✏️ Editar Transação' : '✨ Nova Transação'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* TIPO */}
            <div className="grid grid-cols-2 gap-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button type="button" onClick={() => setTipo('ENTRADA')} className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    tipo === 'ENTRADA' 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                }`}>ENTRADA (+)</button>
                <button type="button" onClick={() => setTipo('SAIDA')} className={`py-2 rounded-lg text-sm font-bold transition-all ${
                    tipo === 'SAIDA' 
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
                }`}>SAÍDA (-)</button>
            </div>

            {/* Inputs de Valor e Nome */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">Descrição</label>
                    <div className="relative">
                        <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            required 
                            type="text" 
                            value={nome} 
                            onChange={e => setNome(e.target.value)} 
                            className="w-full rounded-xl p-2.5 pl-10 outline-none border transition-colors
                            bg-white border-slate-200 text-slate-800 focus:border-blue-500
                            dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500" 
                            placeholder="Ex: Venda de Pizza" 
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">Valor</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            required 
                            type="number" 
                            step="0.01" 
                            value={valor} 
                            onChange={e => setValor(e.target.value)} 
                            className="w-full rounded-xl p-2.5 pl-10 outline-none border transition-colors font-mono
                            bg-white border-slate-200 text-slate-800 focus:border-blue-500
                            dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500" 
                            placeholder="0.00" 
                        />
                    </div>
                </div>
            </div>

            {/* VINCULAR A EVENTO */}
            <div>
                <label className="text-xs font-bold uppercase mb-1 flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                    <PartyPopper className="w-3 h-3" /> Vincular a Evento (Opcional)
                </label>
                <select 
                    value={eventoId}
                    onChange={e => setEventoId(e.target.value)}
                    className="w-full rounded-xl p-2.5 outline-none border appearance-none transition-colors
                    bg-indigo-50 border-indigo-200 text-indigo-700 focus:border-indigo-500
                    dark:bg-indigo-900/20 dark:border-indigo-500/30 dark:text-indigo-200 dark:focus:border-indigo-500"
                >
                    <option value="" className="text-slate-500 bg-white dark:bg-slate-900">-- Nenhum (Transação Comum) --</option>
                    {eventos.map(ev => (
                        <option key={ev.id} value={ev.id} className="text-slate-800 dark:text-white bg-white dark:bg-slate-900">
                            {ev.nome}
                        </option>
                    ))}
                </select>
            </div>

            {/* Categoria */}
            <div>
                 <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">Categoria</label>
                 <div className="relative">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select 
                        value={categoria} 
                        onChange={e => setCategoria(e.target.value)} 
                        className="w-full rounded-xl p-2.5 pl-10 outline-none border appearance-none transition-colors
                        bg-white border-slate-200 text-slate-800 focus:border-blue-500
                        dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500"
                    >
                        <optgroup label="Entradas" className="text-slate-800 dark:text-white bg-white dark:bg-slate-900">
                            <option value="MENSALIDADE">Mensalidade</option>
                            <option value="DOACAO">Doação</option>
                            <option value="CAMPANHA">Campanha</option>
                            <option value="OUTRO_ENTRADA">Outros (Entrada)</option>
                        </optgroup>
                        <optgroup label="Saídas" className="text-slate-800 dark:text-white bg-white dark:bg-slate-900">
                            <option value="ADM">Administrativo</option>
                            <option value="FIL">Filantropia</option>
                            <option value="EVE">Eventos/Festas</option>
                            <option value="ALUGUEL">Aluguel/Contas</option>
                            <option value="COMIDA">Alimentação</option>
                            <option value="OUTRO_SAIDA">Outros (Saída)</option>
                        </optgroup>
                    </select>
                 </div>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${tipo === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
                {loading ? 'Salvando...' : <><Save className="w-5 h-5" /> {transactionToEdit ? 'ATUALIZAR' : 'LANÇAR'}</>}
            </button>
        </form>
      </div>
    </div>
  );
}