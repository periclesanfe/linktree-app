import axios from 'axios';

const apiClient = axios.create({
  // Em produção, usa URL relativa para o Nginx rotear.
  // Em desenvolvimento, usa localhost:3000.
  baseURL: import.meta.env.VITE_BACKEND_URL !== undefined 
    ? `${import.meta.env.VITE_BACKEND_URL}/api` 
    : '/api',
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