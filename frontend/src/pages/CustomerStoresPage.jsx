import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storesAPI, storeServicesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Card, PageHeader, Button } from '../components/ui';
import ConvenienceDetailModal from '../components/ConvenienceDetailModal';
import {
  MdStorefront,
  MdLocationOn,
  MdPhone,
  MdEmail,
  MdDirectionsBike,
  MdStar,
  MdAccessTime,
  MdBuild,
  MdMyLocation,
  MdSearch,
  MdFilterList,
  MdOpenInNew,
  MdClose,
  MdCalendarMonth,
  MdLocalOffer,
  MdInfoOutline,
} from 'react-icons/md';

// Haversine distance formula in KM
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper para calcular e formatar as informacoes de preco do Relm Plus
export function getServicePlusInfo(service) {
  const priceCare = Number(service.priceCare ?? service.price ?? service.defaultPrice ?? 0);
  const plusRule = service.plusRule || service.masterService?.plusRule || 'FREE';
  const pct = service.plusDiscountPercent ?? service.masterService?.plusDiscountPercent ?? (plusRule === 'FREE' ? 100 : 20);

  let pricePlus = 0;
  if (plusRule === 'FREE') {
    pricePlus = 0;
  } else if (plusRule === 'DISCOUNT_PERCENT') {
    pricePlus = service.calculatedPlusPrice !== undefined
      ? Number(service.calculatedPlusPrice)
      : priceCare * (1 - pct / 100);
  } else if (plusRule === 'FIXED_PRICE') {
    pricePlus = Number(service.plusPrice ?? 0);
  }

  const savings = Math.max(0, priceCare - pricePlus);

  let badgeText = '';
  if (plusRule === 'FREE') {
    badgeText = 'Plus: GRATUITO (100% OFF)';
  } else if (plusRule === 'DISCOUNT_PERCENT') {
    badgeText = `Plus: R$ ${pricePlus.toFixed(2)} (${pct}% OFF)`;
  } else {
    badgeText = `Plus: R$ ${pricePlus.toFixed(2)}`;
  }

  const savingsText = savings > 0 ? `(Economize R$ ${savings.toFixed(2)})` : null;

  return {
    priceCare,
    plusRule,
    pct,
    pricePlus,
    savings,
    badgeText,
    savingsText,
  };
}

const CONVENIENCE_FILTER_OPTIONS = [
  { id: 'ALL', label: 'Todas as Lojas' },
  { id: 'DUCHA', label: '🚿 Ducha & Vestiário', keyword: 'ducha' },
  { id: 'GUARDA_BIKE', label: '🔒 Guarda-Bike', keyword: 'guarda-bike' },
  { id: 'CAFE', label: '☕ Bike Café & Lounge', keyword: 'café' },
  { id: 'EBIKE', label: '⚡ Recarga E-Bike', keyword: 'recarga' },
  { id: 'SOCORRO', label: '🚑 Socorro Emergencial', keyword: 'socorro' },
  { id: 'PITSTOP', label: '🧰 Pit Stop & Calibragem', keyword: 'pit stop' },
  { id: 'MALABIKE', label: '🧳 Mala-Bike & Racks', keyword: 'mala-bike' },
];

function StoreModal({ store, user, onClose, onSelectStoreForBooking, onOpenConvenienceDetail }) {
  const isPlus = user?.currentTier === 'PLUS';
  const services = store?.storeServices || [];

  const conveniences = services.filter(
    (s) => s.masterService?.category === 'Conveniências & Hub do Ciclista'
  );
  const workshopServices = services.filter(
    (s) => s.masterService?.category !== 'Conveniências & Hub do Ciclista'
  );

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${store.tradeName}, ${store.address || ''}, ${store.city} - ${store.state}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 dark:border-slate-700 dark:bg-slate-800">
              {store.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.tradeName}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="flex h-full w-full items-center justify-center bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 font-extrabold text-lg rounded-xl"
                style={{ display: store.logoUrl ? 'none' : 'flex' }}
              >
                <MdStorefront className="h-7 w-7" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {store.tradeName}
              </h3>
              <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <MdLocationOn className="h-4 w-4 text-cyan-600" />
                {store.address ? `${store.address} — ` : ''}
                {store.city}/{store.state}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <MdClose className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-6 overflow-y-auto p-6">
          {/* Quick info & contact */}
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <MdLocationOn className="h-5 w-5 text-red-500 shrink-0" />
              <span>Abrir no Google Maps / Waze</span>
              <MdOpenInNew className="ml-auto h-4 w-4 text-slate-400" />
            </a>

            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <MdPhone className="h-5 w-5 text-emerald-500 shrink-0" />
                <span>Telefone: {store.phone}</span>
              </a>
            )}
          </div>

          {/* Conveniences Section */}
          <div>
            <h4 className="mb-3 flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-2">
                <MdStar className="h-5 w-5 text-amber-500" />
                Conveniências & Hub do Ciclista ({conveniences.length})
              </span>
              <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                Clique para ver os detalhes
              </span>
            </h4>

            {conveniences.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Nenhuma conveniência cadastrada nesta unidade no momento.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {conveniences.map((s) => {
                  const name = s.masterService?.name || 'Conveniência';
                  const desc = s.masterService?.description || '';
                  const info = getServicePlusInfo(s);

                  return (
                    <div
                      key={s.id}
                      onClick={() => onOpenConvenienceDetail(s, store)}
                      className="cursor-pointer group rounded-xl border border-amber-200/80 bg-amber-50/40 p-3 shadow-xs hover:border-amber-400 hover:bg-amber-100/50 transition-all dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-900/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 flex items-center gap-1">
                          {name} <MdInfoOutline className="h-4 w-4 text-amber-500 opacity-80" />
                        </h5>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            info.plusRule === 'FREE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}
                        >
                          {info.badgeText}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                        {desc}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <span className="underline">ℹ️ Ver Ficha Técnica & Insumos Inclusos</span>
                        {info.savingsText && <span className="text-emerald-600 font-extrabold">{info.savingsText}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workshop Services Section */}
          <div>
            <h4 className="mb-3 flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
              <span className="flex items-center gap-2">
                <MdBuild className="h-5 w-5 text-cyan-600" />
                Serviços de Oficina & Manutenção ({workshopServices.length})
              </span>
              <span className="text-xs font-normal text-cyan-600 dark:text-cyan-400">
                Clique em qualquer serviço para ver a Ficha Técnica
              </span>
            </h4>

            {workshopServices.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Nenhum serviço de oficina disponível nesta loja.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {workshopServices.map((s) => {
                  const name = s.masterService?.name || 'Serviço';
                  const desc = s.masterService?.description || '';
                  const info = getServicePlusInfo(s);

                  return (
                    <div
                      key={s.id}
                      onClick={() => onOpenConvenienceDetail(s, store)}
                      className="cursor-pointer group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs hover:border-cyan-500 hover:bg-cyan-50/30 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-cyan-500 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                          <span className="flex items-center gap-1">
                            {name} <MdInfoOutline className="h-4 w-4 text-cyan-500 opacity-80" />
                          </span>
                          <span className="text-slate-500 text-[10px] font-normal flex items-center gap-0.5 shrink-0">
                            <MdAccessTime className="h-3 w-3" /> {s.estimatedMinutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">
                          {desc}
                        </p>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2 dark:border-slate-700">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-600 dark:text-slate-400">
                            Care: R$ {info.priceCare.toFixed(2)}
                          </span>
                          <span className={`font-extrabold ${info.plusRule === 'FREE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {info.badgeText}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-cyan-700 dark:text-cyan-400 pt-0.5">
                          <span className="underline">ℹ️ Ver Ficha Técnica & Procedimentos</span>
                          {info.savingsText && (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                              {info.savingsText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/80">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            onClick={() => {
              onClose();
              onSelectStoreForBooking(store.id);
            }}
            className="flex items-center gap-2"
          >
            <MdCalendarMonth className="h-5 w-5" /> Agendar / Consumir Nesta Loja
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerStoresPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [userCoords, setUserCoords] = useState(null); // { lat, lng }
  const [userAddressLabel, setUserAddressLabel] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConvenienceFilter, setSelectedConvenienceFilter] = useState('ALL');
  const [selectedStoreModal, setSelectedStoreModal] = useState(null);

  // Convenience / Service detail modal state
  const [selectedConvenienceDetail, setSelectedConvenienceDetail] = useState(null); // { service, store }

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['public-stores-customer'],
    queryFn: () => storesAPI.getPublicStores(),
  });

  // Request browser GPS position
  const handleRequestGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setUserAddressLabel('Minha Localização Atual (GPS)');
        setGpsLoading(false);
      },
      (err) => {
        setGpsError('Não foi possível obter sua localização. Verifique as permissões.');
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Process stores with calculated distance
  const storesWithDistance = stores.map((store) => {
    let distance = null;
    if (userCoords && store.latitude && store.longitude) {
      distance = getHaversineDistance(
        userCoords.lat,
        userCoords.lng,
        parseFloat(store.latitude),
        parseFloat(store.longitude)
      );
    }
    return { ...store, distance };
  });

  // Sort stores (stores with distance first, then city/name)
  storesWithDistance.sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    }
    if (a.distance !== null) return -1;
    if (b.distance !== null) return 1;
    return a.tradeName.localeCompare(b.tradeName);
  });

  // Filter stores by search query & convenience filter
  const filteredStores = storesWithDistance.filter((store) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      store.tradeName.toLowerCase().includes(search) ||
      store.city.toLowerCase().includes(search) ||
      store.state.toLowerCase().includes(search) ||
      (store.address && store.address.toLowerCase().includes(search));

    if (!matchesSearch) return false;

    if (selectedConvenienceFilter === 'ALL') return true;

    const filterObj = CONVENIENCE_FILTER_OPTIONS.find((f) => f.id === selectedConvenienceFilter);
    if (!filterObj?.keyword) return true;

    // Check if store has a service matching the convenience keyword
    const services = store.storeServices || [];
    return services.some((s) => {
      const cat = (s.masterService?.category || '').toLowerCase();
      const name = (s.masterService?.name || '').toLowerCase();
      return name.includes(filterObj.keyword) || cat.includes(filterObj.keyword);
    });
  });

  const handleBookingRedirect = (storeId) => {
    navigate('/cliente/oficina', { state: { storeId } });
  };

  return (
    <div className="space-y-6 py-6 px-4 max-w-7xl mx-auto">
      <PageHeader
        title="Rede de Lojas & Conveniências do Ciclista"
        subtitle="Encontre as lojas parceiras mais próximas de você e escolha os serviços e facilidades para o seu pedal."
      />

      {/* GPS & Location Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-lg">
            <MdMyLocation className="h-5 w-5 text-cyan-400 animate-pulse" />
            <span>Localização & Proximidade</span>
          </div>
          <p className="text-xs text-slate-300">
            {userAddressLabel
              ? `Calculando distâncias a partir de: ${userAddressLabel}`
              : 'Ative seu GPS para ver a distância exata em km até cada loja parceira.'}
          </p>
          {gpsError && <p className="text-xs text-red-400 font-semibold">{gpsError}</p>}
        </div>

        <Button
          onClick={handleRequestGps}
          disabled={gpsLoading}
          className="bg-cyan-500 hover:bg-cyan-600 text-white flex items-center gap-2 shrink-0 shadow-lg"
        >
          <MdMyLocation className="h-5 w-5" />
          {gpsLoading ? 'Obtendo GPS...' : '📌 Usar Minha Localização Atual'}
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <MdSearch className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar por nome da loja, cidade, estado ou bairro..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Mostrando <span className="font-bold text-cyan-600 dark:text-cyan-400">{filteredStores.length}</span> lojas parceiras
          </span>
        </div>

        {/* Convenience Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <MdFilterList className="h-4 w-4" /> Filtrar Conveniência:
          </span>
          {CONVENIENCE_FILTER_OPTIONS.map((f) => {
            const isSelected = selectedConvenienceFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedConvenienceFilter(f.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stores Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 font-semibold">
          Carregando lojas parceiras e conveniências...
        </div>
      ) : filteredStores.length === 0 ? (
        <Card className="py-16 text-center text-slate-500">
          Nenhuma loja parceira encontrada com os filtros selecionados.
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStores.map((store) => {
            const services = store.storeServices || [];
            const conveniencies = services.filter(
              (s) => s.masterService?.category === 'Conveniências & Hub do Ciclista'
            );
            const convenienciesCount = conveniencies.length;

            return (
              <Card
                key={store.id}
                className="flex flex-col justify-between transition-all hover:shadow-lg dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Distance badge & Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 overflow-hidden shrink-0 dark:border-slate-700 dark:bg-slate-800">
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.tradeName}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="flex h-full w-full items-center justify-center bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 font-extrabold text-base rounded-xl"
                          style={{ display: store.logoUrl ? 'none' : 'flex' }}
                        >
                          <MdStorefront className="h-6 w-6" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">
                          {store.tradeName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                          <MdLocationOn className="h-3.5 w-3.5 text-red-500" />
                          {store.city} - {store.state}
                        </p>
                      </div>
                    </div>

                    {store.distance !== null && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0 shadow-sm">
                        📍 {store.distance < 1 ? `${(store.distance * 1000).toFixed(0)}m` : `${store.distance.toFixed(1)} km`}
                      </span>
                    )}
                  </div>

                  {store.address && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {store.address}
                    </p>
                  )}

                  {/* Conveniences Badges list */}
                  <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span>Conveniências da Loja:</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {convenienciesCount} disponíveis
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {conveniencies.slice(0, 4).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedConvenienceDetail({ service: s, store })}
                          className="rounded-md bg-amber-100 hover:bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900 transition-all flex items-center gap-1"
                        >
                          <span>{s.masterService?.name?.split('(')[0] || 'Conveniência'}</span>
                          <MdInfoOutline className="h-3 w-3 opacity-70" />
                        </button>
                      ))}
                      {convenienciesCount > 4 && (
                        <button
                          onClick={() => setSelectedStoreModal(store)}
                          className="rounded-md bg-slate-200 hover:bg-slate-300 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                        >
                          +{convenienciesCount - 4} mais
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700 gap-2">
                  <button
                    onClick={() => setSelectedStoreModal(store)}
                    className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-all text-center"
                  >
                    🔎 Ver Hub da Loja
                  </button>

                  <Button
                    size="sm"
                    onClick={() => handleBookingRedirect(store.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs"
                  >
                    <MdCalendarMonth className="h-4 w-4" /> Agendar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Hub da Loja */}
      {selectedStoreModal && (
        <StoreModal
          store={selectedStoreModal}
          user={user}
          onClose={() => setSelectedStoreModal(null)}
          onSelectStoreForBooking={handleBookingRedirect}
          onOpenConvenienceDetail={(s, st) => setSelectedConvenienceDetail({ service: s, store: st })}
        />
      )}

      {/* Modal Detalhes da Conveniência / Serviço de Oficina */}
      {selectedConvenienceDetail && (
        <ConvenienceDetailModal
          service={selectedConvenienceDetail.service}
          store={selectedConvenienceDetail.store}
          onClose={() => setSelectedConvenienceDetail(null)}
          onAction={() => {
            const storeId = selectedConvenienceDetail.store?.id;
            setSelectedConvenienceDetail(null);
            setSelectedStoreModal(null);
            if (storeId) handleBookingRedirect(storeId);
          }}
          actionLabel="Agendar / Consumir nesta Loja"
        />
      )}
    </div>
  );
}
