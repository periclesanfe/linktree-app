// src/pages/AdminPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import LinkModal from '../components/LinkModal';
import LinkCard from '../components/LinkCard';
import ConfirmModal from '../components/ConfirmModal';

// Tipagens para nossos dados
interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
}

interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  profile_image_url: string | null;
  background_image_url: string | null;
  accent_color: string | null;
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
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState<File | null>(null);
  const [accentColor, setAccentColor] = useState<string>('#6366f1');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundFileInputRef = useRef<HTMLInputElement>(null);

  // Estados para modal de confirmação
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
        setAccentColor(userResponse.data.accent_color || '#6366f1');
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

  const handleBackgroundFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedBackgroundFile(event.target.files[0]);
    }
  };


  const handleImageUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    const toastId = toast.loading('Enviando foto de perfil...');

    try {
      const response = await apiClient.post('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(currentUser => currentUser ? { ...currentUser, profile_image_url: response.data.url } : null);
      setSelectedFile(null);
      toast.success('Foto de perfil atualizada!', { id: toastId });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Não foi possível atualizar a foto.', { id: toastId });
    }
  };

  const handleBackgroundImageUpload = async () => {
    if (!selectedBackgroundFile) return;

    const formData = new FormData();
    formData.append('backgroundImage', selectedBackgroundFile);

    const toastId = toast.loading('Enviando imagem de fundo...');

    try {
      const response = await apiClient.post('/users/me/background-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser(currentUser => currentUser ? { ...currentUser, background_image_url: response.data.url } : null);
      setSelectedBackgroundFile(null);
      toast.success('Imagem de fundo atualizada!', { id: toastId });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem de background:', error);
      toast.error('Não foi possível atualizar a imagem.', { id: toastId });
    }
  };

  const handleAccentColorUpdate = async () => {
    const toastId = toast.loading('Salvando cor...');

    try {
      const response = await apiClient.put('/users/me/accent-color', { accent_color: accentColor });
      setUser(currentUser => currentUser ? { ...currentUser, accent_color: response.data.accent_color } : null);
      toast.success('Cor de destaque atualizada!', { id: toastId });
    } catch (error) {
      console.error('Erro ao atualizar cor de destaque:', error);
      toast.error('Não foi possível salvar a cor.', { id: toastId });
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
  const handleDeleteLink = (id: string) => {
    const link = links.find(l => l.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'Deletar Link',
      message: `Tem certeza que deseja deletar "${link?.title}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        const toastId = toast.loading('Deletando link...');
        try {
          await apiClient.delete(`/links/${id}`);
          setLinks(links.filter(link => link.id !== id));
          toast.success('Link deletado com sucesso!', { id: toastId });
        } catch (error) {
          console.error("Erro ao deletar link:", error);
          toast.error('Não foi possível deletar o link.', { id: toastId });
        }
      }
    });
  };

  // Funções para Drag and Drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));

    if (dragIndex === dropIndex) return;

    const newLinks = [...links];
    const [draggedItem] = newLinks.splice(dragIndex, 1);
    newLinks.splice(dropIndex, 0, draggedItem);

    // Atualiza o display_order de todos os links
    const updatedLinks = newLinks.map((link, index) => ({
      ...link,
      display_order: index
    }));

    setLinks(updatedLinks);

    // Envia a nova ordem para o backend
    try {
      await apiClient.put('/links/reorder', {
        links: updatedLinks.map((link, index) => ({ id: link.id, display_order: index }))
      });
      toast.success('Ordem dos links atualizada!');
    } catch (error) {
      console.error('Erro ao reordenar links:', error);
      toast.error('Não foi possível salvar a nova ordem.');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
      />

      <div className="container mx-auto p-4 sm:p-8 max-w-6xl">
        {/* Header Melhorado */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Meu Painel
              </h1>
              <p className="text-gray-600 mt-1">Gerencie seus links e perfil</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(`/profile/${user?.username}`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Perfil
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl transition-all font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Seção de Perfil Melhorada */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Meu Perfil</h2>
          </div>

        {/* Foto de Perfil */}
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-medium mb-3">Foto de Perfil</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <img
              src={user?.profile_image_url || 'https://via.placeholder.com/150'}
              alt="Foto de Perfil"
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-200 flex-shrink-0"
            />
            <div className="w-full sm:w-auto">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
              >
                Trocar Imagem
              </button>
              {selectedFile && (
                <div className="mt-2">
                  <p className="text-xs sm:text-sm text-gray-600 break-all">
                    Arquivo: {selectedFile.name}
                  </p>
                  <button
                    onClick={handleImageUpload}
                    className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mt-2 transition text-sm sm:text-base"
                  >
                    Salvar Imagem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personalização do Perfil Público */}
        <div className="border-t pt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Personalização do Perfil Público
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Imagem de Background */}
            <div className="bg-gray-50 p-5 rounded-xl">
              <h4 className="text-base font-medium mb-4 text-gray-700">Imagem de Fundo</h4>
              <div className="space-y-4">
                <div
                  className="w-full h-40 rounded-lg border-2 border-gray-300 bg-cover bg-center shadow-md"
                  style={{
                    backgroundImage: user?.background_image_url
                      ? `url(${user.background_image_url})`
                      : 'linear-gradient(to right, #6366f1, #8b5cf6)'
                  }}
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={backgroundFileInputRef}
                    onChange={handleBackgroundFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => backgroundFileInputRef.current?.click()}
                    className="w-full bg-white border-2 border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
                  >
                    {user?.background_image_url ? 'Trocar Imagem de Fundo' : 'Adicionar Imagem de Fundo'}
                  </button>
                  {selectedBackgroundFile && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2 truncate">
                        📎 {selectedBackgroundFile.name}
                      </p>
                      <button
                        onClick={handleBackgroundImageUpload}
                        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                      >
                        Salvar Imagem
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cor de Destaque Global */}
            <div className="bg-gray-50 p-5 rounded-xl">
              <h4 className="text-base font-medium mb-4 text-gray-700">Cor de Destaque</h4>
              <div className="space-y-4">
                {/* Preview da cor */}
                <div
                  className="w-full h-40 rounded-lg border-2 border-gray-300 shadow-md flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <div className="text-center">
                    <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Cor Atual</p>
                      <p className="text-xl font-bold font-mono" style={{ color: accentColor }}>
                        {accentColor.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-12 w-20 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="#6366f1"
                    />
                  </div>
                  <button
                    onClick={handleAccentColorUpdate}
                    className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                  >
                    Salvar Cor
                  </button>
                  <p className="text-xs text-gray-600 text-center">
                    Esta cor será aplicada a todos os links
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Seção de Links Melhorada */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Meus Links</h2>
                <p className="text-sm text-gray-600">{links.length} {links.length === 1 ? 'link' : 'links'} cadastrados</p>
              </div>
            </div>
            <button
              onClick={handleOpenModalForCreate}
              className="w-full sm:w-auto inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Adicionar Link
            </button>
          </div>
       <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link, index) => (
              <div
                key={link.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="cursor-move"
              >
                <LinkCard
                  link={link}
                  onEdit={handleOpenModalForEdit}
                  onDelete={handleDeleteLink}
                />
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Você ainda não adicionou nenhum link.</p>
          )}
        </div>
        </section>

        <LinkModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveLink} existingLink={editingLink} />
      </div>
    </div>
  );
};

export default AdminPage;