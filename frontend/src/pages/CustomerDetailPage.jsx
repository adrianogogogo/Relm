import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import api, { insuranceAPI } from '../services/api';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [warranties, setWarranties] = useState([]);
  const [insurances, setInsurances] = useState([]);
  const [events, setEvents] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, warrantiesRes, eventsRes, storesRes, insurancesRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/warranty/claims?customerId=${id}`),
        api.get('/public/events'),
        api.get('/stores'),
        insuranceAPI.getAll({ customerId: id }),
      ]);

      setCustomer(customerRes.data);
      setWarranties(warrantiesRes.data);
      setEvents(eventsRes.data);
      setStores(storesRes.data);
      setInsurances(insurancesRes);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const nearbyStores = stores.slice(0, 3); // Mock - implementar lógica de distância depois

  const tabs = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'warranties', label: 'Garantias' },
    { id: 'insurances', label: 'Seguros' },
    { id: 'events', label: 'Eventos' },
    { id: 'stores', label: 'Lojas Próximas' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Carregando dados do cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cliente não encontrado</p>
          <Link to="/admin/customers" className="text-primary hover:underline mt-4 inline-block">
            Voltar para lista de clientes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <Link
              to="/admin/customers"
              className="text-primary hover:underline mb-2 inline-block"
            >
              ← Voltar para clientes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{customer.fullName}</h1>
            <p className="text-gray-600 mt-1">{customer.email}</p>
          </div>
          <Link
            to={`/admin/customers/${id}/edit`}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-all font-semibold"
          >
            Editar Cliente
          </Link>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Garantias Ativas</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {warranties.filter((w) => w.status === 'ACTIVE').length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Seguros Ativos</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {insurances.filter((i) => i.status === 'ACTIVE').length}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Eventos Inscritos</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">0</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Informações do Cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">CPF</p>
                      <p className="font-medium">{customer.cpf || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefone/WhatsApp</p>
                      <p className="font-medium">{customer.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Endereço</p>
                      <p className="font-medium">{customer.address || 'Não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data de Cadastro</p>
                      <p className="font-medium">
                        {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warranties Tab */}
            {activeTab === 'warranties' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Garantias do Cliente</h3>
                {warranties.length === 0 ? (
                  <p className="text-gray-600">Nenhuma garantia cadastrada</p>
                ) : (
                  <div className="space-y-4">
                    {warranties.map((warranty) => (
                      <div key={warranty.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{warranty.productName}</p>
                            <p className="text-sm text-gray-600">
                              Protocolo: {warranty.protocolNumber}
                            </p>
                            <p className="text-sm text-gray-600">
                              Data de compra: {new Date(warranty.purchaseDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              warranty.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : warranty.status === 'EXPIRED'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {warranty.status}
                          </span>
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
                  <h3 className="text-lg font-semibold">Cotações de Seguro</h3>
                  <Link to="/seguro" className="text-primary hover:underline text-sm font-medium">
                    + Solicitar Nova Cotação
                  </Link>
                </div>
                {insurances.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Nenhuma cotação de seguro encontrada</p>
                    <Link
                      to="/seguro"
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 inline-block"
                    >
                      Solicitar Cotação
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insurances.map((q) => (
                      <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold font-mono text-sm">{q.protocolNumber}</p>
                            {q.product && (
                              <p className="text-sm text-gray-700 mt-1">
                                {q.product.model} — serial {q.product.serialNumber}
                              </p>
                            )}
                            {q.bikeValue && (
                              <p className="text-sm text-gray-600">
                                Valor da bike: R$ {parseFloat(q.bikeValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                            {(q.city || q.state) && (
                              <p className="text-sm text-gray-600">
                                {[q.city, q.state].filter(Boolean).join(' — ')}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Solicitado em {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            {q.status === 'PENDING' ? 'Pendente' : q.status}
                          </span>
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
                <h3 className="text-lg font-semibold mb-4">Eventos Disponíveis</h3>
                {events.length === 0 ? (
                  <p className="text-gray-600">Nenhum evento disponível no momento</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-1.5">
                          <MapPin size={16} className="text-gray-400" /> {event.location}
                        </p>
                        <p className="text-sm text-gray-600 mb-4 flex items-center gap-1.5">
                          <Calendar size={16} className="text-gray-400" /> {new Date(event.startDate).toLocaleDateString('pt-BR')}
                        </p>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 text-sm">
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
                <h3 className="text-lg font-semibold mb-4">Lojas na Região</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Lojas autorizadas Relm Bikes próximas ao cliente
                </p>
                {nearbyStores.length === 0 ? (
                  <p className="text-gray-600">Nenhuma loja encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {nearbyStores.map((store) => (
                      <div key={store.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{store.tradeName}</h4>
                            <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                            <p className="text-sm text-gray-600">{store.phone}</p>
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${store.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all text-sm"
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
        </div>
      </div>
    </div>
  );
}
