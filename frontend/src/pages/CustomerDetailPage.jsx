import { useState, useEffect } from 'react';
import { useParams, useLocation, useSearchParams, Link } from 'react-router-dom';
import { MdLocationOn, MdEvent, MdArrowBack, MdVpnKey, MdCardGiftcard } from 'react-icons/md';
import api, { insuranceAPI, customersAPI, salesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, StatusChip, StatCard } from '../components/ui';
import AdminResetPasswordModal from '../components/AdminResetPasswordModal';
import AdminGrantPointsModal from '../components/AdminGrantPointsModal';

const DAY_MS = 24 * 60 * 60 * 1000;

// Formata uma quantidade de dias em pt-BR legível (anos / meses / dias).
function formatDuration(days) {
  if (days == null) return null;
  const d = Math.abs(days);
  if (d === 0) return 'hoje';
  const years = Math.floor(d / 365);
  const months = Math.floor((d % 365) / 30);
  const rest = d % 30;
  const parts = [];
  if (years) parts.push(`${years} ano${years > 1 ? 's' : ''}`);
  if (months) parts.push(`${months} ${months > 1 ? 'meses' : 'mês'}`);
  if (!years && rest) parts.push(`${rest} dia${rest > 1 ? 's' : ''}`);
  return parts.join(' e ') || `${d} dias`;
}

// Garantia de uma linha de venda, derivada de warrantyEndsAt + saleDate.
// null = vendido sem garantia. Retorna duração total, tempo restante e % consumida.
function warrantyInfo(item, saleDate) {
  if (!item.warrantyEndsAt) return { hasWarranty: false };
  const end = new Date(item.warrantyEndsAt);
  const start = saleDate ? new Date(saleDate) : null;
  const now = Date.now();

  const totalDays = item.warrantyDays
    ?? (start ? Math.round((end.getTime() - start.getTime()) / DAY_MS) : null);
  const remainingDays = Math.round((end.getTime() - now) / DAY_MS);
  const expired = remainingDays < 0;
  const elapsed = start ? Math.max(0, now - start.getTime()) : 0;
  const totalMs = start ? end.getTime() - start.getTime() : 0;
  const percentUsed = totalMs > 0 ? Math.min(100, Math.max(0, (elapsed / totalMs) * 100)) : 0;

  return { hasWarranty: true, end, totalDays, remainingDays, expired, percentUsed };
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [customer, setCustomer] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [events, setEvents] = useState([]);
  const [stores, setStores] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showGrantPoints, setShowGrantPoints] = useState(false);

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN_RELM';
  const isStorePortal = location.pathname.startsWith('/loja') || user?.role === 'LOJA';
  const backPath = isStorePortal ? '/loja/clientes' : '/admin/customers';

  useEffect(() => {
    fetchCustomerData();
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get(`/customers/${id}`),
        api.get(`/warranty/claims?customerId=${id}`),
        api.get('/public/events'),
        api.get('/stores'),
        insuranceAPI.getAll({ customerId: id }),
        salesAPI.getAll({ customerId: id, limit: 100 }),
      ]);

      const [customerRes, warrantiesRes, eventsRes, storesRes, insurancesRes, salesRes] = results;

      if (customerRes.status === 'fulfilled') {
        setCustomer(customerRes.value.data);
      } else {
        console.error('Erro ao carregar cliente:', customerRes.reason);
      }

      if (warrantiesRes.status === 'fulfilled') setWarranties(warrantiesRes.value.data || []);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data || []);
      if (storesRes.status === 'fulfilled') setStores(storesRes.value.data || []);
      if (insurancesRes.status === 'fulfilled') setInsurances(insurancesRes.value || []);
      if (salesRes.status === 'fulfilled') setSales(salesRes.value?.data || []);
    } catch (error) {
      console.error('Erro fatal ao carregar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const nearbyStores = stores.slice(0, 3); // Mock - implementar lógica de distância depois

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'purchases', label: 'Compras' },
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
          <Link to={backPath} className="text-primary dark:text-primary-400 hover:underline mt-4 inline-block">
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
              to={backPath}
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
            <Link
              to={`/loja/vendas?customerId=${id}`}
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              + Lançar Venda
            </Link>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowGrantPoints(true)}
                  className="btn bg-[#0A1929] dark:bg-[#2196F3] hover:bg-[#183757] dark:hover:bg-[#1e88e5] text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <MdCardGiftcard className="w-4 h-4 text-amber-400" /> Atribuir Pontos
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  className="btn btn-outline"
                >
                  <MdVpnKey className="w-4 h-4" /> Redefinir senha
                </button>
              </>
            )}
            <Link
              to={isStorePortal ? `/loja/clientes/${id}/editar` : `/admin/customers/${id}/edit`}
              className="btn btn-outline"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <div className="space-y-3">
                          {(sale.items || []).map((item) => {
                            const w = warrantyInfo(item, sale.saleDate);
                            // Chip de status: sem garantia (neutro), vencida (erro),
                            // vencendo em <=30 dias (aviso) ou vigente (sucesso).
                            let chipLabel = 'Sem garantia';
                            let variant = 'neutral';
                            if (w.hasWarranty) {
                              if (w.expired) {
                                chipLabel = `Vencida há ${formatDuration(w.remainingDays)}`;
                                variant = 'error';
                              } else if (w.remainingDays <= 30) {
                                chipLabel = `Vence em ${formatDuration(w.remainingDays)}`;
                                variant = 'warning';
                              } else {
                                chipLabel = `Faltam ${formatDuration(w.remainingDays)}`;
                                variant = 'success';
                              }
                            }
                            return (
                              <div
                                key={item.id}
                                className="border-t border-gray-100 dark:border-slate-800 pt-3 first:border-t-0 first:pt-0"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-slate-100">{item.commercialName}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                      Série: <span className="font-mono text-sm text-gray-600 dark:text-slate-400">{item.serialNumber || '—'}</span>
                                      {' • '}Qtd: {item.quantity}
                                    </p>
                                  </div>
                                  <StatusChip label={chipLabel} variant={variant} />
                                </div>
                                {w.hasWarranty && (
                                  <div className="mt-2">
                                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 dark:text-slate-400">
                                      {w.totalDays != null && (
                                        <span>Garantia: <span className="font-medium text-gray-700 dark:text-slate-300">{formatDuration(w.totalDays)}</span></span>
                                      )}
                                      <span>
                                        {w.expired ? 'Venceu em ' : 'Vence em '}
                                        <span className="font-medium text-gray-700 dark:text-slate-300">{w.end.toLocaleDateString('pt-BR')}</span>
                                      </span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${w.expired ? 'bg-red-500' : w.remainingDays <= 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.round(w.percentUsed)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
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
                            <p className="font-semibold text-gray-900 dark:text-slate-100">
                              {warranty.product?.model || 'Produto Relm'}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                              Protocolo: {warranty.protocolNumber}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                              Data de cadastro: {new Date(warranty.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {warranty.statusDef ? (
                            <StatusChip
                              label={warranty.statusDef.name}
                              color={warranty.statusDef.color}
                            />
                          ) : (
                            <StatusChip label="Pendente" color="#666666" />
                          )}
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

      {showGrantPoints && (
        <AdminGrantPointsModal
          customerId={id}
          customerName={customer.fullName}
          onClose={() => setShowGrantPoints(false)}
          onSuccess={() => fetchCustomerData()}
        />
      )}
    </div>
  );
}
