import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ action: '', entity: '', page: '1' });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => api.get('/audit-logs', { params: filters }).then((r) => r.data),
  });

  const { logs = [], total = 0, page = 1, pages = 1 } = data || {};

  const handleFilter = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: '1' });
  };

  const setPage = (p) => setFilters({ ...filters, page: String(p) });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Logs de Auditoria</h1>
          <p className="text-gray-500 text-sm mt-1">Registro de todas as ações sensíveis no sistema</p>
        </div>

        <div className="bg-white rounded-xl shadow p-4 mb-4 flex flex-wrap gap-4">
          <input
            name="action"
            value={filters.action}
            onChange={handleFilter}
            placeholder="Filtrar por ação..."
            className="input flex-1 min-w-48"
          />
          <input
            name="entity"
            value={filters.entity}
            onChange={handleFilter}
            placeholder="Filtrar por entidade..."
            className="input flex-1 min-w-48"
          />
          <button
            onClick={() => setFilters({ action: '', entity: '', page: '1' })}
            className="btn btn-outline text-sm"
          >
            Limpar
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-400">Nenhum log encontrado.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Data/Hora</th>
                    <th className="px-5 py-3 text-left">Usuário</th>
                    <th className="px-5 py-3 text-left">Ação</th>
                    <th className="px-5 py-3 text-left">Entidade</th>
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-5 py-3">
                        {log.user ? (
                          <>
                            <p className="font-medium text-gray-800">{log.user.name}</p>
                            <p className="text-xs text-gray-400">{log.user.role}</p>
                          </>
                        ) : (
                          <span className="text-gray-400">Sistema</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{log.entity}</td>
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs truncate max-w-24" title={log.entityId}>
                        {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-gray-50 border-t flex items-center justify-between text-xs text-gray-500">
                <span>{total} registro{total !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-1">Página {page} de {pages}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pages}
                    className="px-3 py-1 rounded border disabled:opacity-40 hover:bg-gray-100"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
