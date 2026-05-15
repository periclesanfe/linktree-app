// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F5]">
        <div className="h-10 w-10 rounded-full border-4 border-[#E8A87C]/30 border-t-[#E8A87C] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Se não estiver autenticado, redireciona para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo da rota (no nosso caso, a AdminPage)
  return <Outlet />;
};

export default ProtectedRoute;
