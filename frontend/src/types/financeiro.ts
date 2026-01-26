export interface Transacao {
    id: number;
    tipo: 'ENTRADA' | 'SAIDA';
    valor: number;
    nome: string;
    categoria: string;
    categoria_display: string;
    data_transacao: string;
    responsavel_nome: string;
}

export interface DashboardData {
    cards: {
        saldo: number;
        entradas: number;
        saidas: number;
        // --- NOVOS CAMPOS ---
        saldo_adm: number;
        saldo_filantropia: number;
    };
    graficos: {
        por_categoria: any[];
        fluxo_mensal: any[];
    };
    recentes: Transacao[];
}