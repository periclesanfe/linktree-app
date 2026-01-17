import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useToast } from '../context/ToastContext';
import SkeletonLoader from './SkeletonLoader';

interface InviteCode {
  id: number;
  code: string;
  is_used: boolean;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
  notes: string | null;
  used_by: number | null;
}

interface InviteCodeStats {
  total: string;
  used: string;
  available: string;
  expired: string;
}

const InviteCodesPanel: React.FC = () => {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [stats, setStats] = useState<InviteCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'used' | 'available' | 'expired'>('all');

  // Form states
  const [count, setCount] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await apiClient.get('/invite-codes', { params });
      setCodes(response.data.codes);
      setStats(response.data.stats);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Erro ao buscar códigos', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, showToast]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();

    if (count < 1 || count > 100) {
      showToast('Quantidade deve ser entre 1 e 100', 'error');
      return;
    }

    try {
      setGenerating(true);
      const payload: { count: number; expiresInDays?: number; notes?: string } = { count };
      if (expiresInDays) payload.expiresInDays = Number(expiresInDays);
      if (notes) payload.notes = notes;

      const response = await apiClient.post('/invite-codes', payload);

      showToast(`${response.data.count} código(s) gerado(s) com sucesso!`, 'success');

      // Reset form
      setCount(1);
      setExpiresInDays('');
      setNotes('');

      // Refresh codes list
      fetchCodes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Erro ao gerar códigos', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja deletar este código?')) {
      return;
    }

    try {
      await apiClient.delete(`/invite-codes/${id}`);
      showToast('Código deletado com sucesso!', 'success');
      fetchCodes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      showToast(err.response?.data?.error || 'Erro ao deletar código', 'error');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Código copiado para a área de transferência!', 'success');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Disponíveis</div>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Usados</div>
            <div className="text-2xl font-bold text-meuhub-primary">{stats.used}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Expirados</div>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </div>
        </div>
      )}

      {/* Generate Codes Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Gerar Novos Códigos</h3>
        <form onSubmit={handleGenerateCodes} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-meuhub-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expira em (dias)
              </label>
              <input
                type="number"
                min="1"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : '')}
                placeholder="Nunca expira"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-meuhub-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Convite VIP"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-meuhub-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={generating}
            className="w-full md:w-auto px-6 py-2 bg-meuhub-primary text-meuhub-text rounded-md hover:bg-meuhub-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Gerando...' : 'Gerar Códigos'}
          </button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap gap-2 p-4">
            {['all', 'available', 'used', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as 'all' | 'used' | 'available' | 'expired')}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  filter === status
                    ? 'bg-meuhub-primary text-meuhub-text'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'Todos'}
                {status === 'available' && 'Disponíveis'}
                {status === 'used' && 'Usados'}
                {status === 'expired' && 'Expirados'}
              </button>
            ))}
          </div>
        </div>

        {/* Codes List */}
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              <SkeletonLoader type="link" count={5} />
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum código encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Expira em
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {code.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Copiar código"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          code.is_used
                            ? 'bg-meuhub-primary/20 text-meuhub-text'
                            : code.expires_at && new Date(code.expires_at) < new Date()
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {code.is_used ? 'Usado' : code.expires_at && new Date(code.expires_at) < new Date() ? 'Expirado' : 'Disponível'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(code.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(code.expires_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {code.notes || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        {!code.is_used && (
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Deletar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteCodesPanel;
