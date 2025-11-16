// src/components/LinkCard.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import AnalyticsModal from './AnalyticsModal';

interface Link {
  id: string;
  title: string;
  url: string;
  cover_image_url?: string | null;
  color_hash?: string | null;
  background_color?: string | null;
  border_color?: string | null;
}

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, onDelete }) => {
  const [clickCount, setClickCount] = useState<number | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await apiClient.get(`/analytics/links/${link.id}`);
        setClickCount(response.data.totalClicks);
      } catch (error) {
        console.error(`Erro ao buscar cliques para o link ${link.id}:`, error);
        setClickCount(0);
      }
    };

    fetchAnalytics();
  }, [link.id]);

  return (
    <>
      <div className="group bg-white p-4 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
        <div className="flex gap-4">
          {/* Imagem de Capa */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 shadow-md group-hover:scale-105 transition-transform duration-300">
              <img
                src={link.cover_image_url || 'https://via.placeholder.com/100x100?text=📷'}
                alt={`Capa para ${link.title}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-800 truncate mb-1">
              {link.title}
            </h3>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline block truncate mb-2"
            >
              {link.url}
            </a>

            {/* Analytics Badge - Clicável */}
            <button
              onClick={() => setShowAnalytics(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 group/analytics border border-blue-100"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">
                {clickCount !== null ? (
                  <>{clickCount} {clickCount === 1 ? 'clique' : 'cliques'}</>
                ) : (
                  'Carregando...'
                )}
              </span>
              <svg className="w-4 h-4 text-blue-500 group-hover/analytics:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 justify-center">
            <button
              onClick={() => onEdit(link)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onDelete(link.id)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Deletar
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        linkId={link.id}
        linkTitle={link.title}
      />
    </>
  );
};

export default LinkCard;