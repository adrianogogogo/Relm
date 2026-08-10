import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card, PageHeader } from '../components/ui';

// Renderiza o metadata de um log de forma legível.
// Para logs de garantia (com fromStatus/toStatus) mostra "DE → PARA" + motivo/protocolo.
// Para metadata genérico, lista pares chave: valor de forma compacta.
function MetadataDetails({ metadata }) {
  if (metadata == null || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
    return <span className="text-gray-400 dark:text-slate-500">—</span>;
  }

  const { fromStatus, toStatus, protocolNumber, reason, rejectionReason, comment } = metadata;

  // Caminho específico: alteração de status de garantia.
  if (fromStatus || toStatus) {
    const note = reason || rejectionReason || comment;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
            {fromStatus || '—'}
          </span>
          <span className="text-gray-400 dark:text-slate-500">→</span>
          <span className="bg-primary/10 text-primary dark:text-primary-400 px-1.5 py-0.5 rounded">
            {toStatus || '—'}
          </span>
        </div>
        {protocolNumber && (
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{protocolNumber}</p>
        )}
        {note && (
          <p className="text-xs text-gray-500 dark:text-slate-400 italic max-w-xs truncate" title={note}>
            {note}
          </p>
        )}
      </div>
    );
  }

  // Fallback genérico: pares chave: valor.
  return (
    <div className="space-y-0.5">
      {Object.entries(metadata).map(([key, value]) => (
        <p key={key} className="text-xs text-gray-500 dark:text-slate-400">
          <span className="font-medium text-gray-600 dark:text-slate-300">{key}:</span>{' '}
          {value == null
            ? '—'
            : typeof value === 'object'
              ? JSON.stringify(value)
              : String(value)}
        </p>
      ))}
    </div>
  );
}

const ACTOR_LABEL = {
  USER: 'Equipe Relm',
  STORE_USER: 'Loja',
  CUSTOMER: 'Cliente',
  ANONIMO: 'Sem autenticação',
};

// O ator só tem nome e papel quando é da equipe Relm (FK para `users`). Loja e
// cliente vivem em outras tabelas: o que existe é actorType + actorId, e o
// e-mail que o interceptor guardou no metadata.
function ActorCell({ log }) {
  if (log.user) {
    return (
      <>
        <p className="font-medium text-gray-800 dark:text-slate-100">{log.user.name}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500">{log.user.role}</p>
      </>
    );
  }

  if (!log.actorType || log.actorType === 'ANONIMO') {
    return (
      <span className="text-gray-400 dark:text-slate-500">
        {log.actorType === 'ANONIMO' ? 'Sem autenticação' : 'Sistema'}
      </span>
    );
  }

  return (
    <>
      <p className="font-medium text-gray-800 dark:text-slate-100 truncate max-w-40" title={log.actorId}>
        {log.metadata?.actorEmail || (log.actorId ? `${log.actorId.slice(0, 8)}…` : '—')}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500">
        {ACTOR_LABEL[log.actorType] || log.actorType}
      </p>
    </>
  );
}

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
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Logs de Auditoria"
          subtitle={`${total} registro(s) — ações sensíveis no sistema`}
        />

        <Card className="mb-4 flex flex-wrap gap-4">
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
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 dark:text-slate-500">Carregando logs...</div>
        ) : logs.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-gray-400 dark:text-slate-500">Nenhum log encontrado.</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/40 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Data/Hora</th>
                    <th className="px-5 py-3 text-left">Usuário</th>
                    <th className="px-5 py-3 text-left">Ação</th>
                    <th className="px-5 py-3 text-left">Entidade</th>
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">Detalhes</th>
                    <th className="px-5 py-3 text-left">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-5 py-3">
                        <ActorCell log={log} />
                      </td>
                      <td className="px-5 py-3">
                        <span className="bg-primary/10 text-primary dark:text-primary-400 text-xs px-2 py-1 rounded font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-slate-300 font-mono text-xs">{log.entity}</td>
                      <td className="px-5 py-3 text-gray-400 dark:text-slate-500 font-mono text-xs truncate max-w-24" title={log.entityId}>
                        {log.entityId ? log.entityId.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <MetadataDetails metadata={log.metadata} />
                      </td>
                      <td className="px-5 py-3 text-gray-400 dark:text-slate-500 text-xs">{log.ipAddress || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/40 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                <span>{total} registro{total !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-1">Página {page} de {pages}</span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pages}
                    className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
