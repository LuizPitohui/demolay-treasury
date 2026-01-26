'use client';

import { useEffect, useState, useCallback, memo, useMemo } from 'react';
import api from '@/services/api';
import { DashboardData } from '@/types/financeiro';
import { useTheme } from '@/contexts/ThemeContext'; // Import do tema

// --- IMPORTS DOS COMPONENTES ---
import LoginPage from '@/components/LoginPage'; 
import NewTransactionModal from '@/components/NewTransactionModal'; 
import ReportModal from '@/components/ReportModal'; 
import ServerStatus from '@/components/ServerStatus';
import LogsModal from '@/components/LogsModal';
import ThemeToggle from '@/components/ThemeToggle'; // Novo componente
import Link from 'next/link';

import { 
  Users, Settings, Wallet, TrendingUp, TrendingDown, Activity, RefreshCw, 
  PieChart as PieIcon, BarChart3, Plus, FileText, LogOut, ShieldCheck, 
  ShieldAlert, Pencil, Trash2, PartyPopper, Calendar, Filter, ChevronDown
} from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// ============================================================================
// 1. COMPONENTES VISUAIS (ADAPTADOS LIGHT/DARK)
// ============================================================================

const Card = memo(({ titulo, valor, icon, cor, subtexto }: any) => (
  <div className="relative overflow-hidden p-6 rounded-3xl group transition-all duration-500 shadow-xl hover:scale-[1.02]
    bg-white/60 border border-white/60 backdrop-blur-xl hover:border-slate-300 hover:shadow-2xl
    dark:bg-white/[0.03] dark:border-white/10 dark:hover:bg-white/[0.06] dark:hover:border-white/20">
    
    {/* Efeito de Brilho no Fundo */}
    <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all duration-500
        bg-${cor}-500/10 group-hover:bg-${cor}-500/20
        dark:bg-${cor}-500/20 dark:group-hover:bg-${cor}-500/30`}></div>
    
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3.5 rounded-2xl shadow-inner transition-colors
            bg-${cor}-100 text-${cor}-600 border border-${cor}-200
            dark:bg-${cor}-500/10 dark:text-${cor}-400 dark:border-${cor}-500/20`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="font-medium mb-1 text-xs uppercase tracking-widest opacity-80 flex items-center gap-2
            text-slate-500 dark:text-slate-400">
            {titulo}
        </p>
        <h3 className="text-4xl font-bold tracking-tight mb-2 font-mono drop-shadow-sm
            text-slate-800 dark:text-white">
          R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </h3>
        <div className={`text-[10px] font-bold uppercase tracking-wider inline-flex px-2 py-1 rounded-md items-center gap-1 border
            text-${cor}-600 bg-${cor}-100 border-${cor}-200
            dark:text-${cor}-400/90 dark:bg-${cor}-500/10 dark:border-${cor}-500/10`}>
          <Activity className="w-3 h-3" /> {subtexto}
        </div>
      </div>
    </div>
  </div>
));
Card.displayName = 'Card';

const PoteCard = memo(({ titulo, valor, icon, cor, desc }: any) => (
    <div className={`relative overflow-hidden p-6 rounded-3xl flex items-center justify-between group transition-all duration-500 hover:scale-[1.01] shadow-xl
        bg-white/60 border border-white/60 backdrop-blur-xl hover:border-${cor}-500/30
        dark:bg-white/[0.03] dark:border-white/10 dark:hover:bg-white/[0.06]`}>
        
        {/* Glow Ambiental */}
        <div className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl transition-all duration-700
            bg-${cor}-500/10 group-hover:bg-${cor}-500/20`}></div>
        
        <div className="relative z-10">
            <p className={`font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2
                text-${cor}-600 dark:text-${cor}-300/80`}>
                {icon} {titulo}
            </p>
            <h3 className="text-3xl font-bold font-mono mb-1 drop-shadow-md
                text-slate-800 dark:text-white">
                R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] font-medium tracking-wide opacity-80
                text-slate-500 dark:text-slate-400">{desc}</p>
        </div>
        
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border transition-all shadow-[0_0_20px_rgba(0,0,0,0.05)]
            bg-${cor}-100/50 border-${cor}-200 text-${cor}-600
            dark:bg-${cor}-500/10 dark:border-${cor}-500/20 dark:text-${cor}-400 dark:group-hover:bg-${cor}-500/20`}>
            {icon}
        </div>
    </div>
));
PoteCard.displayName = 'PoteCard';

// ============================================================================
// 2. SEÇÃO DE GRÁFICOS
// ============================================================================
const GraficosSection = memo(({ data, COLORS, viewMode }: any) => {
  const { theme } = useTheme(); // Para ajustar cores do gráfico

  const chartData = useMemo(() => {
    const rawData = data.graficos.fluxo || data.graficos.fluxo_mensal || []; 
    const processed: any = {};
    rawData.forEach((item: any) => {
        const dateKey = item.data_ref || item.mes;
        if (!processed[dateKey]) processed[dateKey] = { date: dateKey, entrada: 0, saida: 0 };
        if (item.tipo === 'ENTRADA') processed[dateKey].entrada = item.total;
        if (item.tipo === 'SAIDA') processed[dateKey].saida = item.total;
    });
    return Object.values(processed).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const formatXAxis = (val: string) => {
      const date = new Date(val);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      if (viewMode === 'ANUAL') return adjustedDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      else return adjustedDate.getDate().toString().padStart(2, '0');
  };

  // Cores dinâmicas para o gráfico
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? '#ffffff10' : '#00000010';
  const tooltipBg = theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tooltipText = theme === 'dark' ? '#fff' : '#1e293b';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Container Gráfico Linhas */}
      <div className="p-6 rounded-3xl shadow-xl relative overflow-hidden
        bg-white/60 border border-white/60 backdrop-blur-xl
        dark:bg-white/[0.02] dark:border-white/10">
        
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <BarChart3 className="w-5 h-5 text-blue-500" /> 
          {viewMode === 'ANUAL' ? 'Fluxo Anual (Jan - Dez)' : 'Fluxo Mensal (Dia a Dia)'}
        </h3>
        <div className="h-[300px] min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke={axisColor} tickFormatter={formatXAxis} tick={{fontSize: 12}} axisLine={false} tickLine={false} dy={10} interval={viewMode === 'ANUAL' ? 0 : 'preserveStartEnd'} />
              <YAxis stroke={axisColor} tick={{fontSize: 12}} tickFormatter={(val) => `R$${val}`} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText, boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)'}} 
                itemStyle={{color: tooltipText, fontWeight: 'bold'}}
                formatter={(value: any) => [`R$ ${Number(value || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', {day: '2-digit', month: 'long', timeZone: 'UTC'})}
              />
              <Legend verticalAlign="top" height={36} iconType="circle"/>
              <Line name="Entradas" type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#0f172a' : '#fff', stroke: '#10b981' }} activeDot={{ r: 6 }} />
              <Line name="Saídas" type="monotone" dataKey="saida" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: theme === 'dark' ? '#0f172a' : '#fff', stroke: '#f43f5e' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Container Gráfico Pizza */}
      <div className="p-6 rounded-3xl shadow-xl relative overflow-hidden
        bg-white/60 border border-white/60 backdrop-blur-xl
        dark:bg-white/[0.02] dark:border-white/10">
        
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <PieIcon className="w-5 h-5 text-emerald-500" /> Distribuição por Categoria
        </h3>
        <div className="h-[300px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.graficos.por_categoria} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="total" nameKey="categoria" stroke="none">
                {data.graficos.por_categoria.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '10px'}} 
                itemStyle={{color: tooltipText}}
                formatter={(val: any) => `R$ ${Number(val || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} 
              />
              <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', color: axisColor}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});
GraficosSection.displayName = 'GraficosSection';

// ============================================================================
// 3. SKELETON LOADING
// ============================================================================
const DashboardSkeleton = () => (
  <main className="min-h-screen p-4 md:p-8 animate-pulse bg-slate-50 dark:bg-slate-950">
    <div className="flex justify-between mb-8">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>
        <div className="h-10 w-96 bg-slate-200 dark:bg-slate-900 rounded-xl"></div>
    </div>
    <div className="h-16 w-full bg-slate-200 dark:bg-slate-900 rounded-2xl mb-8"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
       {[1,2,3].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-900 rounded-3xl"></div>)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
       {[1,2].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-900 rounded-3xl"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
       {[1,2].map(i => <div key={i} className="h-[350px] bg-slate-200 dark:bg-slate-900 rounded-3xl"></div>)}
    </div>
  </main>
);

// ============================================================================
// 4. MAIN DASHBOARD
// ============================================================================

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);  
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (token) configurarToken(token);
    else setLoading(false); 
  }, []);

  const configurarToken = (token: string) => {
    api.defaults.headers.common['Authorization'] = `Token ${token}`;
    localStorage.setItem('nexus_token', token);
    setIsAuthenticated(true);
  };

  useEffect(() => {
      if (isAuthenticated) fetchData();
  }, [isAuthenticated, selectedYear, selectedMonth]);

  const fetchData = () => {
    if (!data) setLoading(true);
    api.get(`/dashboard/?ano=${selectedYear}&mes=${selectedMonth}`)
      .then((response) => setData(response.data))
      .catch((error) => {
        console.error("Erro:", error);
        if (error.response?.status === 401) handleLogout();
      })
      .finally(() => setLoading(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_token');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setData(null);
  };

  const handleEdit = useCallback((transacao: any) => { setTransactionToEdit(transacao); setIsModalOpen(true); }, []);
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Excluir transação?")) return;
    try { await api.delete(`/transacoes/${id}/`); alert("Excluída."); fetchData(); } 
    catch (e) { alert("Erro ao excluir."); }
  }, [selectedYear, selectedMonth]);
  const handleOpenNew = useCallback(() => { setTransactionToEdit(null); setIsModalOpen(true); }, []);

  const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#a855f7', '#f59e0b', '#ec4899', '#6366f1'];
  const MESES = [
      { v: '1', l: 'Jan' }, { v: '2', l: 'Fev' }, { v: '3', l: 'Mar' }, { v: '4', l: 'Abr' },
      { v: '5', l: 'Mai' }, { v: '6', l: 'Jun' }, { v: '7', l: 'Jul' }, { v: '8', l: 'Ago' },
      { v: '9', l: 'Set' }, { v: '10', l: 'Out' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dez' }
  ];

  if (!isAuthenticated) return <LoginPage onLoginSuccess={configurarToken} />;
  if (loading && !data) return <DashboardSkeleton />;
  if (!data) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white flex items-center justify-center">Erro de Conexão.</div>;

  const anosDisponiveis = data.meta?.anos_disponiveis || [new Date().getFullYear()];

  return (
    <main className="min-h-screen font-sans transition-colors duration-300
        bg-slate-50 text-slate-900
        dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-[#1a103c] dark:to-black dark:text-white">
      
      {/* HEADER */}
      <header className="p-4 md:p-8 pb-0 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-pink-400">Tesouraria DeMolay</h1>
          <div className="flex items-center gap-3 mt-2">
             <ServerStatus />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/membros"><button className="btn-header bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"><Users className="w-4 h-4"/> MEMBROS</button></Link>
          <Link href="/eventos"><button className="btn-header bg-pink-600 text-white hover:bg-pink-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95"><PartyPopper className="w-4 h-4"/> EVENTOS</button></Link>
          <button onClick={handleOpenNew} className="btn-header bg-purple-600 text-white hover:bg-purple-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"><Plus className="w-4 h-4"/> NOVA</button>
          <button onClick={() => setIsReportOpen(true)} className="btn-header bg-emerald-600 text-white hover:bg-emerald-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"><FileText className="w-4 h-4"/> RELATÓRIO</button>
          
          <div className="h-8 w-px bg-slate-300 dark:bg-white/10 mx-1"></div>
          
          <ThemeToggle /> {/* Botão de Tema */}

          {/* BOTÃO DE LOGS (Adicionado) */}
          <button 
            onClick={() => setIsLogsOpen(true)} 
            className="p-2.5 rounded-xl transition-all border
            bg-white border-slate-200 text-amber-500 hover:bg-amber-50
            dark:bg-slate-800 dark:border-white/10 dark:text-amber-400 dark:hover:bg-slate-700"
            title="Logs de Auditoria"
          >
            <ShieldAlert className="w-5 h-5"/>
          </button>

          <button onClick={handleLogout} className="p-2.5 rounded-xl transition-all border
            bg-white border-slate-200 text-rose-500 hover:bg-rose-50
            dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/20"
            title="Sair"
          >
            <LogOut className="w-5 h-5"/>
          </button>

          <Link href="/settings">
            <button className="p-2.5 rounded-xl transition-all border
            bg-white border-slate-200 text-slate-600 hover:bg-slate-100
            dark:bg-slate-800 dark:border-white/10 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Configurações"
            >
                <Settings className="w-5 h-5"/>
            </button>
          </Link>
        </div>
      </header>

      <div className="px-4 md:px-8 pb-20">
        {/* --- BARRA DE FILTROS --- */}
        <div className="mb-8 p-3 rounded-2xl flex flex-col md:flex-row items-center gap-4 shadow-xl border
            bg-white/60 border-white/60 backdrop-blur-md
            dark:bg-white/[0.03] dark:border-white/10">
            
            <div className="flex items-center gap-2 px-2">
                <Filter className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filtros:</span>
            </div>

            {/* Dropdown de ANO */}
            <div className="relative group">
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full md:w-32 text-sm font-bold rounded-xl pl-10 pr-8 py-2.5 appearance-none outline-none cursor-pointer transition-all border
                  bg-white border-slate-200 text-slate-700 hover:bg-slate-50 focus:border-purple-500
                  dark:bg-white/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10 dark:focus:bg-slate-900"
                >
                    {anosDisponiveis.map((ano: number) => (
                        <option key={ano} value={ano} className="text-slate-800 dark:text-slate-200 dark:bg-slate-900">{ano}</option>
                    ))}
                </select>
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 pointer-events-none text-slate-400 dark:text-slate-400" />
                <ChevronDown className="absolute right-3 top-3 w-3 h-3 pointer-events-none text-slate-400 dark:text-slate-500" />
            </div>

            <div className="h-8 w-px hidden md:block bg-slate-200 dark:bg-white/10"></div>

            {/* Seletores de MÊS */}
            <div className="flex-1 w-full overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <div className="flex gap-1.5">
                    <button 
                      onClick={() => setSelectedMonth('')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                          selectedMonth === '' 
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
                          : 'bg-white border-transparent text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                      }`}
                    >
                      VISÃO ANUAL
                    </button>

                    {MESES.map((m) => (
                        <button
                          key={m.v}
                          onClick={() => setSelectedMonth(m.v)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                              selectedMonth === m.v
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25' 
                              : 'bg-white border-transparent text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                          }`}
                        >
                            {m.l}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* --- DASHBOARD CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card titulo="Saldo (Do Período)" valor={data.cards.saldo} icon={<Wallet className="w-8 h-8 text-blue-500" />} cor="blue" subtexto={selectedMonth ? 'Referente ao Mês' : 'Acumulado Anual'} />
          <Card titulo="Entradas" valor={data.cards.entradas} icon={<TrendingUp className="w-8 h-8 text-emerald-500" />} cor="emerald" subtexto="Neste período" />
          <Card titulo="Saídas" valor={data.cards.saidas} icon={<TrendingDown className="w-8 h-8 text-rose-500" />} cor="rose" subtexto="Neste período" />
        </div>

        {/* --- LINHA 2: POTES --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <PoteCard titulo="Caixa Administrativo" valor={data.cards.saldo_adm} icon={<Wallet className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />} cor="indigo" desc="Para contas, eventos e manutenções." />
          <PoteCard titulo="Fundo de Filantropia" valor={data.cards.saldo_filantropia} icon={<ShieldCheck className="w-6 h-6 text-amber-500 dark:text-amber-400" />} cor="amber" desc="Sagrado. Apenas para ações beneméritas." />
        </div>

        {/* --- GRÁFICOS --- */}
        <GraficosSection 
          data={data} 
          COLORS={COLORS} 
          viewMode={selectedMonth ? 'MENSAL' : 'ANUAL'} 
        />

        {/* --- TABELA --- */}
        <div className="rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border
            bg-white/60 border-white/60 backdrop-blur-xl
            dark:bg-white/[0.02] dark:border-white/10">
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-800 dark:text-white">
            <div className="p-2 rounded-xl bg-purple-100 border border-purple-200 dark:bg-purple-500/20 dark:border-purple-500/30">
              <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            Movimentações <span className="text-slate-500 text-sm ml-2 font-normal mt-1">{selectedMonth ? `em ${MESES.find(m => m.v === selectedMonth)?.l} de ${selectedYear}` : `em ${selectedYear}`}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider border-b 
                    text-slate-500 border-slate-200 dark:text-slate-500 dark:border-white/5">
                  <th className="pb-4 pl-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Descrição</th>
                  <th className="pb-4 font-medium">Cat.</th>
                  <th className="pb-4 font-medium">Resp.</th>
                  <th className="pb-4 font-medium text-right pr-4">Valor</th>
                  <th className="pb-4 text-right pr-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                {data.recentes.map((t: any) => (
                  <tr key={t.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border 
                        ${t.tipo==='ENTRADA'
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
                            {t.tipo}
                        </span>
                    </td>
                    <td className="py-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200">{t.nome}</div>
                        <div className="text-xs font-mono text-slate-400 dark:text-slate-500">{t.data_transacao}</div>
                    </td>
                    <td className="py-4">
                        <span className="px-2 py-1 rounded text-[10px] uppercase tracking-wide
                            bg-slate-100 border border-slate-200 text-slate-500
                            dark:bg-white/5 dark:border-white/10 dark:text-slate-300">
                            {t.categoria_display}
                        </span>
                    </td>
                    <td className="py-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border
                                bg-slate-200 text-slate-600 border-slate-300
                                dark:bg-slate-800 dark:text-slate-400 dark:border-white/10">
                                {t.responsavel_nome ? t.responsavel_nome.charAt(0).toUpperCase() : '?'}
                            </div>
                        </div>
                    </td>
                    <td className={`py-4 text-right pr-4 font-mono font-bold text-base 
                        ${t.tipo==='ENTRADA' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {t.tipo === 'SAIDA' ? '- ' : '+ '}{Number(t.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                    <td className="py-4 text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(t)} className="p-2 rounded-lg transition-colors
                            bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600
                            dark:bg-slate-800 dark:hover:bg-blue-500/20 dark:hover:text-blue-400"><Pencil className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg transition-colors
                            bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600
                            dark:bg-slate-800 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NewTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} transactionToEdit={transactionToEdit} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <LogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
    </main>
  );
}