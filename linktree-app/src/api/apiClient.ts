import axios from 'axios';

const apiClient = axios.create({
  // Usa a variável de ambiente, com um fallback para segurança.
  // Adicionamos /api aqui para não precisar repetir em cada chamada.
  baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`,
});

// Interceptor para adicionar o token JWT em todas as requisições
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;