'use client';

import { useEffect, useState } from 'react';
import api from '@/services/api';
import { DashboardData } from '@/types/financeiro';

// --- IMPORTS DOS COMPONENTES ---
import LoginPage from '@/components/LoginPage'; 
import NewTransactionModal from '@/components/NewTransactionModal'; 
import ReportModal from '@/components/ReportModal'; 
import ServerStatus from '@/components/ServerStatus'; // <--- Status do Servidor
import LogsModal from '@/components/LogsModal';       // <--- Modal de Logs
import Link from 'next/link'; // <--- Importante para navegar
import { Users } from 'lucide-react'; // <--- Ícone de usuários
import { Settings } from 'lucide-react'; // <--- Ícone de configurações

import { 
  Wallet, TrendingUp, TrendingDown, Activity, RefreshCw, 
  PieChart as PieIcon, BarChart3, Plus, FileText, LogOut, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Dashboard() {
  // --- ESTADOS DE CONTROLE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE DADOS ---
  const [data, setData] = useState<DashboardData | null>(null);
  
  // --- ESTADOS DOS MODAIS ---
  const [isModalOpen, setIsModalOpen] = useState(false);       // Transação
  const [isReportOpen, setIsReportOpen] = useState(false);     // Relatório PDF
  const [isLogsOpen, setIsLogsOpen] = useState(false);         // Logs de Auditoria (NOVO)

  // 1. Verifica token ao carregar
  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      configurarToken(token);
    } else {
      setLoading(false); 
    }
  }, []);

  // 2. Configura token e libera acesso
  const configurarToken = (token: string) => {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
    localStorage.setItem('nexus_token', token);
    setIsAuthenticated(true);
    fetchData(); 
  };

  // 3. Logout
  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setData(null);
  };

  // 4. Busca dados
  const fetchData = () => {
    setLoading(true);
    api.get('/dashboard/')
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
        if (error.response?.status === 401) {
          handleLogout();
        }
      })
      .finally(() => setLoading(false));
  };
  // ===========================================================================
  // 5. FUNÇÕES DE DOWNLOAD SEGURO (ADICIONE ISSO)
  // ===========================================================================
  
  const downloadArquivoSeguro = async (url: string, nomeArquivo: string) => {
    try {
      // Usa o 'api' que já tem o Header Authorization configurado
      const response = await api.get(url, {
        responseType: 'blob', // Importante: trata como arquivo binário
      });

      // Cria um link temporário no navegador
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', nomeArquivo);
      
      // Clica e remove
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error("Erro no download:", error);
      alert("Erro ao baixar. Verifique se sua sessão expirou.");
    }
  };

  const handleDownloadRelatorioMensal = () => {
    const data = new Date();
    const mes = data.getMonth() + 1; // Javascript começa mês em 0
    const ano = data.getFullYear();
    
    // Chama a rota passando o Token corretamente via axios
    downloadArquivoSeguro(
      `/relatorio/pdf/?mes=${mes}&ano=${ano}`, 
      `Balancete_${mes}-${ano}.pdf`
    );
  };

  const handleDownloadLogs = () => {
    const data = new Date();
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();

    downloadArquivoSeguro(
      `/logs/pdf/?mes=${mes}&ano=${ano}`, 
      `Auditoria_${mes}-${ano}.pdf`
    );
  };

  const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#f59e0b'];

  

  // --- RENDERIZAÇÃO ---

  // A) Login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={configurarToken} />;
  }

  // B) Loading
  if (loading && !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="animate-pulse tracking-widest text-xs font-mono text-purple-400">DECIFRANDO DADOS...</p>
    </div>
  );

  // C) Erro Fatal
  if (!data) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Erro de Conexão com o Servidor Arasaka.</div>;

  // D) Dashboard
  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-black p-4 md:p-8 text-white font-sans selection:bg-purple-500/30">
      
      {/* --- CABEÇALHO --- */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm">
            Tesouraria DeMolay
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
            <p className="text-slate-400 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400/80">Capítulo Unidos da Esperança nº 29</span>
            </p>
            {/* Componente de Status do Servidor */}
            <ServerStatus />
          </div>
        </div>
        
        {/* Barra de Ferramentas */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* NOVO BOTÃO DE MEMBROS */}
          <Link href="/membros">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 border border-indigo-400/20 group">
              <Users className="w-4 h-4" />
              MEMBROS
            </button>
          </Link>

          {/* NOVO BOTÃO DE TRANSAÇÕES */}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all active:scale-95 border border-purple-400/20 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
            NOVA TRANSAÇÃO
          </button>

          <button 
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-sm border border-slate-500/30 transition-all active:scale-95 group"
          >
            <FileText className="w-4 h-4 text-blue-300" />
            RELATÓRIOS
          </button>

          {/* Botão de Auditoria / Logs */}
          <button 
            onClick={() => setIsLogsOpen(true)}
            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-400 transition-all active:scale-95 group"
            title="Logs de Auditoria"
          >
            <ShieldAlert className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>

          <button 
            onClick={fetchData} 
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 transition-all active:scale-95 group"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>

          <button 
            onClick={handleLogout} 
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-rose-400 transition-all active:scale-95"
            title="Sair (Logout)"
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* --- NOVO BOTÃO DE CONFIGURAÇÕES --- */}
            <Link href="/settings">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(100,116,139,0.3)] transition-all active:scale-95 border border-slate-500/20 group">
                {/* A engrenagem gira quando passa o mouse (group-hover:rotate-90) */}
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                CONFIG
              </button>
            </Link>
        </div>
      </header>

      {/* --- CARDS (KPIs) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          titulo="Saldo em Caixa" 
          valor={data.cards.saldo} 
          icon={<Wallet className="w-8 h-8 text-blue-400" />} 
          cor="blue"
          subtexto="Disponível agora"
        />
        <Card 
          titulo="Total Entradas" 
          valor={data.cards.entradas} 
          icon={<TrendingUp className="w-8 h-8 text-emerald-400" />} 
          cor="emerald"
          subtexto="Neste período"
        />
        <Card 
          titulo="Total Saídas" 
          valor={data.cards.saidas} 
          icon={<TrendingDown className="w-8 h-8 text-rose-400" />} 
          cor="rose"
          subtexto="Neste período"
        />
      </div>

      {/* --- GRÁFICOS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Gráfico de Área (Fluxo) */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-200">
            <BarChart3 className="w-5 h-5 text-blue-400" /> Fluxo Financeiro (Mensal)
          </h3>
          <div className="h-[300px] min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.graficos.fluxo_mensal}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#94a3b8" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', {month:'short'})} 
                  tick={{fontSize: 12}}
                />
                <YAxis stroke="#94a3b8" tick={{fontSize: 12}} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza (Categorias) */}
        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-200">
            <PieIcon className="w-5 h-5 text-emerald-400" /> Distribuição por Categoria
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.graficos.por_categoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="categoria"
                >
                  {data.graficos.por_categoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px'}} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- TABELA DE RECENTES --- */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Detalhe visual de brilho */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          Últimas Movimentações (Auditadas)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="pb-4 pl-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Descrição / Data</th>
                <th className="pb-4 font-medium">Categoria</th>
                <th className="pb-4 font-medium">Responsável</th>
                <th className="pb-4 text-right pr-4 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {data.recentes.map((t) => (
                <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 pl-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      t.tipo === 'ENTRADA' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      {t.tipo === 'ENTRADA' ? '▲ RECEITA' : '▼ DESPESA'}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="font-semibold text-slate-200 text-base">{t.nome}</div>
                    <div className="text-slate-500 mt-0.5 font-mono text-xs">{t.data_transacao}</div>
                  </td>
                  <td className="py-4">
                     <span className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-slate-300 text-xs font-mono">
                        {t.categoria_display}
                     </span>
                  </td>
                  <td className="py-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/5 uppercase">
                          {t.responsavel_nome ? t.responsavel_nome.charAt(0) : '?'}
                      </div>
                      <span className="text-xs font-medium">{t.responsavel_nome}</span>
                    </div>
                  </td>
                  <td className={`py-4 text-right font-mono text-base font-bold pr-4 ${
                      t.tipo === 'ENTRADA' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {t.tipo === 'SAIDA' ? '- ' : '+ '}
                    {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAIS FLUTUANTES --- */}
      
      {/* 1. Nova Transação */}
      <NewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />

      {/* 2. Baixar PDF */}
      <ReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* 3. Logs de Auditoria */}
      <LogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />

    </main>
  );
}

// Sub-componente Card
function Card({ titulo, valor, icon, cor, subtexto }: any) {
  return (
    <div className="relative overflow-hidden bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 rounded-3xl group hover:bg-white/[0.06] hover:border-white/20 hover:scale-[1.02] transition-all duration-300 shadow-xl">
      <div className={`absolute -top-10 -right-10 w-40 h-40 bg-${cor}-500/20 rounded-full blur-3xl group-hover:bg-${cor}-500/30 transition-all duration-500`}></div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3.5 rounded-2xl bg-${cor}-500/10 border border-${cor}-500/20 text-${cor}-400 group-hover:text-${cor}-300 transition-colors`}>
            {icon}
          </div>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1 text-sm uppercase tracking-wide opacity-80">{titulo}</p>
          <h3 className="text-4xl font-bold tracking-tight text-white mb-2 font-mono">
            R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className={`text-[10px] font-bold uppercase tracking-wider text-${cor}-400/80 bg-${cor}-500/5 inline-block px-2 py-1 rounded border border-${cor}-500/10`}>
            {subtexto}
          </p>
        </div>
      </div>
    </div>
  );
}