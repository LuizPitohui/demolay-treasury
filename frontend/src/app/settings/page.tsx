'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { ArrowLeft, Save, Settings, Hash, CreditCard, DollarSign, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [reajusteLoading, setReajusteLoading] = useState(false); // Loading específico do botão de perigo
  
  const [formData, setFormData] = useState({
    valor_mensalidade: '',
    dia_vencimento: '',
    chave_pix: '',
    nome_capitulo: ''
  });

  useEffect(() => {
    api.get('/configuracao/').then(res => setFormData(res.data));
  }, []);

  // 1. Salvar Configurações Normais
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/configuracao/', formData);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Ação de Reajuste (Botão Perigoso)
  const handleReajuste = async () => {
    const confirmacao = confirm(
      `ATENÇÃO: Isso irá alterar o valor de TODAS as mensalidades que ninguém pagou ainda para R$ ${formData.valor_mensalidade}.\n\nQuem já pagou NÃO será afetado.\n\nDeseja continuar?`
    );

    if (!confirmacao) return;

    setReajusteLoading(true);
    try {
      const res = await api.post('/configuracao/aplicar_reajuste/');
      alert(res.data.detalhes || "Atualização concluída!");
    } catch (error) {
      console.error(error);
      alert("Erro ao aplicar reajuste.");
    } finally {
      setReajusteLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] p-6 text-white pb-20 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-300" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-400">
              Configurações
            </h1>
            <p className="text-slate-400 text-sm">Parâmetros globais do Nexus</p>
          </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* FORMULÁRIO PRINCIPAL */}
        <form onSubmit={handleSave} className="bg-[#0f0f11] border border-white/5 p-8 rounded-3xl shadow-xl space-y-8">
            
            {/* Seção Financeira */}
            <div>
                <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5" /> Parâmetros Financeiros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Valor da Mensalidade (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-emerald-500" />
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.valor_mensalidade}
                                onChange={e => setFormData({...formData, valor_mensalidade: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none font-mono text-lg"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            *Valor padrão para novas cobranças.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Dia de Vencimento</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-indigo-500" />
                            <input 
                                type="number" 
                                max="31"
                                min="1"
                                value={formData.dia_vencimento}
                                onChange={e => setFormData({...formData, dia_vencimento: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none font-mono text-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-white/5" />

            {/* Seção Institucional */}
            <div>
                <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-4">
                    <Hash className="w-5 h-5" /> Dados Institucionais
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome Oficial do Capítulo</label>
                        <input 
                            type="text" 
                            value={formData.nome_capitulo}
                            onChange={e => setFormData({...formData, nome_capitulo: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Chave PIX Padrão</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-indigo-500" />
                            <input 
                                type="text" 
                                value={formData.chave_pix}
                                onChange={e => setFormData({...formData, chave_pix: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-indigo-500 outline-none font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading ? "Salvando..." : <><Save className="w-5 h-5" /> SALVAR ALTERAÇÕES</>}
            </button>
        </form>

        {/* ZONA DE MANUTENÇÃO / PERIGO */}
        <div className="bg-rose-950/20 border border-rose-500/20 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" /> Reajuste de Valores
            </h3>
            <p className="text-slate-400 text-sm mb-6">
                Caso você tenha alterado o valor da mensalidade acima, utilize o botão abaixo para aplicar este novo valor 
                a todas as cobranças que <strong>ainda não foram pagas</strong>. Isso é útil para corrigir valores lançados errado ou aumentos de taxa.
            </p>
            
            <button 
                onClick={handleReajuste}
                disabled={reajusteLoading}
                className="flex items-center gap-2 px-6 py-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/50 rounded-xl text-rose-400 font-bold transition-all disabled:opacity-50"
            >
                {reajusteLoading ? (
                    "Processando..."
                ) : (
                    <>
                        <RefreshCw className="w-4 h-4" />
                        APLICAR REAJUSTE ÀS DÍVIDAS ABERTAS
                    </>
                )}
            </button>
        </div>

      </div>
    </main>
  );
}