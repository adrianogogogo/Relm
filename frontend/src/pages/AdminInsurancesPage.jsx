import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { insuranceAPI } from '../services/api';
import { MdDescription, MdSearch } from 'react-icons/md';
import { Card, PageHeader, StatusChip } from '../components/ui';

const POLICY_STATUS_LABEL = { ACTIVE: 'Ativa', EXPIRED: 'Expirada', CANCELLED: 'Cancelada' };
const POLICY_STATUS_VARIANT = { ACTIVE: 'success', EXPIRED: 'error', CANCELLED: 'neutral' };

// Estados da máquina de cotação (Wave 9).
const QUOTE_STATUS_LABEL = {
  PENDING: 'Aguardando cotação',
  COTADA: 'Cotação enviada',
  ACEITA: 'Aceita pelo cliente',
  DECLINADA: 'Recusada pelo cliente',
  EXPIRADA: 'Expirada',
  RECUSADA: 'Não aprovada',
  CONVERTED: 'Apólice emitida',
};
const QUOTE_STATUS_VARIANT = {
  PENDING: 'warning',
  COTADA: 'info',
  ACEITA: 'info',
  DECLINADA: 'neutral',
  EXPIRADA: 'neutral',
  RECUSADA: 'error',
  CONVERTED: 'success',
};
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');

export default function AdminInsurancesPage() {
  const [tab, setTab] = useState('quotes');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [policyStatus, setPolicyStatus] = useState('');

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['admin-insurances'],
    queryFn: () => insuranceAPI.getAll(),
  });

  const { data: policies, isLoading: policiesLoading } = useQuery({
    queryKey: ['admin-policies', policyStatus],
    queryFn: () => insuranceAPI.getPolicies(policyStatus ? { status: policyStatus } : undefined),
    enabled: tab === 'policies',
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
    <div className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Seguros"
          subtitle="Cotações e apólices do clube"
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('quotes')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === 'quotes'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
            }`}
          >
            Cotações
          </button>
          <button
            onClick={() => setTab('policies')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              tab === 'policies'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
            }`}
          >
            Apólices
          </button>
        </div>

        {tab === 'policies' ? (
          <>
            <Card className="mb-6 flex flex-col md:flex-row gap-4">
              <select
                value={policyStatus}
                onChange={(e) => setPolicyStatus(e.target.value)}
                className="input md:w-56"
              >
                <option value="">Todos os status</option>
                <option value="ACTIVE">Ativa</option>
                <option value="EXPIRED">Expirada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </Card>

            {policiesLoading ? (
              <div className="text-center py-12 text-gray-500 dark:text-slate-400">Carregando apólices...</div>
            ) : (policies || []).length === 0 ? (
              <div className="text-center py-12">
                <MdDescription className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhuma apólice encontrada.</p>
              </div>
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Nº Apólice</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Cliente</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Seguradora</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Vigência</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                      {(policies || []).map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-mono text-sm font-bold text-primary dark:text-primary-400">
                            <Link to={`/admin/insurances/policies/${p.id}`} className="hover:underline">{p.policyNumber}</Link>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">{p.customer?.fullName || '—'}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{p.insurer}</td>
                          <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                            {formatDate(p.startsAt)} — {formatDate(p.expiresAt)}
                          </td>
                          <td className="px-6 py-4">
                            <StatusChip
                              label={POLICY_STATUS_LABEL[p.status] || p.status}
                              variant={POLICY_STATUS_VARIANT[p.status] || 'neutral'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : (
        <>
        {/* Filters */}
        <Card className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por protocolo, cliente ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-56"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="SENT_TO_HELMDESK">Enviado</option>
          </select>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">Carregando cotações...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <MdDescription className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400 text-lg">Nenhuma cotação encontrada.</p>
          </div>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Protocolo</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">E-mail</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Valor da Bike</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Localização</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm font-bold text-primary dark:text-primary-400">
                        <Link to={`/admin/insurances/${q.id}`} className="hover:underline">{q.protocolNumber}</Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">{q.customer?.fullName || '—'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">{q.customer?.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                        {q.bikeValue
                          ? `R$ ${parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-slate-400 text-sm">
                        {q.city && q.state ? `${q.city} - ${q.state}` : q.city || q.state || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip
                          label={QUOTE_STATUS_LABEL[q.status] || q.status}
                          variant={QUOTE_STATUS_VARIANT[q.status] || 'neutral'}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-400 text-sm">
                        {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/40 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-800">
                {filtered.length} cotaç{filtered.length !== 1 ? 'ões' : 'ão'}
              </div>
            </div>
          </Card>
        )}
        </>
        )}
      </div>
    </div>
  );
}
