// src/components/LinkCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient'; // Importa nosso cliente de API

interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
}

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
  onCoverImageUpload: (id: string, file: File) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, onDelete, onCoverImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- NOVA LÓGICA DE ANÁLISE DE CLIQUES ---
  const [clickCount, setClickCount] = useState<number | null>(null);

  useEffect(() => {
    // Função para buscar os dados de clique da API
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get(`/analytics/${link.id}`);
        setClickCount(response.data.click_count);
      } catch (error) {
        console.error(`Erro ao buscar cliques para o link ${link.id}:`, error);
        setClickCount(0); // Define como 0 em caso de erro
      }
    };

    fetchAnalytics();
  }, [link.id]); // O useEffect será re-executado se o ID do link mudar

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onCoverImageUpload(link.id, event.target.files[0]);
    }
  };

  return (
    <div className="flex items-center p-4 border rounded-lg bg-gray-50 shadow-sm">
      <img 
        src={link.cover_image_url || 'https://via.placeholder.com/100x100?text=Capa'} 
        alt={`Capa para ${link.title}`} 
        className="w-20 h-20 object-cover rounded-md mr-4"
      />
      <div className="flex-grow">
        <h3 className="font-bold text-lg text-gray-800">{link.title}</h3>
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {link.url}
        </a>
        
        {/* --- NOVA SEÇÃO PARA EXIBIR CLIQUES --- */}
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {clickCount !== null ? (
            <span>{clickCount} cliques</span>
          ) : (
            <span className="text-xs">Carregando cliques...</span>
          )}
        </div>

      </div>
      <div className="flex-shrink-0 ml-4 flex flex-col space-y-2 items-end">
        <div>
          <button onClick={() => onEdit(link)} className="text-sm text-blue-500 hover:underline font-semibold">Editar</button>
          <span className="mx-1 text-gray-300">|</span>
          <button onClick={() => onDelete(link.id)} className="text-sm text-red-500 hover:underline font-semibold">Deletar</button>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">
            Trocar Capa
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkCard;