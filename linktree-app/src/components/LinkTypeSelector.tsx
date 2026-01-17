// src/components/LinkTypeSelector.tsx
import React from 'react';
import {
  WebsiteIcon,
  WhatsAppIcon,
  InstagramIcon,
  EmailIcon,
  PhoneIcon,
  YouTubeIcon,
  TikTokIcon,
} from './icons/SocialIcons';

// Constante com os tipos válidos (para uso em runtime)
export const LINK_TYPES = ['website', 'whatsapp', 'instagram', 'email', 'phone', 'youtube', 'tiktok'] as const;

// Tipo derivado da constante
export type LinkType = typeof LINK_TYPES[number];

interface LinkTypeSelectorProps {
  selected: LinkType;
  onChange: (type: LinkType) => void;
}

interface LinkTypeOption {
  type: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const linkTypes: LinkTypeOption[] = [
  { type: 'website', label: 'Site', icon: WebsiteIcon },
  { type: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon },
  { type: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { type: 'email', label: 'Email', icon: EmailIcon },
  { type: 'phone', label: 'Telefone', icon: PhoneIcon },
  { type: 'youtube', label: 'YouTube', icon: YouTubeIcon },
  { type: 'tiktok', label: 'TikTok', icon: TikTokIcon },
];

const LinkTypeSelector: React.FC<LinkTypeSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {linkTypes.map(({ type, label, icon: Icon }) => {
        const isSelected = selected === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type as LinkType)}
            className={`
              flex flex-col items-center justify-center gap-2 p-4 rounded-xl
              border-2 transition-all duration-200 cursor-pointer
              ${
                isSelected
                  ? 'border-[#E8A87C] bg-[#FDF8F5] shadow-md'
                  : 'border-gray-200 bg-white hover:border-[#E8A87C]/50 hover:bg-[#FDF8F5]/50'
              }
            `}
          >
            <Icon
              className={`w-6 h-6 ${
                isSelected ? 'text-[#E8A87C]' : 'text-gray-500'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isSelected ? 'text-[#E8A87C]' : 'text-gray-600'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default LinkTypeSelector;
