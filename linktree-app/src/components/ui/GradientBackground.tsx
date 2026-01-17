import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        py-12 px-6 lg:py-0 lg:px-12
        lg:w-1/2 lg:min-h-screen
        bg-gradient-to-br from-[#FCEEE6] via-[#F5D5C3] to-[#E8A87C]
        overflow-hidden
        ${className}
      `}
    >
      {/* Decorative circles */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E8A87C]/30 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-float" />

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
};

export default GradientBackground;
