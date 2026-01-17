// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      login(response.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Credenciais invalidas. Tente novamente.');
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
            Centralize todos os seus links em um so lugar. Simples, elegante e profissional.
          </p>
          
          {/* Decorative dots - hidden on mobile */}
          <div className="hidden lg:flex gap-2 mt-8">
            <span className="w-2 h-2 rounded-full bg-[#E8A87C]" />
            <span className="w-2 h-2 rounded-full bg-[#E8A87C]/60" />
            <span className="w-2 h-2 rounded-full bg-[#E8A87C]/30" />
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
              Entrar
            </h2>
            <p className="text-[#6B6B6B] text-sm lg:text-base">
              Bem-vindo de volta! Faca login para continuar.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
                {error}
              </div>
            )}

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
                required
                className="
                  w-full px-4 py-3 
                  bg-white border border-[#E5DDD8] rounded-xl
                  text-[#3D3D3D] placeholder:text-[#A9A9A9]
                  focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                  transition-all duration-200
                  hover:border-[#E8A87C]/50
                "
              />
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
                  placeholder="Digite sua senha"
                  required
                  className="
                    w-full px-4 py-3 pr-12
                    bg-white border border-[#E5DDD8] rounded-xl
                    text-[#3D3D3D] placeholder:text-[#A9A9A9]
                    focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent
                    transition-all duration-200
                    hover:border-[#E8A87C]/50
                  "
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 
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
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-[#6B6B6B] text-sm">
              Nao tem uma conta?{' '}
              <Link 
                to="/register" 
                className="
                  text-[#E8A87C] hover:text-[#D4956B] 
                  font-semibold underline-offset-4 hover:underline
                  transition-colors duration-200
                "
              >
                Criar Conta
              </Link>
            </p>
          </div>

          {/* Version Footer */}
          <div className="mt-10 text-center">
            <p className="text-xs text-[#B5B5B5]">
              v2.0.0 - MeuHub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
