import React from 'react';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
}

const sizeClasses: Record<LogoSize, { logo: string; text: string }> = {
  sm: { logo: 'w-8 h-8', text: 'text-lg' },
  md: { logo: 'w-12 h-12', text: 'text-xl' },
  lg: { logo: 'w-24 h-24 lg:w-36 lg:h-36', text: 'text-3xl lg:text-5xl' },
  xl: { logo: 'w-36 h-36 lg:w-48 lg:h-48', text: 'text-4xl lg:text-6xl' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const { logo, text } = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src="/logo_transparente.png"
        alt="MeuHub Logo"
        className={`${logo} drop-shadow-lg hover:scale-105 transition-transform duration-300`}
      />
      {showText && (
        <h1 className={`${text} font-bold text-[#3D3D3D] mt-2 tracking-tight`}>
          MeuHub
        </h1>
      )}
    </div>
  );
};

export default Logo;
