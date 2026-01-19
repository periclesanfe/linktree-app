// src/components/LinkModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';
import LinkTypeSelector from './LinkTypeSelector';
import ImageCropper from './ImageCropper';
import type { LinkType } from './LinkTypeSelector';

interface LinkMetadata {
  phone?: string;
  message?: string;
  contact_name?: string;
  username?: string;
  email?: string;
  subject?: string;
  body?: string;
  video_id?: string;
  channel_id?: string;
}

interface Link {
  id: string;
  title: string;
  url: string;
  link_type?: string;
  metadata?: LinkMetadata;
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

// Utility function for phone mask (Brazilian format)
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, onSave, existingLink }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [linkType, setLinkType] = useState<LinkType>('website');
  const [metadata, setMetadata] = useState<LinkMetadata>({});
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverCropperOpen, setCoverCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingLink) {
      setTitle(existingLink.title);
      setUrl(existingLink.url);
      setLinkType((existingLink.link_type as LinkType) || 'website');
      setMetadata(existingLink.metadata || {});
      setCoverImagePreview(existingLink.cover_image_url || null);
    } else {
      setTitle('');
      setUrl('');
      setLinkType('website');
      setMetadata({});
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

  const handleCoverCropComplete = (croppedBlob: Blob) => {
    const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(croppedBlob));
  };

  const handleMetadataChange = (field: keyof LinkMetadata, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (field: 'phone', value: string) => {
    const formatted = formatPhone(value);
    setMetadata((prev) => ({ ...prev, [field]: formatted }));
  };

  const handleLinkTypeChange = (type: LinkType) => {
    setLinkType(type);
    // Reset metadata when changing type
    setMetadata({});
    setUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      
      // Build the final URL based on link type
      let finalUrl = url;
      if (linkType === 'whatsapp' && metadata.phone) {
        const phoneDigits = metadata.phone.replace(/\D/g, '');
        const message = metadata.message ? encodeURIComponent(metadata.message) : '';
        finalUrl = `https://wa.me/55${phoneDigits}${message ? `?text=${message}` : ''}`;
      } else if (linkType === 'instagram' && metadata.username) {
        const username = metadata.username.replace('@', '');
        finalUrl = `https://instagram.com/${username}`;
      } else if (linkType === 'email' && metadata.email) {
        const params = new URLSearchParams();
        if (metadata.subject) params.append('subject', metadata.subject);
        if (metadata.body) params.append('body', metadata.body);
        finalUrl = `mailto:${metadata.email}${params.toString() ? `?${params.toString()}` : ''}`;
      } else if (linkType === 'phone' && metadata.phone) {
        const phoneDigits = metadata.phone.replace(/\D/g, '');
        finalUrl = `tel:+55${phoneDigits}`;
      } else if (linkType === 'tiktok' && metadata.username) {
        const username = metadata.username.replace('@', '');
        finalUrl = `https://tiktok.com/@${username}`;
      }
      // youtube and website use the url field directly

      const linkData = {
        title,
        url: finalUrl,
        link_type: linkType,
        metadata,
      };

      if (existingLink) {
        response = await apiClient.put(`/links/${existingLink.id}`, linkData);
      } else {
        response = await apiClient.post('/links', linkData);
      }

      const savedLink = response.data;

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

  const renderDynamicFields = () => {
    const inputClasses = "w-full px-4 py-3 border-2 border-[#E5DDD8] rounded-lg focus:outline-none focus:border-[#E8A87C] transition-colors";
    const labelClasses = "block text-gray-700 font-medium mb-2";

    switch (linkType) {
      case 'website':
        return (
          <div>
            <label htmlFor="url" className={labelClasses}>
              URL de Destino
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClasses}
              placeholder="https://exemplo.com"
              required
            />
          </div>
        );

      case 'whatsapp':
        return (
          <>
            <div>
              <label htmlFor="phone" className={labelClasses}>
                Telefone (WhatsApp)
              </label>
              <input
                type="tel"
                id="phone"
                value={metadata.phone || ''}
                onChange={(e) => handlePhoneChange('phone', e.target.value)}
                className={inputClasses}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className={labelClasses}>
                Mensagem padrao (opcional)
              </label>
              <textarea
                id="message"
                value={metadata.message || ''}
                onChange={(e) => handleMetadataChange('message', e.target.value)}
                className={`${inputClasses} resize-none`}
                placeholder="Ola! Gostaria de saber mais..."
                rows={3}
              />
            </div>
          </>
        );

      case 'instagram':
        return (
          <div>
            <label htmlFor="username" className={labelClasses}>
              Usuario do Instagram
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                id="username"
                value={(metadata.username || '').replace('@', '')}
                onChange={(e) => handleMetadataChange('username', e.target.value)}
                className={`${inputClasses} pl-8`}
                placeholder="seu_usuario"
                required
              />
            </div>
          </div>
        );

      case 'email':
        return (
          <>
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={metadata.email || ''}
                onChange={(e) => handleMetadataChange('email', e.target.value)}
                className={inputClasses}
                placeholder="contato@exemplo.com"
                required
              />
            </div>
            <div>
              <label htmlFor="subject" className={labelClasses}>
                Assunto (opcional)
              </label>
              <input
                type="text"
                id="subject"
                value={metadata.subject || ''}
                onChange={(e) => handleMetadataChange('subject', e.target.value)}
                className={inputClasses}
                placeholder="Assunto do email"
              />
            </div>
            <div>
              <label htmlFor="body" className={labelClasses}>
                Corpo da mensagem (opcional)
              </label>
              <textarea
                id="body"
                value={metadata.body || ''}
                onChange={(e) => handleMetadataChange('body', e.target.value)}
                className={`${inputClasses} resize-none`}
                placeholder="Mensagem pre-definida..."
                rows={3}
              />
            </div>
          </>
        );

      case 'phone':
        return (
          <div>
            <label htmlFor="phone" className={labelClasses}>
              Numero de Telefone
            </label>
            <input
              type="tel"
              id="phone"
              value={metadata.phone || ''}
              onChange={(e) => handlePhoneChange('phone', e.target.value)}
              className={inputClasses}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
        );

      case 'youtube':
        return (
          <div>
            <label htmlFor="url" className={labelClasses}>
              URL do Video ou Canal
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClasses}
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Cole a URL completa do video ou canal
            </p>
          </div>
        );

      case 'tiktok':
        return (
          <div>
            <label htmlFor="username" className={labelClasses}>
              Usuario do TikTok
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
              <input
                type="text"
                id="username"
                value={(metadata.username || '').replace('@', '')}
                onChange={(e) => handleMetadataChange('username', e.target.value)}
                className={`${inputClasses} pl-8`}
                placeholder="seu_usuario"
                required
              />
            </div>
          </div>
        );

      default:
        return null;
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

            {/* Link Type Selector */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Tipo de Link</label>
              <LinkTypeSelector selected={linkType} onChange={handleLinkTypeChange} />
            </div>

            {/* Imagem de Capa */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Imagem de Capa</label>
              <div className="flex flex-col items-center gap-4">
                {coverImagePreview && (
                  <div className="w-full aspect-square max-w-[200px] rounded-2xl overflow-hidden border-4 border-[#E5DDD8] shadow-lg">
                    <img
                      src={coverImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCoverCropperOpen(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-meuhub-primary to-meuhub-accent text-meuhub-text rounded-lg hover:from-meuhub-accent hover:to-meuhub-primary transition-all font-medium shadow-md"
                >
                  {coverImagePreview ? 'Trocar Imagem' : 'Adicionar Imagem'}
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Imagem sera redimensionada para 400x400px
                </p>
              </div>
            </div>

            {/* Titulo */}
            <div>
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                Titulo
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#E5DDD8] rounded-lg focus:outline-none focus:border-[#E8A87C] transition-colors"
                placeholder="Ex: Meu Portfolio"
                required
              />
            </div>

            {/* Dynamic Fields based on link type */}
            {renderDynamicFields()}

            {/* Botoes */}
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
                className="flex-1 px-4 py-3 bg-[#E8A87C] hover:bg-[#d4956b] text-white rounded-lg transition-colors font-medium shadow-lg shadow-[#E8A87C]/30"
              >
                Salvar Link
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={coverCropperOpen}
        onClose={() => setCoverCropperOpen(false)}
        onCropComplete={handleCoverCropComplete}
        aspectRatio={1}
        title="Recortar Imagem de Capa"
        circularCrop={false}
      />
    </div>
  );
};

export default LinkModal;
