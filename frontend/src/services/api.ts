import axios from 'axios';

// 1. URL DINÂMICA
// Tenta ler do ambiente (Docker/Vercel). Se não existir, usa localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

// 2. INTERCEPTADOR DE REQUISIÇÃO (Envia o Token)
api.interceptors.request.use(async (config) => {
  // Verifica se estamos no navegador (Client Side) antes de acessar localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('nexus_token');
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
  }

  return config;
});

// 3. INTERCEPTADOR DE RESPOSTA (Trata Token Expirado)
api.interceptors.response.use(
  (response) => {
    // Se deu tudo certo, apenas retorna os dados
    return response;
  },
  (error) => {
    // Se deu erro, verificamos se foi erro 401 (Não Autorizado)
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        console.warn('Sessão expirada. Redirecionando para login...');
        
        // Remove o token inválido
        localStorage.removeItem('nexus_token');
        
        // Redireciona para a home (Login) se não estiver lá
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;