// src/pages/AdminPage.tsx
import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Tipagem para os nossos dados
interface Link {
  id: string;
  title: string;
  url: string;
}

const AdminPage = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await apiClient.get('/links');
        setLinks(response.data);
      } catch (error) {
        console.error("Erro ao buscar links:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Meu Painel</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
          Sair
        </button>
      </header>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Meus Links</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-bold">{link.title}</h3>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500">{link.url}</a>
                </div>
                <div className="space-x-2">
                  <button className="text-blue-500 hover:underline">Editar</button>
                  <button className="text-red-500 hover:underline">Deletar</button>
                </div>
              </div>
            ))}
            {links.length === 0 && <p>Você ainda não adicionou nenhum link.</p>}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;