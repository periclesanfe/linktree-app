import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  id,
  containerClassName = '',
  className = '',
  ...inputProps
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-[#3D3D3D]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`
          w-full px-4 py-3
          bg-white border rounded-xl
          text-[#3D3D3D] placeholder:text-[#A9A9A9]
          focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
          transition-all duration-200
          hover:border-[#E8A87C]/50
          ${error ? 'border-red-400' : 'border-[#E5DDD8]'}
          ${className}
        `}
        {...inputProps}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1 animate-shake">{error}</p>
      )}
    </div>
  );
};

export default FormInput;
