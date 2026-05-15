import axios from 'axios';

const apiClient = axios.create({
  // Em produção, usa URL relativa para o Nginx rotear.
  // Em desenvolvimento, usa localhost:3000.
  baseURL: import.meta.env.VITE_BACKEND_URL !== undefined 
    ? `${import.meta.env.VITE_BACKEND_URL}/api` 
    : '/api',
  withCredentials: true,
});

export default apiClient;
