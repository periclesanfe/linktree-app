// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  inviteCode?: string;
}

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!username.trim()) {
      newErrors.username = 'Nome de usuario e obrigatorio';
    } else if (username.length < 3) {
      newErrors.username = 'Minimo 3 caracteres';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email e obrigatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email invalido';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Senha e obrigatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Minimo 6 caracteres';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas nao coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');

    if (!validateForm()) {
      showToast('Corrija os erros no formulario', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/register', { 
        username, 
        email, 
        password, 
        inviteCode: inviteCode.trim() || undefined 
      });
      setSuccess('Conta criada com sucesso! Redirecionando...');
      showToast('Conta criada com sucesso!', 'success');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { msg?: string } } };
      const errorMsg = error.response?.data?.msg || 'Erro ao criar conta. Tente novamente.';
      setApiError(errorMsg);
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding Area - Left Side (Desktop) / Top (Mobile) */}
      <div 
        className="
          relative flex flex-col items-center justify-center 
          py-12 px-6 lg:py-0 lg:px-12
          lg:w-1/2 lg:min-h-screen
          bg-gradient-to-br from-[#FCEEE6] via-[#F5D5C3] to-[#E8A87C]
          overflow-hidden
        "
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E8A87C]/30 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-10 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-float" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
          {/* Logo */}
          <div className="mb-6 lg:mb-8 animate-scale-in">
            <img 
              src="/logo_transparente.png" 
              alt="MeuHub Logo" 
              className="w-24 h-24 lg:w-36 lg:h-36 drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
          
          {/* Brand Name */}
          <h1 className="text-3xl lg:text-5xl font-bold text-[#3D3D3D] mb-3 lg:mb-4 tracking-tight">
            MeuHub
          </h1>
          
          {/* Tagline */}
          <p className="text-[#5A5A5A] text-base lg:text-lg max-w-xs lg:max-w-sm leading-relaxed">
            Junte-se a nos e centralize todos os seus links em um so lugar.
          </p>
          
          {/* Feature highlights - hidden on mobile */}
          <div className="hidden lg:flex flex-col gap-3 mt-8">
            <div className="flex items-center gap-3 text-[#5A5A5A]">
              <span className="w-6 h-6 rounded-full bg-[#E8A87C]/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#3D3D3D]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm">Personalize seu perfil</span>
            </div>
            <div className="flex items-center gap-3 text-[#5A5A5A]">
              <span className="w-6 h-6 rounded-full bg-[#E8A87C]/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#3D3D3D]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm">Analytics detalhados</span>
            </div>
            <div className="flex items-center gap-3 text-[#5A5A5A]">
              <span className="w-6 h-6 rounded-full bg-[#E8A87C]/30 flex items-center justify-center">
                <svg className="w-3 h-3 text-[#3D3D3D]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-sm">100% gratuito</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Area - Right Side (Desktop) / Bottom (Mobile) */}
      <div 
        className="
          flex-1 flex items-center justify-center 
          py-10 px-6 lg:py-0 lg:px-12
          bg-[#FDF8F5] lg:w-1/2
        "
      >
        <div className="w-full max-w-md animate-fade-in-up animation-delay-200">
          {/* Form Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#3D3D3D] mb-2">
              Criar Conta
            </h2>
            <p className="text-[#6B6B6B] text-sm lg:text-base">
              Preencha os dados para se registrar.
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* API Error Message */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
                {apiError}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            {/* Username Field */}
            <div className="space-y-2">
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-[#3D3D3D]"
              >
                Nome de Usuario
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="seu_usuario"
                className={`
                  w-full px-4 py-3 
                  bg-white border rounded-xl
                  text-[#3D3D3D] placeholder:text-[#A9A9A9]
                  focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                  transition-all duration-200
                  hover:border-[#E8A87C]/50
                  ${errors.username ? 'border-red-300' : 'border-[#E5DDD8]'}
                `}
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-[#3D3D3D]"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={`
                  w-full px-4 py-3 
                  bg-white border rounded-xl
                  text-[#3D3D3D] placeholder:text-[#A9A9A9]
                  focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                  transition-all duration-200
                  hover:border-[#E8A87C]/50
                  ${errors.email ? 'border-red-300' : 'border-[#E5DDD8]'}
                `}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-[#3D3D3D]"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className={`
                    w-full px-4 py-3 pr-12
                    bg-white border rounded-xl
                    text-[#3D3D3D] placeholder:text-[#A9A9A9]
                    focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                    transition-all duration-200
                    hover:border-[#E8A87C]/50
                    ${errors.password ? 'border-red-300' : 'border-[#E5DDD8]'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#3D3D3D] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-[#3D3D3D]"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita sua senha"
                  className={`
                    w-full px-4 py-3 pr-12
                    bg-white border rounded-xl
                    text-[#3D3D3D] placeholder:text-[#A9A9A9]
                    focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                    transition-all duration-200
                    hover:border-[#E8A87C]/50
                    ${errors.confirmPassword ? 'border-red-300' : 'border-[#E5DDD8]'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#3D3D3D] transition-colors"
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Invite Code Field */}
            <div className="space-y-2">
              <label 
                htmlFor="inviteCode" 
                className="block text-sm font-medium text-[#3D3D3D]"
              >
                Codigo de Convite
                <span className="text-[#A9A9A9] font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14}
                className="
                  w-full px-4 py-3 
                  bg-white border border-[#E5DDD8] rounded-xl
                  text-[#3D3D3D] placeholder:text-[#A9A9A9]
                  focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                  transition-all duration-200
                  hover:border-[#E8A87C]/50
                  font-mono text-sm
                "
              />
              <p className="text-[#A9A9A9] text-xs">
                Insira um codigo se voce recebeu um convite
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 mt-2
                bg-[#E8A87C] hover:bg-[#D4956B] active:bg-[#C4865C]
                text-white font-semibold rounded-xl
                transition-all duration-200
                transform hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100
                shadow-lg shadow-[#E8A87C]/25 hover:shadow-xl hover:shadow-[#E8A87C]/30
              "
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" cy="12" r="10" 
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
                  Criando conta...
                </span>
              ) : (
                'Criar Conta'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-[#6B6B6B] text-sm">
              Ja tem uma conta?{' '}
              <Link 
                to="/login" 
                className="
                  text-[#E8A87C] hover:text-[#D4956B] 
                  font-semibold underline-offset-4 hover:underline
                  transition-colors duration-200
                "
              >
                Fazer Login
              </Link>
            </p>
          </div>

          {/* Terms Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-[#B5B5B5]">
              Ao criar uma conta, voce concorda com nossos Termos de Uso e Politica de Privacidade
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
