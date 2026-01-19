import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

interface LinkTracker {
  id: string;
  name: string;
  clicks: number;
}

interface LinkTrackersModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  linkTitle: string;
}

const LinkTrackersModal: React.FC<LinkTrackersModalProps> = ({ isOpen, onClose, linkId, linkTitle }) => {
  const [trackers, setTrackers] = useState<LinkTracker[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTrackerName, setNewTrackerName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen && linkId) {
      fetchTrackers();
    }
  }, [isOpen, linkId]);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/links/${linkId}/trackers`);
      setTrackers(response.data);
    } catch (error) {
      console.error('Error fetching trackers:', error);
      toast.error('Erro ao carregar rastreadores.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackerName.trim()) return;

    try {
      setCreating(true);
      const response = await apiClient.post(`/links/${linkId}/trackers`, {
        name: newTrackerName
      });
      setTrackers([response.data, ...trackers]);
      setNewTrackerName('');
      toast.success('Rastreador criado!');
    } catch (error) {
      console.error('Error creating tracker:', error);
      toast.error('Erro ao criar rastreador.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza? Os cliques históricos serão mantidos, mas o link parará de rastrear novos cliques separadamente.')) return;
    
    try {
      await apiClient.delete(`/trackers/${id}`);
      setTrackers(trackers.filter(t => t.id !== id));
      toast.success('Rastreador removido.');
    } catch (error) {
      console.error('Error deleting tracker:', error);
      toast.error('Erro ao remover rastreador.');
    }
  };

  const getTrackerUrl = (trackerId: string) => {
    // Usar window.location.origin para construir a URL base do frontend
    // O backend redireciona /r/... então a URL final é a mesma do frontend + /r
    // Mas em dev local pode ser diferente. Em prod é https://meuhub.app.br/r/...
    const baseUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    // Se VITE_BACKEND_URL for vazio (prod), usa a origem.
    // Se for localhost:3000 (dev), usa isso.
    // A rota de redirect é no backend.
    
    // Ajuste fino: em produção o frontend está em meuhub.app.br e o backend responde em /api e /r
    // Então a URL base deve ser a do domínio principal
    const domain = 'https://meuhub.app.br'; // Hardcoded para garantir prod, ou usar window.location.origin
    
    return `${domain}/r/${linkId}?t=${trackerId}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Rastreamento de Links</h3>
            <p className="text-sm text-gray-500">Sublinks para: <span className="font-medium text-meuhub-primary">{linkTitle}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Create Form */}
          <form onSubmit={handleCreate} className="mb-8 bg-meuhub-cream/30 p-4 rounded-xl border border-meuhub-secondary/20">
            <label className="block text-sm font-medium text-gray-700 mb-2">Criar novo rastreador</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newTrackerName}
                onChange={(e) => setNewTrackerName(e.target.value)}
                placeholder="Ex: Instagram Stories, Influencer João..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-meuhub-primary focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={creating || !newTrackerName.trim()}
                className="px-6 py-2.5 bg-meuhub-primary text-white rounded-lg font-medium hover:bg-meuhub-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Crie um nome identificador para gerar uma URL única e rastrear cliques separadamente.
            </p>
          </form>

          {/* List */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              Rastreadores Ativos
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{trackers.length}</span>
            </h4>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-meuhub-primary"></div>
              </div>
            ) : trackers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Nenhum rastreador criado ainda.
              </div>
            ) : (
              trackers.map((tracker) => (
                <div key={tracker.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-bold text-gray-800 text-lg">{tracker.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                          ID: {tracker.id.slice(0, 8)}...
                        </span>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {tracker.clicks} cliques
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(tracker.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                      title="Excluir"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-600 truncate">
                      {getTrackerUrl(tracker.id)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(getTrackerUrl(tracker.id))}
                      className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkTrackersModal;
