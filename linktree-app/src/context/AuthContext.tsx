// src/context/AuthContext.tsx
import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

// Define a estrutura do nosso contexto de autenticação
interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cria o "Provedor" do contexto. É um componente que irá "envolver" nossa aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // O estado 'token' começa com o valor que estiver salvo no localStorage
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };
  
  // Um valor booleano para facilitar a verificação se o usuário está logado
  const isAuthenticated = !!token;

  const authContextValue = {
    token,
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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};