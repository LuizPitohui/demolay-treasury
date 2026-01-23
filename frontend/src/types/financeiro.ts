export interface Transacao {
    id: number;
    tipo: 'ENTRADA' | 'SAIDA';
    tipo_display: string;
    categoria_display: string;
    valor: string;
    nome: string;
    descricao: string;
    data_transacao: string;
    responsavel_nome: string;
}

export interface DashboardData {
    cards: {
        saldo: number;
        entradas: number;
        saidas: number;
    };
    graficos: {
        por_categoria: Array<{ categoria: string; total: number }>;
        fluxo_mensal: Array<{ mes: string; tipo: string; total: number }>;
    };
    recentes: Transacao[];
}