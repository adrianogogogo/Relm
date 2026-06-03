import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { insuranceAPI } from '../services/api';
import { ArrowLeft, FileText, Search } from 'lucide-react';

export default function AdminInsurancesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['admin-insurances'],
    queryFn: () => insuranceAPI.getAll(),
  });

  const filtered = (quotes || []).filter((q) => {
    const matchSearch =
      !search ||
      q.protocolNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cotações de Seguro</h1>
            <p className="text-gray-600 mt-1">Todas as cotações recebidas pelo formulário público</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por protocolo, cliente ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="SENT_TO_HELMDESK">Enviado</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando cotações...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma cotação encontrada.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Protocolo</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Valor da Bike</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Localização</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{q.protocolNumber}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{q.customer?.fullName || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{q.customer?.email || '—'}</td>
                    <td className="px-6 py-4 text-gray-700">
                      {q.bikeValue
                        ? `R$ ${parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {q.city && q.state ? `${q.city} - ${q.state}` : q.city || q.state || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-semibold">
                        {q.status === 'PENDING' ? 'Pendente' : q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 border-t">
              {filtered.length} cotaç{filtered.length !== 1 ? 'ões' : 'ão'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
