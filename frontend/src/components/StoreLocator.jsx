import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MdSearch, MdLocationOn, MdPhone, MdEmail, MdMap, MdStore, MdInfo } from 'react-icons/md';
import { storesAPI } from '../services/api';

export default function StoreLocator() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const { data: stores, isLoading, refetch } = useQuery({
    queryKey: ['public-stores', city, state],
    queryFn: () =>
      storesAPI.getPublicStores({
        city: city || undefined,
        state: state || undefined,
      }),
    enabled: false, // Não buscar automaticamente
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchPerformed(true);
    refetch();
  };

  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  return (
    <div id="localizador" className="py-16 bg-app dark:bg-app-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-title text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Encontre uma Loja Autorizada
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Localize a loja parceira Relm mais próxima de você para comprar sua bike ou obter suporte técnico
          </p>
        </div>

        {/* Search Form */}
        <div className="card p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="city" className="label">
                  Cidade
                </label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Digite sua cidade..."
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="state" className="label">
                  Estado
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="input"
                >
                  <option value="">Todos</option>
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary px-8 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <MdSearch className="h-5 w-5 mr-2" />
                    Buscar Lojas
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        {searchPerformed && (
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-500">Buscando lojas...</p>
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="card p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {/* Store Header */}
                    <div className="bg-gradient-to-r from-primary to-primary-700 p-4 text-white">
                      <h3 className="font-title text-xl font-bold mb-1">{store.tradeName}</h3>
                      <p className="text-primary-100 text-sm">
                        {store.city}, {store.state}
                      </p>
                    </div>

                    {/* Store Details */}
                    <div className="p-4 space-y-3">
                      {store.address && (
                        <div className="flex items-start">
                          <MdLocationOn className="h-5 w-5 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{store.address}</p>
                        </div>
                      )}

                      {store.phone && (
                        <div className="flex items-center">
                          <MdPhone className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          <a href={`tel:${store.phone}`} className="text-sm text-primary hover:text-primary-700">
                            {store.phone}
                          </a>
                        </div>
                      )}

                      {store.email && (
                        <div className="flex items-center">
                          <MdEmail className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          <a
                            href={`mailto:${store.email}`}
                            className="text-sm text-primary hover:text-primary-700 truncate"
                          >
                            {store.email}
                          </a>
                        </div>
                      )}

                      {store.distance && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Distância aproximada:</span>
                            <span className="text-sm font-semibold text-primary">
                              {store.distance} km
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex space-x-2">
                          {store.latitude && store.longitude && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-primary text-sm font-medium rounded-lg text-primary bg-white hover:bg-primary hover:text-white transition-colors"
                            >
                              <MdMap className="h-4 w-4 mr-1" />
                              Ver no Mapa
                            </a>
                          )}
                          {store.phone && (
                            <a
                              href={`tel:${store.phone}`}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-600 transition-colors"
                            >
                              <MdPhone className="h-4 w-4 mr-1" />
                              Ligar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 card">
                <MdStore className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma loja encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente buscar por outra cidade ou estado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Banner */}
        {!searchPerformed && (
          <div className="mt-8 bg-info/10 border-l-4 border-info p-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <MdInfo className="h-6 w-6 text-info" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-info-700 dark:text-info-100">Encontre lojas autorizadas Relm</h3>
                <div className="mt-2 text-sm text-info-700 dark:text-info-100">
                  <p>
                    Nossas lojas parceiras oferecem produtos originais, garantia estendida e suporte técnico
                    especializado. Use os filtros acima para encontrar a loja mais próxima de você.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
