import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storesAPI, storeAuthAPI, adminUsersAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  MdArrowBack, MdEdit, MdLocationOn, MdPhone, MdEmail, MdBusiness,
  MdPeople, MdVerifiedUser, MdInventory2, MdManageAccounts, MdCheckCircle, MdCancel,
  MdStorefront, MdVpnKey,
} from 'react-icons/md';
import { Card, StatusChip, StatCard } from '../components/ui';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';

const ROLE_LABEL = {
  ADMIN_RELM: 'Admin Relm',
  GERENTE_RELM: 'Gerente Relm',
  SUPORTE_RELM: 'Suporte Relm',
  LOJA: 'Loja',
  DISTRIBUIDOR: 'Distribuidor',
};

const ROLE_HEX = {
  ADMIN_RELM: '#F44336',
  GERENTE_RELM: '#FB8C00',
  SUPORTE_RELM: '#FF9800',
  LOJA: '#4CAF50',
  DISTRIBUIDOR: '#2196F3',
};

export default function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = ['ADMIN_RELM', 'GERENTE_RELM', 'DISTRIBUIDOR'].includes(user?.role);
  const isAdmin = user?.role === 'ADMIN_RELM';
  const [resetTarget, setResetTarget] = useState(null);
  const [resetUserTarget, setResetUserTarget] = useState(null);

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', id],
    queryFn: () => storesAPI.getById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 dark:text-slate-500">Carregando...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-slate-400 mb-4">Loja não encontrada.</p>
          <Link to="/admin/stores" className="text-primary dark:text-primary-400 hover:underline">← Voltar para lojas</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
              <MdArrowBack className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-title text-2xl font-bold text-gray-900 dark:text-slate-100">{store.tradeName}</h1>
              {store.legalName && store.legalName !== store.tradeName && (
                <p className="text-sm text-gray-500 dark:text-slate-400">{store.legalName}</p>
              )}
            </div>
            <StatusChip
              className="ml-2"
              label={store.active ? 'Ativa' : 'Inativa'}
              variant={store.active ? 'success' : 'neutral'}
            />
          </div>
          {canEdit && (
            <Link
              to={`/admin/stores/${id}/edit`}
              className="btn btn-primary shrink-0"
            >
              <MdEdit className="w-4 h-4" /> Editar
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Informações gerais */}
            <Card>
              <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-4">Informações da Loja</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {store.cnpjFormatted && (
                  <div className="flex items-start gap-2">
                    <MdBusiness className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">CNPJ</p>
                      <p className="text-gray-800 dark:text-slate-100 font-medium">{store.cnpjFormatted}</p>
                    </div>
                  </div>
                )}
                {(store.city || store.state) && (
                  <div className="flex items-start gap-2">
                    <MdLocationOn className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Localização</p>
                      <p className="text-gray-800 dark:text-slate-100">{[store.city, store.state].filter(Boolean).join(', ')}</p>
                      {store.address && <p className="text-gray-500 dark:text-slate-400 text-xs">{store.address}</p>}
                      {store.zipCode && <p className="text-gray-500 dark:text-slate-400 text-xs">CEP: {store.zipCode}</p>}
                    </div>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-start gap-2">
                    <MdPhone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">Telefone</p>
                      <p className="text-gray-800 dark:text-slate-100">{store.phone}</p>
                    </div>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-start gap-2">
                    <MdEmail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 dark:text-slate-500">E-mail</p>
                      <p className="text-gray-800 dark:text-slate-100">{store.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Usuários vinculados */}
            {store.users && store.users.length > 0 && (
              <Card>
                <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <MdManageAccounts className="w-4 h-4 text-gray-400" /> Usuários do Sistema
                </h2>
                <div className="space-y-2">
                  {store.users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip label={ROLE_LABEL[u.role] || u.role} color={ROLE_HEX[u.role]} />
                        {u.active
                          ? <MdCheckCircle className="w-4 h-4 text-success" />
                          : <MdCancel className="w-4 h-4 text-gray-300 dark:text-slate-600" />}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setResetUserTarget(u)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-primary-400 hover:underline"
                          >
                            <MdVpnKey className="w-4 h-4" /> Redefinir senha
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Lojistas com acesso ao portal (tabela StoreUser) */}
            {store.storeUsers && store.storeUsers.length > 0 && (
              <Card>
                <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <MdStorefront className="w-4 h-4 text-gray-400" /> Lojistas (acesso ao portal)
                </h2>
                <div className="space-y-2">
                  {store.storeUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-800 last:border-0 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {u.isActive
                          ? <MdCheckCircle className="w-4 h-4 text-success" />
                          : <MdCancel className="w-4 h-4 text-gray-300 dark:text-slate-600" />}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setResetTarget(u)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-primary-400 hover:underline"
                          >
                            <MdVpnKey className="w-4 h-4" /> Redefinir senha
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Coluna lateral — stats */}
          <div className="space-y-4">
            <StatCard title="Clientes" value={store._count?.customers ?? 0} icon={MdPeople} color="#1565C0" />
            <StatCard title="Garantias" value={store._count?.warrantyClaims ?? 0} icon={MdVerifiedUser} color="#4CAF50" />
            <StatCard title="Produtos" value={store._count?.products ?? 0} icon={MdInventory2} color="#9C27B0" />

            <Card className="p-5">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Cadastro</p>
              <p className="text-sm text-gray-700 dark:text-slate-200 font-medium">
                {store.createdAt ? new Date(store.createdAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </Card>

            {canEdit && (
              <Link
                to={`/admin/stores/${id}/edit`}
                className="block w-full text-center btn btn-outline text-sm"
              >
                Editar dados da loja
              </Link>
            )}
          </div>
        </div>
      </div>

      {resetTarget && (
        <AdminResetPasswordModal
          title="Redefinir senha do lojista"
          userName={resetTarget.name}
          onSubmit={(password) => storeAuthAPI.adminResetPassword(resetTarget.id, password)}
          onClose={() => setResetTarget(null)}
        />
      )}

      {resetUserTarget && (
        <AdminResetPasswordModal
          title="Redefinir senha do usuário do sistema"
          userName={resetUserTarget.name}
          onSubmit={(password) => adminUsersAPI.resetPassword(resetUserTarget.id, password)}
          onClose={() => setResetUserTarget(null)}
        />
      )}
    </div>
  );
}
