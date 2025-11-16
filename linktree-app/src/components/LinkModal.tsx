// src/components/LinkModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
  color_hash?: string;
  background_color?: string;
  border_color?: string;
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
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Se estamos editando um link, preenche o formulário com os dados existentes
    if (existingLink) {
      setTitle(existingLink.title);
      setUrl(existingLink.url);
      setCoverImagePreview(existingLink.cover_image_url || null);
    } else {
      // Se estamos criando, limpa o formulário
      setTitle('');
      setUrl('');
      setCoverImage(null);
      setCoverImagePreview(null);
    }
  }, [existingLink, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      const linkData = { title, url };

      if (existingLink) {
        // Modo de Edição (UPDATE)
        response = await apiClient.put(`/links/${existingLink.id}`, linkData);
      } else {
        // Modo de Criação (CREATE)
        response = await apiClient.post('/links', linkData);
      }

      const savedLink = response.data;

      // Se tem imagem de capa, faz upload
      if (coverImage) {
        const formData = new FormData();
        formData.append('coverImage', coverImage);
        const imageResponse = await apiClient.post(`/links/${savedLink.id}/cover-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onSave(imageResponse.data);
      } else {
        onSave(savedLink);
      }
    } catch (err) {
      setError('Ocorreu um erro ao salvar o link. Verifique os dados.');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop com blur */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {existingLink ? 'Editar Link' : 'Novo Link'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Imagem de Capa */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Imagem de Capa</label>
              <div className="flex flex-col items-center gap-4">
                {coverImagePreview && (
                  <div className="w-full aspect-square max-w-[200px] rounded-2xl overflow-hidden border-4 border-gray-200 shadow-lg">
                    <img
                      src={coverImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  {coverImagePreview ? 'Trocar Imagem' : 'Adicionar Imagem'}
                </button>
              </div>
            </div>

            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Título
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ex: Meu Portfolio"
                required
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-gray-700 font-medium mb-2">
                URL de Destino
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="https://exemplo.com"
                required
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/30"
              >
                Salvar Link
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;