import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import { SOCIAL_PLATFORM_ICONS } from './icons/SocialIcons';
import ConfirmModal from './ConfirmModal';

interface SocialIcon {
  id: string;
  platform: string;
  url: string;
  display_order: number;
}

const VALID_PLATFORMS = [
  'instagram', 'twitter', 'facebook', 'tiktok', 
  'youtube', 'linkedin', 'github', 'whatsapp', 
  'telegram', 'pinterest', 'twitch', 'discord', 
  'spotify', 'snapchat', 'threads', 'email'
];

const SocialIconsPanel: React.FC = () => {
  const [icons, setIcons] = useState<SocialIcon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<SocialIcon | null>(null);
  
  // Form state
  const [platform, setPlatform] = useState(VALID_PLATFORMS[0]);
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm delete modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    iconId: '',
    platform: ''
  });

  useEffect(() => {
    fetchIcons();
  }, []);

  const fetchIcons = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/socials');
      setIcons(response.data);
    } catch (error) {
      console.error('Error fetching social icons:', error);
      toast.error('Erro ao carregar ícones sociais.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (icon?: SocialIcon) => {
    if (icon) {
      setEditingIcon(icon);
      setPlatform(icon.platform);
      setUrl(icon.url);
    } else {
      setEditingIcon(null);
      setPlatform(VALID_PLATFORMS[0]);
      setUrl('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIcon(null);
    setUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se já existe ícone dessa plataforma (apenas para criação)
    if (!editingIcon && icons.some(icon => icon.platform === platform)) {
        toast.error(`Você já possui um ícone do ${platform}. Edite o existente.`);
        return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingIcon) {
        const response = await apiClient.put(`/socials/${editingIcon.id}`, { url });
        setIcons(icons.map(i => i.id === editingIcon.id ? response.data : i));
        toast.success('Ícone atualizado com sucesso!');
      } else {
        const response = await apiClient.post('/socials', { platform, url });
        setIcons([...icons, response.data]);
        toast.success('Ícone adicionado com sucesso!');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving icon:', error);
      toast.error('Erro ao salvar ícone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (icon: SocialIcon) => {
    setConfirmModal({
      isOpen: true,
      iconId: icon.id,
      platform: icon.platform
    });
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/socials/${confirmModal.iconId}`);
      setIcons(icons.filter(i => i.id !== confirmModal.iconId));
      toast.success('Ícone removido com sucesso!');
    } catch (error) {
      console.error('Error deleting icon:', error);
      toast.error('Erro ao remover ícone.');
    } finally {
      setConfirmModal({ isOpen: false, iconId: '', platform: '' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-meuhub-text flex items-center gap-2">
            <svg className="w-5 h-5 text-meuhub-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Redes Sociais (Rodapé)
          </h3>
          <p className="text-sm text-meuhub-text/60 mt-1">
            Ícones pequenos que aparecem no final do seu perfil. Ideal para contato rápido.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-white border-2 border-meuhub-secondary/30 text-meuhub-text px-4 py-2 rounded-lg hover:bg-meuhub-cream transition-colors font-medium flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Ícone
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-meuhub-primary"></div>
        </div>
      ) : icons.length === 0 ? (
        <div className="bg-meuhub-cream/30 border-2 border-dashed border-meuhub-secondary/20 rounded-xl p-8 text-center">
          <p className="text-meuhub-text/60">Nenhum ícone social adicionado ainda.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="text-meuhub-primary font-medium hover:underline mt-2"
          >
            Adicionar o primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {icons.map((icon) => {
            const IconComponent = SOCIAL_PLATFORM_ICONS[icon.platform] || SOCIAL_PLATFORM_ICONS['website'];
            return (
              <div 
                key={icon.id}
                className="bg-white border border-meuhub-secondary/20 rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all group relative"
              >
                <div className="w-10 h-10 rounded-full bg-meuhub-cream/50 flex items-center justify-center text-meuhub-text group-hover:scale-110 transition-transform">
                  <IconComponent size={20} />
                </div>
                <span className="text-sm font-medium capitalize text-meuhub-text">
                  {icon.platform}
                </span>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => handleOpenModal(icon)}
                    className="p-1.5 bg-white rounded-md shadow-sm text-gray-500 hover:text-blue-500 hover:bg-blue-50"
                    title="Editar"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(icon)}
                    className="p-1.5 bg-white rounded-md shadow-sm text-gray-500 hover:text-red-500 hover:bg-red-50"
                    title="Remover"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Adição/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-meuhub-text">
                {editingIcon ? 'Editar Ícone Social' : 'Adicionar Ícone Social'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Aviso visual */}
              <div className="bg-blue-50 text-blue-700 text-sm p-3 rounded-lg flex gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Este link aparecerá apenas como um ícone pequeno no rodapé do seu perfil.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plataforma
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  disabled={!!editingIcon} // Não permite mudar plataforma na edição
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meuhub-primary focus:border-transparent outline-none bg-white"
                >
                  {VALID_PLATFORMS.map(p => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Perfil
                </label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={`https://${platform}.com/seu-usuario`}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meuhub-primary focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-meuhub-primary text-white rounded-xl font-medium hover:bg-meuhub-accent transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, iconId: '', platform: '' })}
        onConfirm={confirmDelete}
        title="Remover Ícone"
        message={`Tem certeza que deseja remover o ícone do ${confirmModal.platform}?`}
        type="danger"
      />
    </div>
  );
};

export default SocialIconsPanel;
