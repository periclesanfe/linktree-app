import React from 'react';

interface PrimaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'solid' | 'outline';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  loading = false,
  children,
  disabled,
  fullWidth = true,
  variant = 'solid',
  className = '',
  ...buttonProps
}) => {
  const isDisabled = disabled || loading;

  const baseClasses = `
    py-3.5 px-6
    font-semibold rounded-xl
    transition-all duration-200
    transform hover:scale-[1.02] active:scale-[0.98]
    disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
  `;

  const variantClasses = {
    solid: `
      bg-[#E8A87C] hover:bg-[#D4956B] active:bg-[#C4865C]
      text-white
      shadow-lg shadow-[#E8A87C]/25 hover:shadow-xl hover:shadow-[#E8A87C]/30
    `,
    outline: `
      bg-transparent border-2 border-[#E8A87C]
      text-[#E8A87C] hover:text-white hover:bg-[#E8A87C]
    `,
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${widthClass}
        ${className}
      `}
      {...buttonProps}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Carregando...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;
