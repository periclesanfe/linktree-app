// src/components/AnalyticsModal.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

interface AnalyticsData {
  linkId: string;
  linkTitle: string;
  totalClicks: number;
  clicksToday: number;
  clicksThisWeek: number;
  clicksThisMonth: number;
  clicksByDay: Array<{
    date: string;
    clicks: number;
  }>;
  period: string;
}

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkId: string;
  linkTitle: string;
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, linkId, linkTitle }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (isOpen && linkId) {
      fetchAnalytics();
    }
  }, [isOpen, linkId, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/analytics/links/${linkId}?days=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const maxClicks = analytics?.clicksByDay?.length
    ? Math.max(...analytics.clicksByDay.map(d => d.clicks))
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop com blur */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Analytics
              </h2>
              <p className="text-gray-600 mt-1">{linkTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Total</div>
                  <div className="text-3xl font-bold">{analytics.totalClicks}</div>
                  <div className="text-xs opacity-75 mt-1">cliques</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Hoje</div>
                  <div className="text-3xl font-bold">{analytics.clicksToday}</div>
                  <div className="text-xs opacity-75 mt-1">cliques</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Esta Semana</div>
                  <div className="text-3xl font-bold">{analytics.clicksThisWeek}</div>
                  <div className="text-xs opacity-75 mt-1">cliques</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Este Mês</div>
                  <div className="text-3xl font-bold">{analytics.clicksThisMonth}</div>
                  <div className="text-xs opacity-75 mt-1">cliques</div>
                </div>
              </div>

              {/* Filtro de Período */}
              <div className="flex gap-2 flex-wrap">
                {[7, 14, 30, 60, 90].map(days => (
                  <button
                    key={days}
                    onClick={() => setPeriod(days)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      period === days
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {days} dias
                  </button>
                ))}
              </div>

              {/* Gráfico de Barras */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Cliques por Dia (últimos {period} dias)
                </h3>

                {analytics.clicksByDay.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.clicksByDay.map((item, index) => {
                      const percentage = maxClicks > 0 ? (item.clicks / maxClicks) * 100 : 0;
                      const date = new Date(item.date);
                      const formattedDate = date.toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short'
                      });

                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 w-20 text-right font-medium">
                            {formattedDate}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                              style={{ width: `${Math.max(percentage, 5)}%` }}
                            >
                              {item.clicks > 0 && (
                                <span className="text-white text-sm font-semibold">
                                  {item.clicks}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum clique registrado neste período
                  </div>
                )}
              </div>

              {/* Tendência */}
              {analytics.clicksByDay.length >= 2 && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Tendência
                  </h3>
                  <p className="text-gray-700">
                    {(() => {
                      const recent = analytics.clicksByDay.slice(-7);
                      const older = analytics.clicksByDay.slice(-14, -7);
                      const recentAvg = recent.reduce((sum, d) => sum + d.clicks, 0) / recent.length;
                      const olderAvg = older.length > 0
                        ? older.reduce((sum, d) => sum + d.clicks, 0) / older.length
                        : 0;

                      const trend = olderAvg > 0
                        ? ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1)
                        : 0;

                      if (recentAvg > olderAvg) {
                        return (
                          <span className="flex items-center gap-2 text-green-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Crescimento de {trend}% nos últimos 7 dias
                          </span>
                        );
                      } else if (recentAvg < olderAvg) {
                        return (
                          <span className="flex items-center gap-2 text-red-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                            </svg>
                            Queda de {Math.abs(Number(trend))}% nos últimos 7 dias
                          </span>
                        );
                      } else {
                        return (
                          <span className="flex items-center gap-2 text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                            </svg>
                            Estável nos últimos 7 dias
                          </span>
                        );
                      }
                    })()}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Erro ao carregar analytics
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModal;
