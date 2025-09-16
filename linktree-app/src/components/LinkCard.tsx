// src/components/LinkCard.tsx
import React from 'react';

interface Link {
  id: string;
  title: string;
  url: string;
}

interface LinkCardProps {
  link: Link;
  onEdit: (link: Link) => void;
  onDelete: (id: string) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 shadow-sm">
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
      </div>
      <div className="flex-shrink-0 ml-4 space-x-2">
        <button onClick={() => onEdit(link)} className="text-blue-500 hover:underline font-semibold">Editar</button>
        <button onClick={() => onDelete(link.id)} className="text-red-500 hover:underline font-semibold">Deletar</button>
      </div>
    </div>
  );
};

export default LinkCard;