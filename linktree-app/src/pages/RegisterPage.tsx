// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    try {
      await apiClient.post('/auth/register', { username, email, password });
      setSuccess('Conta criada com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Erro ao criar conta. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-400 to-blue-500 px-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">Criar Conta</h2>

        {error && <p className="text-red-500 text-center mb-4 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4 text-sm">{success}</p>}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm sm:text-base" htmlFor="username">
            Nome de Usuário
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            required
            minLength={3}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm sm:text-base" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm sm:text-base" htmlFor="password">
            Senha
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            required
            minLength={6}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2 text-sm sm:text-base" htmlFor="confirmPassword">
            Confirmar Senha
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-medium text-sm sm:text-base"
        >
          Criar Conta
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Fazer Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
