import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membershipAPI } from '../services/api';

export default function MembershipsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    tier: '',
    status: 'ACTIVE',
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddPoints, setShowAddPoints] = useState(false);
  const [pointsForm, setPointsForm] = useState({
    points: '',
    reason: '',
  });

  const { data: memberships, isLoading } = useQuery({
    queryKey: ['memberships', filters],
    queryFn: () => membershipAPI.getAll(filters).then((res) => res.data),
  });

  const addPointsMutation = useMutation({
    mutationFn: ({ customerId, data }) =>
      membershipAPI.addPoints(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['memberships']);
      setShowAddPoints(false);
      setPointsForm({ points: '', reason: '' });
      alert('Pontos adicionados com sucesso!');
    },
    onError: (error) => {
      alert(error.response?.data?.message || 'Erro ao adicionar pontos');
    },
  });

  const handleAddPoints = (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    addPointsMutation.mutate({
      customerId: selectedMember.customerId,
      data: {
        points: parseInt(pointsForm.points),
        reason: pointsForm.reason,
        referenceType: 'ADMIN',
      },
    });
  };

  const getTierColor = (tier) => {
    const colors = {
      BRONZE: 'bg-orange-100 text-orange-800',
      SILVER: 'bg-gray-100 text-gray-800',
      GOLD: 'bg-yellow-100 text-yellow-800',
      DIAMOND: 'bg-blue-100 text-blue-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const getTierIcon = (tier) => {
    const icons = {
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇',
      DIAMOND: '💎',
    };
    return icons[tier] || '⭐';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gerenciar Memberships
          </h1>
          <p className="text-gray-600">
            Visualize e gerencie todos os membros do clube de vantagens
          </p>
        </div>

        {/* FILTROS */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tier
              </label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                className="input"
              >
                <option value="">Todos os tiers</option>
                <option value="BRONZE">🥉 Bronze</option>
                <option value="SILVER">🥈 Silver</option>
                <option value="GOLD">🥇 Gold</option>
                <option value="DIAMOND">💎 Diamond</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="input"
              >
                <option value="">Todos</option>
                <option value="ACTIVE">Ativos</option>
                <option value="INACTIVE">Inativos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ tier: '', status: 'ACTIVE' })}
                className="btn btn-secondary w-full"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'].map((tier) => {
            const count =
              memberships?.filter((m) => m.tier === tier).length || 0;
            return (
              <div key={tier} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {getTierIcon(tier)} {tier}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">{count}</p>
                  </div>
                  <div
                    className={`text-4xl ${getTierColor(tier)} p-3 rounded-full`}
                  >
                    {getTierIcon(tier)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* LISTA DE MEMBERSHIPS */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Carregando memberships...</p>
          </div>
        ) : memberships && memberships.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pontos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pontos Vitalícios
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Próximo Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberships.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.customer?.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.customer?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(
                          member.tier
                        )}`}
                      >
                        {getTierIcon(member.tier)} {member.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        {member.points}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {member.lifetimePoints}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.nextTier ? (
                        <span className="text-sm text-gray-600">
                          {getTierIcon(member.nextTier)} {member.nextTier}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Máximo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.nextTier ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(member.tierProgress, 100)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(member.tierProgress)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setShowAddPoints(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        ➕ Adicionar Pontos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum membership encontrado
            </h3>
          </div>
        )}

        {/* MODAL ADICIONAR PONTOS */}
        {showAddPoints && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-6">Adicionar Pontos</h2>

              <div className="mb-6">
                <p className="text-sm text-gray-600">Cliente:</p>
                <p className="text-lg font-medium">
                  {selectedMember.customer?.fullName}
                </p>
                <p className="text-sm text-gray-500">
                  Tier atual: {getTierIcon(selectedMember.tier)}{' '}
                  {selectedMember.tier} ({selectedMember.points} pontos)
                </p>
              </div>

              <form onSubmit={handleAddPoints}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade de Pontos
                  </label>
                  <input
                    type="number"
                    value={pointsForm.points}
                    onChange={(e) =>
                      setPointsForm({ ...pointsForm, points: e.target.value })
                    }
                    min="1"
                    required
                    className="input"
                    placeholder="Ex: 100"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo
                  </label>
                  <textarea
                    value={pointsForm.reason}
                    onChange={(e) =>
                      setPointsForm({ ...pointsForm, reason: e.target.value })
                    }
                    required
                    rows="3"
                    className="input"
                    placeholder="Ex: Bonificação especial por indicação"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPoints(false);
                      setPointsForm({ points: '', reason: '' });
                      setSelectedMember(null);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addPointsMutation.isLoading}
                    className="btn btn-primary flex-1"
                  >
                    {addPointsMutation.isLoading
                      ? 'Adicionando...'
                      : 'Adicionar Pontos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
