'use client';

import { useState } from 'react';
import api from '@/services/api';
import { X, Check, DollarSign, FileText } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTransactionModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [tipo, setTipo] = useState('ENTRADA');
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState(''); // Mantemos como string para facilitar a digitação
  const [categoria, setCategoria] = useState('OUTRO_ENTRADA');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // --- CORREÇÃO DO VALOR AQUI ---
        // 1. Remove qualquer coisa que não seja número ou vírgula/ponto
        let valorLimpo = valor.replace(/[^\d.,]/g, '');
        
        // 2. Substitui vírgula por ponto (Padrão BR -> US)
        valorLimpo = valorLimpo.replace(',', '.');

        // 3. Garante que é um float válido
        const valorFinal = parseFloat(valorLimpo);

        if (isNaN(valorFinal)) {
            alert("Valor inválido!");
            setLoading(false);
            return;
        }

      await api.post('/transacoes/', {
        tipo,
        nome,
        valor: valorFinal, // Envia o número float correto (ex: 150.00)
        categoria,
        forma_pagamento: 'PIX'
      });

      // Limpa formulário
      setNome('');
      setValor('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar transação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white">Nova Transação</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* TIPO */}
          <div className="grid grid-cols-2 gap-4 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setTipo('ENTRADA')}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${tipo === 'ENTRADA' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              ENTRADA (+)
            </button>
            <button
              type="button"
              onClick={() => setTipo('SAIDA')}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${tipo === 'SAIDA' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              SAÍDA (-)
            </button>
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Descrição</label>
            <input 
              required
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="Ex: Mensalidade João"
            />
          </div>

          {/* VALOR */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Valor (R$)</label>
            <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-emerald-500" />
                <input 
                  required
                  type="text" // Usar text permite digitar vírgula mais fácil
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 pl-10 text-white focus:outline-none focus:border-emerald-500 font-mono text-lg"
                  placeholder="0,00"
                />
            </div>
          </div>

          {/* CATEGORIA */}
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
             <select 
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
             >
                <option value="ADM">Administrativo</option>
                <option value="FIL">Filantropia</option>
                <option value="EVE">Eventos/Festas</option>
                <option value="CAM">Campanhas</option>
                <option value="MENSALIDADE">Mensalidade</option>
                <option value="OUTRO_ENTRADA">Outros (Entrada)</option>
                <option value="OUTRO_SAIDA">Outros (Saída)</option>
             </select>
          </div>

          <button 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-4 flex items-center justify-center gap-2"
          >
            {loading ? "Salvando..." : <><Check className="w-4 h-4" /> CONFIRMAR</>}
          </button>

        </form>
      </div>
    </div>
  );
}