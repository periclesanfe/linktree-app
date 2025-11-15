// src/components/LinkModal.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

interface Link {
  id: string;
  title: string;
  url: string;
  color_hash?: string;
}

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (link: Link) => void;
  existingLink: Link | null;
}

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, onSave, existingLink }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState('#6366f1'); // Cor padrão (indigo)
  const [error, setError] = useState('');

  useEffect(() => {
    // Se estamos editando um link, preenche o formulário com os dados existentes
    if (existingLink) {
      setTitle(existingLink.title);
      setUrl(existingLink.url);
      setColor(existingLink.color_hash || '#6366f1');
    } else {
      // Se estamos criando, limpa o formulário
      setTitle('');
      setUrl('');
      setColor('#6366f1');
    }
  }, [existingLink, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      const linkData = { title, url, color_hash: color };
      if (existingLink) {
        // Modo de Edição (UPDATE)
        response = await apiClient.put(`/links/${existingLink.id}`, linkData);
      } else {
        // Modo de Criação (CREATE)
        response = await apiClient.post('/links', linkData);
      }
      onSave(response.data); // Envia o link salvo de volta para a página principal
    } catch (err) {
      setError('Ocorreu um erro ao salvar o link. Verifique os dados.');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{existingLink ? 'Editar Link' : 'Adicionar Novo Link'}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 mb-2">Título</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="url" className="block text-gray-700 mb-2">URL</label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="color" className="block text-gray-700 mb-2">Cor do Link</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 border rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{color}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkModal;