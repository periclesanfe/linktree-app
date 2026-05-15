import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

type Step = 'email' | 'code' | 'password';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setMessage(response.data.msg || 'Codigo enviado.');
      setStep('code');
    } catch (err) {
      console.error(err);
      setError('Nao foi possivel solicitar a recuperacao agora.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/verify-reset-code', {
        email,
        code: code.trim(),
      });
      setResetToken(response.data.resetToken);
      setMessage(response.data.msg || 'Codigo validado.');
      setStep('password');
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { msg?: string } } };
      setError(apiError.response?.data?.msg || 'Codigo invalido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        resetToken,
        password,
      });
      setMessage('Senha redefinida com sucesso. Redirecionando...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: unknown) {
      console.error(err);
      const apiError = err as { response?: { data?: { msg?: string } } };
      setError(apiError.response?.data?.msg || 'Nao foi possivel redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = step === 'email'
    ? 'Recuperar senha'
    : step === 'code'
      ? 'Informe o codigo'
      : 'Nova senha';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div
        className="
          relative flex flex-col items-center justify-center
          py-12 px-6 lg:py-0 lg:px-12
          lg:w-1/2 lg:min-h-screen
          bg-gradient-to-br from-[#FCEEE6] via-[#F5D5C3] to-[#E8A87C]
          overflow-hidden
        "
      >
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E8A87C]/30 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
          <div className="mb-6 lg:mb-8 animate-scale-in">
            <img
              src="/logo_transparente.png"
              alt="MeuHub Logo"
              className="w-24 h-24 lg:w-36 lg:h-36 drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold text-[#3D3D3D] mb-3 lg:mb-4 tracking-tight">
            MeuHub
          </h1>

          <p className="text-[#5A5A5A] text-base lg:text-lg max-w-xs lg:max-w-sm leading-relaxed">
            Redefina seu acesso e volte a gerenciar seus links.
          </p>
        </div>
      </div>

      <div
        className="
          flex-1 flex items-center justify-center
          py-10 px-6 lg:py-0 lg:px-12
          bg-[#FDF8F5] lg:w-1/2
        "
      >
        <div className="w-full max-w-md animate-fade-in-up animation-delay-200">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-[#3D3D3D] mb-2">
              {title}
            </h2>
            <p className="text-[#6B6B6B] text-sm lg:text-base">
              {step === 'email' && 'Digite o email cadastrado para receber o codigo.'}
              {step === 'code' && 'Confira sua caixa de entrada e informe o codigo recebido.'}
              {step === 'password' && 'Escolha uma nova senha para sua conta.'}
            </p>
          </div>

          {message && (
            <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={submitEmail} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-[#3D3D3D]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 bg-white border border-[#E5DDD8] rounded-xl text-[#3D3D3D] placeholder:text-[#A9A9A9] focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent transition-all duration-200 hover:border-[#E8A87C]/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#E8A87C] hover:bg-[#D4956B] active:bg-[#C4865C] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#E8A87C]/25"
              >
                {isLoading ? 'Enviando...' : 'Enviar codigo'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={submitCode} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-[#3D3D3D]">
                  Codigo
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  className="w-full px-4 py-3 bg-white border border-[#E5DDD8] rounded-xl text-[#3D3D3D] placeholder:text-[#A9A9A9] tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent transition-all duration-200 hover:border-[#E8A87C]/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3.5 bg-[#E8A87C] hover:bg-[#D4956B] active:bg-[#C4865C] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#E8A87C]/25"
              >
                {isLoading ? 'Validando...' : 'Validar codigo'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={submitPassword} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-[#3D3D3D]">
                  Nova senha
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimo 6 caracteres"
                  required
                  className="w-full px-4 py-3 bg-white border border-[#E5DDD8] rounded-xl text-[#3D3D3D] placeholder:text-[#A9A9A9] focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent transition-all duration-200 hover:border-[#E8A87C]/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#3D3D3D]">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirme sua senha"
                  required
                  className="w-full px-4 py-3 bg-white border border-[#E5DDD8] rounded-xl text-[#3D3D3D] placeholder:text-[#A9A9A9] focus:outline-none focus:ring-2 focus:ring-[#E8A87C] focus:border-transparent transition-all duration-200 hover:border-[#E8A87C]/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#E8A87C] hover:bg-[#D4956B] active:bg-[#C4865C] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-[#E8A87C]/25"
              >
                {isLoading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="text-[#E8A87C] hover:text-[#D4956B] font-semibold underline-offset-4 hover:underline transition-colors duration-200 text-sm"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
