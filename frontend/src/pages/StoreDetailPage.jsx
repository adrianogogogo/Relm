import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft, Pencil, MapPin, Phone, Mail, Building2,
  Users, Shield, Package, UserCog, CheckCircle2, XCircle,
} from 'lucide-react';

const ROLE_LABEL = {
  ADMIN_RELM: 'Admin Relm',
  GERENTE_RELM: 'Gerente Relm',
  SUPORTE_RELM: 'Suporte Relm',
  LOJA: 'Loja',
  DISTRIBUIDOR: 'Distribuidor',
};

const ROLE_COLOR = {
  ADMIN_RELM: 'bg-red-100 text-red-700',
  GERENTE_RELM: 'bg-orange-100 text-orange-700',
  SUPORTE_RELM: 'bg-yellow-100 text-yellow-700',
  LOJA: 'bg-green-100 text-green-700',
  DISTRIBUIDOR: 'bg-blue-100 text-blue-700',
};

export default function StoreDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canEdit = ['ADMIN_RELM', 'GERENTE_RELM'].includes(user?.role);

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['store', id],
    queryFn: () => storesAPI.getById(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Loja não encontrada.</p>
          <Link to="/admin/stores" className="text-primary hover:underline">← Voltar para lojas</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{store.tradeName}</h1>
              {store.legalName && store.legalName !== store.tradeName && (
                <p className="text-sm text-gray-500">{store.legalName}</p>
              )}
            </div>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${store.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {store.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          {canEdit && (
            <Link
              to={`/admin/stores/${id}/edit`}
              className="btn btn-primary flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Editar
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">

            {/* Informações gerais */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Informações da Loja</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {store.cnpjFormatted && (
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">CNPJ</p>
                      <p className="text-gray-800 font-medium">{store.cnpjFormatted}</p>
                    </div>
                  </div>
                )}
                {(store.city || store.state) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Localização</p>
                      <p className="text-gray-800">{[store.city, store.state].filter(Boolean).join(', ')}</p>
                      {store.address && <p className="text-gray-500 text-xs">{store.address}</p>}
                      {store.zipCode && <p className="text-gray-500 text-xs">CEP: {store.zipCode}</p>}
                    </div>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Telefone</p>
                      <p className="text-gray-800">{store.phone}</p>
                    </div>
                  </div>
                )}
                {store.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">E-mail</p>
                      <p className="text-gray-800">{store.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Usuários vinculados */}
            {store.users && store.users.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-gray-400" /> Usuários do Sistema
                </h2>
                <div className="space-y-2">
                  {store.users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABEL[u.role] || u.role}
                        </span>
                        {u.active
                          ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                          : <XCircle className="w-4 h-4 text-gray-300" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna lateral — stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Clientes</p>
                <p className="text-2xl font-bold text-gray-800">{store._count?.customers ?? 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Garantias</p>
                <p className="text-2xl font-bold text-gray-800">{store._count?.warrantyClaims ?? 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Produtos</p>
                <p className="text-2xl font-bold text-gray-800">{store._count?.products ?? 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">Cadastro</p>
              <p className="text-sm text-gray-700 font-medium">
                {store.createdAt ? new Date(store.createdAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>

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
    </div>
  );
}
