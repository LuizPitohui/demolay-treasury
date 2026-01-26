'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/services/api';
import Link from 'next/link';
import { ArrowLeft, Save, Settings, Hash, CreditCard, DollarSign, Calendar, AlertTriangle, RefreshCw, Upload, Users, CheckCircle } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle'; // Import do botão

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [reajusteLoading, setReajusteLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    valor_mensalidade: '',
    dia_vencimento: '',
    chave_pix: '',
    nome_capitulo: ''
  });

  useEffect(() => {
    api.get('/configuracao/').then(res => setFormData(res.data));
  }, []);

  // 1. Salvar Configurações
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

  // 2. Reajuste de Valores
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
      alert("Erro ao aplicar reajuste.");
    } finally {
      setReajusteLoading(false);
    }
  };

  // 3. Importação de Membros
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert("Por favor, selecione um arquivo .CSV");
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('arquivo', file);

    setUploadLoading(true);
    try {
      const res = await api.post('/membros/importar/', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`SUCESSO!\n${res.data.detalhes}`);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.erro || "Erro ao importar arquivo.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <main className="min-h-screen p-6 pb-20 font-sans transition-colors duration-300
      bg-slate-50 text-slate-900
      dark:bg-[#050505] dark:text-white">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Link href="/" className="p-3 rounded-xl transition-colors border shadow-sm
              bg-white border-slate-200 text-slate-500 hover:bg-slate-100
              dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-200 dark:to-slate-400">
                Configurações
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Parâmetros globais do Nexus</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
             <ThemeToggle />
          </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* --- FORMULÁRIO PRINCIPAL --- */}
        <form onSubmit={handleSave} className="p-8 rounded-3xl shadow-xl space-y-8 border
            bg-white border-slate-200
            dark:bg-[#0f0f11] dark:border-white/5">
            
            {/* Seção Financeira */}
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                    <Settings className="w-5 h-5" /> Parâmetros Financeiros
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold uppercase mb-2 block text-slate-500 dark:text-slate-400">Valor da Mensalidade (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-emerald-500" />
                            <input 
                                type="number" 
                                step="0.01"
                                value={formData.valor_mensalidade}
                                onChange={e => setFormData({...formData, valor_mensalidade: e.target.value})}
                                className="w-full rounded-xl p-3 pl-10 outline-none font-mono text-lg border transition-colors
                                bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500
                                dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase mb-2 block text-slate-500 dark:text-slate-400">Dia de Vencimento</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-indigo-500" />
                            <input 
                                type="number" 
                                max="31"
                                min="1"
                                value={formData.dia_vencimento}
                                onChange={e => setFormData({...formData, dia_vencimento: e.target.value})}
                                className="w-full rounded-xl p-3 pl-10 outline-none font-mono text-lg border transition-colors
                                bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500
                                dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-indigo-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-slate-200 dark:border-white/5" />

            {/* Seção Institucional */}
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400">
                    <Hash className="w-5 h-5" /> Dados Institucionais
                </h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold uppercase mb-2 block text-slate-500 dark:text-slate-400">Nome Oficial do Capítulo</label>
                        <input 
                            type="text" 
                            value={formData.nome_capitulo}
                            onChange={e => setFormData({...formData, nome_capitulo: e.target.value})}
                            className="w-full rounded-xl p-3 outline-none border transition-colors
                            bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500
                            dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase mb-2 block text-slate-500 dark:text-slate-400">Chave PIX Padrão</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3.5 w-5 h-5 text-indigo-500" />
                            <input 
                                type="text" 
                                value={formData.chave_pix}
                                onChange={e => setFormData({...formData, chave_pix: e.target.value})}
                                className="w-full rounded-xl p-3 pl-10 outline-none font-mono border transition-colors
                                bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500
                                dark:bg-black/40 dark:border-white/10 dark:text-white dark:focus:border-indigo-500"
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

        {/* --- ZONA 2: IMPORTAÇÃO DE MEMBROS --- */}
        <div className="p-8 rounded-3xl relative overflow-hidden border shadow-lg
            bg-white border-blue-200
            dark:bg-[#0f0f11] dark:border-blue-500/20">
            
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl
                bg-blue-100 dark:bg-blue-500/10"></div>
            
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 relative z-10 text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" /> Gestão de Membros (Bulk Import)
            </h3>
            
            <p className="text-sm mb-6 relative z-10 text-slate-600 dark:text-slate-400">
                Faça o upload de uma planilha <strong>.csv</strong> atualizada para cadastrar novos membros automaticamente.
                O arquivo deve conter as colunas <code>NOME</code> e <code>ID</code>. Membros que já existem não serão duplicados.
            </p>

            <div className="flex items-center gap-4 relative z-10">
                <input 
                    type="file" 
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                    {uploadLoading ? (
                        "Processando..."
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            SELECIONAR ARQUIVO CSV
                        </>
                    )}
                </button>

                {!uploadLoading && (
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                        Nenhum arquivo selecionado.
                    </span>
                )}
            </div>
        </div>

        {/* --- ZONA 3: MANUTENÇÃO (PERIGO) --- */}
        <div className="p-8 rounded-3xl border
            bg-rose-50 border-rose-200
            dark:bg-rose-950/10 dark:border-rose-500/20">
            
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" /> Zona de Perigo
            </h3>
            <p className="text-sm mb-6 text-slate-600 dark:text-slate-400">
                Caso você tenha alterado o valor da mensalidade acima, utilize o botão abaixo para aplicar este novo valor 
                a todas as cobranças que <strong>ainda não foram pagas</strong>.
            </p>
            
            <button 
                onClick={handleReajuste}
                disabled={reajusteLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 border
                bg-white border-rose-200 text-rose-600 hover:bg-rose-100
                dark:bg-rose-600/10 dark:border-rose-500/50 dark:text-rose-400 dark:hover:bg-rose-600/20"
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