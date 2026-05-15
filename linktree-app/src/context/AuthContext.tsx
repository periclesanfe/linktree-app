// src/context/AuthContext.tsx
import { createContext, useEffect, useState, useContext } from 'react';
import type { ReactNode } from 'react';
import apiClient from '../api/apiClient';

interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  background_image_url?: string | null;
  accent_color?: string | null;
}

// Define a estrutura do nosso contexto de autenticação
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o "Provedor" do contexto. É um componente que irá "envolver" nossa aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/me')
      .then((response) => {
        setUser(response.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };
  
  // Um valor booleano para facilitar a verificação se o usuário está logado
  const isAuthenticated = !!user;

  const authContextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Cria um "hook" customizado para facilitar o uso do nosso contexto
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
