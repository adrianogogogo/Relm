import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MdLocationOn, MdEvent, MdArrowBack, MdVpnKey } from 'react-icons/md';
import api, { insuranceAPI, customersAPI, salesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, StatusChip, StatCard } from '../components/ui';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';

// Status de garantia de uma linha de venda, derivado de warrantyEndsAt.
// null = vendido sem garantia; passado = expirada; futuro = vigente.
function warrantyStatus(warrantyEndsAt) {
  if (!warrantyEndsAt) return { label: 'Sem garantia', tone: 'neutral' };
  const end = new Date(warrantyEndsAt);
  if (end.getTime() < Date.now()) {
    return { label: `Expirada em ${end.toLocaleDateString('pt-BR')}`, tone: 'danger' };
  }
  return { label: `Em garantia até ${end.toLocaleDateString('pt-BR')}`, tone: 'success' };
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [events, setEvents] = useState([]);
  const [stores, setStores] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showResetPassword, setShowResetPassword] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';

  useEffect(() => {
    fetchCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, warrantiesRes, eventsRes, storesRes, insurancesRes, salesRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/warranty/claims?customerId=${id}`),
        api.get('/public/events'),
        api.get('/stores'),
        insuranceAPI.getAll({ customerId: id }),
        salesAPI.getAll({ customerId: id, limit: 100 }),
      ]);

      setCustomer(customerRes.data);
      setWarranties(warrantiesRes.data);
      setEvents(eventsRes.data);
      setStores(storesRes.data);
      setInsurances(insurancesRes);
      // salesAPI.getAll já devolve o corpo da resposta ({ data, total, page, limit }).
      setSales(salesRes?.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const nearbyStores = stores.slice(0, 3); // Mock - implementar lógica de distância depois

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'purchases', label: 'Compras' },
    { id: 'warranties', label: 'Garantias' },
    { id: 'insurances', label: 'Seguros' },
    { id: 'events', label: 'Eventos' },
    { id: 'stores', label: 'Lojas Próximas' },
  ];

  // Total de itens vendidos ainda em garantia (warrantyEndsAt no futuro),
  // somando todas as vendas do cliente.
  const activeWarrantyItemsCount = sales.reduce(
    (count, sale) => count + (sale.items || []).filter(
      (item) => item.warrantyEndsAt && new Date(item.warrantyEndsAt).getTime() >= Date.now(),
    ).length,
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 dark:text-slate-400 mt-4">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-400">Cliente não encontrado</p>
          <Link to="/admin/customers" className="text-primary dark:text-primary-400 hover:underline mt-4 inline-block">
            Voltar para lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 gap-4">
          <div>
            <Link
              to="/admin/customers"
              className="text-primary dark:text-primary-400 hover:underline mb-2 inline-flex items-center gap-1 text-sm font-semibold"
            >
              <MdArrowBack size={16} /> Voltar para clientes
            </Link>
            <h1 className="font-title text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              {customer.fullName}
              {customer.currentTier === 'PLUS' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  ★ Care Plus
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">{customer.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="btn btn-outline"
              >
                <MdVpnKey className="w-4 h-4" /> Redefinir senha
              </button>
            )}
            <Link
              to={`/admin/customers/${id}/edit`}
              className="btn btn-primary"
            >
              Editar Cliente
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Card className="p-0 mb-6 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-slate-800">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard
                    title="Garantias Ativas"
                    value={warranties.filter((w) => w.status === 'ACTIVE').length}
                    color="#1565C0"
                  />
                  <StatCard
                    title="Seguros Ativos"
                    value={insurances.filter((i) => i.status === 'ACTIVE').length}
                    color="#4CAF50"
                  />
                  <StatCard title="Eventos Inscritos" value={0} color="#9C27B0" />
                  <StatCard title="Produtos em Garantia" value={activeWarrantyItemsCount} color="#FF9800" />
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Informações do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">CPF</p>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{customer.cpf || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Telefone/WhatsApp</p>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{customer.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Endereço</p>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{customer.address || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-slate-400">Data de Cadastro</p>
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Purchases Tab */}
            {activeTab === 'purchases' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Compras do Cliente</h3>
                {sales.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">Nenhuma compra registrada</p>
                ) : (
                  <div className="space-y-4">
                    {sales.map((sale) => (
                      <div key={sale.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <p className="font-semibold text-gray-900 dark:text-slate-100">
                            Venda de {new Date(sale.saleDate).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400">
                            NF {sale.invoiceNumber || '—'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          {(sale.items || []).map((item) => {
                            const status = warrantyStatus(item.warrantyEndsAt);
                            const variant = status.tone === 'danger' ? 'error' : status.tone === 'success' ? 'success' : 'neutral';
                            return (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-slate-800 pt-2 first:border-t-0 first:pt-0"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-slate-100">{item.commercialName}</p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400">
                                    Série: <span className="font-mono text-sm text-gray-600 dark:text-slate-400">{item.serialNumber || '—'}</span>
                                    {' • '}Qtd: {item.quantity}
                                  </p>
                                </div>
                                <StatusChip label={status.label} variant={variant} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warranties Tab */}
            {activeTab === 'warranties' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Garantias do Cliente</h3>
                {warranties.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">Nenhuma garantia cadastrada</p>
                ) : (
                  <div className="space-y-4">
                    {warranties.map((warranty) => (
                      <div key={warranty.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-slate-100">{warranty.productName}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                              Protocolo: {warranty.protocolNumber}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                              Data de compra: {new Date(warranty.purchaseDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <StatusChip
                            label={warranty.status}
                            variant={
                              warranty.status === 'ACTIVE'
                                ? 'success'
                                : warranty.status === 'EXPIRED'
                                ? 'neutral'
                                : 'warning'
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insurances Tab */}
            {activeTab === 'insurances' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Cotações de Seguro</h3>
                  <Link to="/seguro" className="text-primary dark:text-primary-400 hover:underline text-sm font-medium">
                    + Solicitar Nova Cotação
                  </Link>
                </div>
                {insurances.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-slate-400 mb-4">Nenhuma cotação de seguro encontrada</p>
                    <Link
                      to="/seguro"
                      className="btn btn-primary inline-flex"
                    >
                      Solicitar Cotação
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insurances.map((q) => (
                      <div key={q.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold font-mono text-sm text-primary dark:text-primary-400">{q.protocolNumber}</p>
                            {q.product && (
                              <p className="text-sm text-gray-700 dark:text-slate-300 mt-1">
                                {q.product.model} — serial {q.product.serialNumber}
                              </p>
                            )}
                            {q.bikeValue && (
                              <p className="text-sm text-gray-500 dark:text-slate-400">
                                Valor da bike: R$ {parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                            {(q.city || q.state) && (
                              <p className="text-sm text-gray-500 dark:text-slate-400">
                                {[q.city, q.state].filter(Boolean).join(' — ')}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                              Solicitado em {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <StatusChip
                            label={q.status === 'PENDING' ? 'Pendente' : q.status}
                            variant={q.status === 'PENDING' ? 'warning' : 'success'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Eventos Disponíveis</h3>
                {events.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">Nenhum evento disponível no momento</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                        <h4 className="font-semibold mb-2 text-gray-900 dark:text-slate-100">{event.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">{event.description}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                          <MdLocationOn size={16} className="text-gray-400" /> {event.location}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                          <MdEvent size={16} className="text-gray-400" /> {new Date(event.startDate).toLocaleDateString('pt-BR')}
                        </p>
                        <button className="btn btn-primary text-sm">
                          Inscrever Cliente
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stores Tab */}
            {activeTab === 'stores' && (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Lojas na Região</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
                  Lojas autorizadas Relm Bikes próximas ao cliente
                </p>
                {nearbyStores.length === 0 ? (
                  <p className="text-gray-500 dark:text-slate-400">Nenhuma loja encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {nearbyStores.map((store) => (
                      <div key={store.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-slate-100">{store.tradeName}</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{store.address}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{store.phone}</p>
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${store.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline text-sm shrink-0"
                          >
                            Ver no Mapa
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {showResetPassword && (
        <AdminResetPasswordModal
          title="Redefinir senha do cliente"
          userName={customer.fullName}
          onSubmit={(password) => customersAPI.resetPassword(id, password)}
          onClose={() => setShowResetPassword(false)}
        />
      )}
    </div>
  );
}
