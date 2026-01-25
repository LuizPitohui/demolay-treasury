import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Verifique se a porta é 8000 mesmo
});

// INTERCEPTADOR: O "Carteiro" que cola o selo (Token) na carta antes de enviar
api.interceptors.request.use(async (config) => {
  // Tenta pegar o token do LocalStorage (onde salvaremos no Login)
  // Nota: Se você estiver usando cookies (nookies), mude aqui.
  const token = typeof window !== 'undefined' ? localStorage.getItem('nexus_token') : null;

  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }

  return config;
});

export default api;