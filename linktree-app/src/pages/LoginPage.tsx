// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      login(response.data.token);
      navigate('/admin');
    } catch (err) {
      setError('Credenciais inválidas. Tente novamente.');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-400 to-teal-600 px-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">Login</h2>
        {error && <p className="text-red-500 text-center mb-4 text-sm">{error}</p>}

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
        <p className="mb-4 text-sm text-gray-600">Use email:</p>

        <div className="mb-6">
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
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-medium text-sm sm:text-base"
        >
          Entrar
        </button>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Criar Conta
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center border-t pt-4">
          <p className="text-xs text-gray-400">
            v2.0.0 - Canary Deployment Test 🐤
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;