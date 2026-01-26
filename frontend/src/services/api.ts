import axios from 'axios';

// 1. URL DINÂMICA (Ajustada para a nova porta 8050)
// Se o Docker falhar em ler o .env, ele vai usar o 8050 como padrão seguro.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8050/api';

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
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        console.warn('Sessão expirada. Redirecionando para login...');
        
        localStorage.removeItem('nexus_token');
        
        if (window.location.pathname !== '/') {
            window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;