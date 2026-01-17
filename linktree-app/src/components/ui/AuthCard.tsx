import React from 'react';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  children,
  className = '',
  title,
  subtitle,
}) => {
  return (
    <div
      className={`
        w-full max-w-md mx-auto
        bg-[#FDF8F5] 
        rounded-2xl
        shadow-xl shadow-black/5
        p-8 lg:p-10
        animate-fade-in-up animation-delay-200
        ${className}
      `}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div className="text-center lg:text-left mb-8">
          {title && (
            <h2 className="text-2xl lg:text-3xl font-bold text-[#3D3D3D] mb-2">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-[#6B6B6B] text-sm lg:text-base">{subtitle}</p>
          )}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
};

export default AuthCard;
