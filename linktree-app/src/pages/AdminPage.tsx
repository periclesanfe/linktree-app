// src/pages/AdminPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LinkModal from '../components/LinkModal';
import LinkCard from '../components/LinkCard';

// Tipagens para nossos dados
interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
}

interface User {
  id: string;
  display_name: string;
  bio: string;
  profile_image_url: string | null;
}

const AdminPage = () => {
  // Estados existentes
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  // --- NOVOS ESTADOS PARA O PERFIL E UPLOAD ---
  const [user, setUser] = useState<User | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { logout } = useAuth();
  const navigate = useNavigate();

  // Busca todos os dados necessários quando a página carrega
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Busca os dados do usuário e os links em paralelo
        const [userResponse, linksResponse] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get('/links')
        ]);
        setUser(userResponse.data);
        setLinks(linksResponse.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // --- NOVAS FUNÇÕES PARA UPLOAD DE IMAGEM ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

    const handleCoverImageUpload = async (linkId: string, file: File) => {
        const formData = new FormData();
        formData.append('coverImage', file);

        try {
            // CORREÇÃO: Mude de .put para .post para corresponder à rota
            const response = await apiClient.post(`/links/${linkId}/cover-image`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Atualiza a lista de links com a nova URL da imagem
            setLinks(links.map(link => link.id === linkId ? response.data : link));
            alert('Imagem de capa atualizada com sucesso!');
        } catch (error) {
            console.error('Erro ao fazer upload da capa:', error);
            alert('Falha no upload da capa.');
        }
    };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const response = await apiClient.post('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Atualiza o estado do usuário com a nova URL da imagem para refletir na UI
      setUser(currentUser => currentUser ? { ...currentUser, profile_image_url: response.data.url } : null);
      setSelectedFile(null); // Limpa o arquivo selecionado
      alert('Imagem de perfil atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Falha no upload da imagem.');
    }
  };

  // Funções existentes
  const handleLogout = () => { logout(); navigate('/login'); };
  const handleOpenModalForCreate = () => { setEditingLink(null); setIsModalOpen(true); };
  const handleOpenModalForEdit = (link: Link) => { setEditingLink(link); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEditingLink(null); };
  const handleSaveLink = (savedLink: Link) => {
    if (editingLink) {
      setLinks(links.map(link => link.id === savedLink.id ? savedLink : link));
    } else {
      setLinks(prevLinks => [...prevLinks, savedLink]);
    }
    handleCloseModal();
  };
  const handleDeleteLink = async (id: string) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await apiClient.delete(`/links/${id}`);
        setLinks(links.filter(link => link.id !== id));
      } catch (error) {
        console.error("Erro ao deletar link:", error);
      }
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Meu Painel</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
          Sair
        </button>
      </header>

      {/* --- NOVA SEÇÃO DE PERFIL --- */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4">Meu Perfil</h2>
        <div className="flex items-center space-x-6">
          <img
            src={user?.profile_image_url || 'https://via.placeholder.com/150'}
            alt="Foto de Perfil"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
          <div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" // O input fica escondido
            />
            <button
              onClick={() => fileInputRef.current?.click()} // O botão ativa o input
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Trocar Imagem
            </button>
            {selectedFile && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Arquivo selecionado: {selectedFile.name}</p>
                <button
                  onClick={handleImageUpload}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2"
                >
                  Salvar Imagem
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seção de Links (sem alterações na lógica) */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Meus Links</h2>
          <button onClick={handleOpenModalForCreate} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            Adicionar Novo Link
          </button>
        </div>
       <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link) => (
              <LinkCard 
                key={link.id} 
                link={link} 
                onEdit={handleOpenModalForEdit}
                onDelete={handleDeleteLink}
                // Passa a nova função para o LinkCard
                onCoverImageUpload={handleCoverImageUpload}
              />
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Você ainda não adicionou nenhum link.</p>
          )}
        </div>
      </section>

      <LinkModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveLink} existingLink={editingLink} />
    </div>
  );
};

export default AdminPage;