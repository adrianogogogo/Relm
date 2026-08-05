import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { storesAPI } from '../services/api';
import { fileToLogoDataUrl } from '../utils/imageUpload';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KineticCard,
  KineticPageHeader,
  KineticStatCard,
  StatsMarquee,
  NoiseTexture,
  AnimatedSection,
} from '../components/ui/kinetic';
import {
  MdStorefront,
  MdPeople,
  MdLocationOn,
  MdInfo,
  MdImage,
  MdSave,
  MdCheckCircle,
  MdUploadFile,
  MdDelete,
  MdEdit,
} from 'react-icons/md';

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Perfil do lojista logado — permite visualizar e editar todos os dados da loja e a logomarca oficial.
 */
export default function StoreProfilePage() {
  const { user, setUser } = useAuthStore();
  const store = user?.store;
  const queryClient = useQueryClient();

  // Busca os dados completos e atualizados da própria loja via GET /api/store/profile
  const { data: ownStore } = useQuery({
    queryKey: ['own-store-profile'],
    queryFn: () => storesAPI.getOwnProfile(),
    staleTime: 0,
  });

  const activeStore = ownStore || store;

  // Estados dos formulários
  const [logoUrl, setLogoUrl] = useState(activeStore?.logoUrl || '');
  const [logoSuccess, setLogoSuccess] = useState(false);
  const logoFileRef = useRef(null);

  const [formData, setFormData] = useState({
    tradeName: activeStore?.tradeName || '',
    legalName: activeStore?.legalName || '',
    phone: activeStore?.phone || '',
    email: activeStore?.email || '',
    address: activeStore?.address || '',
    city: activeStore?.city || '',
    state: activeStore?.state || 'SP',
    zipCode: activeStore?.zipCode || '',
  });
  const [storeSuccess, setStoreSuccess] = useState(false);

  useEffect(() => {
    if (activeStore) {
      setLogoUrl(activeStore.logoUrl || '');
      setFormData({
        tradeName: activeStore.tradeName || '',
        legalName: activeStore.legalName || '',
        phone: activeStore.phone || '',
        email: activeStore.email || '',
        address: activeStore.address || '',
        city: activeStore.city || '',
        state: activeStore.state || 'SP',
        zipCode: activeStore.zipCode || '',
      });
    }
  }, [ownStore]);

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setLogoUrl(await fileToLogoDataUrl(file));
    } catch (err) {
      alert(err.message || 'Falha ao processar imagem.');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Mutation para atualizar a logomarca
  const updateLogoMutation = useMutation({
    mutationFn: (newLogoUrl) => storesAPI.updateOwnProfile({ logoUrl: newLogoUrl }),
    onSuccess: (updatedStore) => {
      queryClient.invalidateQueries({ queryKey: ['public-stores-customer'] });
      queryClient.invalidateQueries({ queryKey: ['store', store?.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-partners'] });

      if (user && store) {
        setUser({
          ...user,
          store: {
            ...store,
            logoUrl: updatedStore.logoUrl || logoUrl,
          },
        });
      }

      setLogoSuccess(true);
      setTimeout(() => setLogoSuccess(false), 4000);
    },
    onError: (err) => {
      alert(`Erro ao salvar logo: ${err.response?.data?.message || err.message}`);
    },
  });

  // Mutation para atualizar os dados gerais da loja
  const updateStoreMutation = useMutation({
    mutationFn: (data) => storesAPI.updateOwnProfile(data),
    onSuccess: (updatedStore) => {
      queryClient.invalidateQueries({ queryKey: ['own-store-profile'] });
      queryClient.invalidateQueries({ queryKey: ['public-stores-customer'] });
      queryClient.invalidateQueries({ queryKey: ['store', store?.id] });
      queryClient.invalidateQueries({ queryKey: ['customer-partners'] });

      if (user && store) {
        setUser({
          ...user,
          store: {
            ...store,
            ...updatedStore,
          },
        });
      }

      setStoreSuccess(true);
      setTimeout(() => setStoreSuccess(false), 4000);
    },
    onError: (err) => {
      alert(`Erro ao salvar dados da loja: ${err.response?.data?.message || err.message}`);
    },
  });

  const handleSaveLogo = (e) => {
    e.preventDefault();
    if (!store?.id) {
      alert('Nenhuma loja vinculada ao seu usuário.');
      return;
    }
    updateLogoMutation.mutate(logoUrl.trim());
  };

  const handleSaveStoreData = (e) => {
    e.preventDefault();
    if (!store?.id) {
      alert('Nenhuma loja vinculada ao seu usuário.');
      return;
    }
    if (!formData.tradeName || !formData.city || !formData.state) {
      alert('Nome Fantasia, Cidade e Estado são obrigatórios.');
      return;
    }
    updateStoreMutation.mutate(formData);
  };

  // Items para a faixa deslizante
  const marqueeItems = [
    { value: store?.totalCustomers || '0', label: 'Clientes' },
    { value: store?.totalSales || '0', label: 'Vendas' },
    { value: store?.activeWarranties || '0', label: 'Garantias Ativas' },
    { value: store?.city ? `${store.city}/${store.state}` : '—', label: 'Localização' },
  ];

  return (
    <div className="relative min-h-screen">
      <NoiseTexture />

      <div className="py-8 px-4 md:px-8">
        <div className="max-w-[90vw] lg:max-w-5xl mx-auto space-y-0">

          {/* ── HEADER ── */}
          <AnimatedSection className="mb-2">
            <KineticPageHeader
              name={store?.tradeName || user?.name || 'Minha Loja'}
              subtitle={user?.email}
              badge={user?.role === 'LOJA' ? 'Lojista Parceiro' : user?.role}
              initial={store?.tradeName?.charAt(0) || user?.name?.charAt(0)}
            />
          </AnimatedSection>

          {/* ── MARQUEE ── */}
          <AnimatedSection delay={0.1} className="mb-8">
            <StatsMarquee items={marqueeItems} speed={50} />
          </AnimatedSection>

          {/* ── STAT CARDS ── */}
          <AnimatedSection delay={0.2} className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-kinetic-border dark:bg-kinetic-border-dark">
              <KineticStatCard
                value={store?.totalCustomers || '0'}
                label="Clientes"
                icon={MdPeople}
              />
              <KineticStatCard
                value={store?.totalSales || '0'}
                label="Vendas"
                icon={MdStorefront}
              />
              <KineticStatCard
                value={store?.activeWarranties || '0'}
                label="Garantias"
                bgNumber="✓"
              />
              <KineticStatCard
                value={store?.city || '—'}
                label="Cidade"
                icon={MdLocationOn}
                bgNumber={store?.state || ''}
              />
            </div>
          </AnimatedSection>

          {/* ── CARD DE DADOS DA LOJA ── */}
          {store ? (
            <AnimatedSection delay={0.25} className="mb-8">
              <KineticCard>
                <div className="mb-6 pb-4 border-b-2 border-kinetic-border dark:border-kinetic-border-dark flex items-center justify-between">
                  <div>
                    <h2 className="font-kinetic text-xl md:text-2xl font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark flex items-center gap-2">
                      <MdEdit className="text-cyan-500" /> Editar Dados da Loja
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mantenha as informações de contato, endereço e razão social da sua unidade atualizadas.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveStoreData} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Nome Fantasia *
                      </label>
                      <input
                        type="text"
                        name="tradeName"
                        value={formData.tradeName}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: Casa Tri Bicycles"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Razão Social
                      </label>
                      <input
                        type="text"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: Casa Tri Comércio de Bicicletas LTDA"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        E-mail da Loja
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="contato@sualoja.com.br"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleFormChange}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Ex: Av. Professor Manuel José Chaves, 266 - Alto de Pinheiros"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="São Paulo"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                          Estado (UF) *
                        </label>
                        <select
                          name="state"
                          value={formData.state}
                          onChange={handleFormChange}
                          required
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                          {STATES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleFormChange}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-cyan-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                          placeholder="05463-000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="submit"
                      disabled={updateStoreMutation.isPending}
                      className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-cyan-700 disabled:opacity-50 transition-all"
                    >
                      <MdSave className="h-4 w-4" />
                      {updateStoreMutation.isPending ? 'Salvando...' : 'Salvar Alterações da Loja'}
                    </button>

                    {storeSuccess && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                        <MdCheckCircle className="h-4 w-4" /> Dados da loja atualizados com sucesso!
                      </span>
                    )}
                  </div>
                </form>
              </KineticCard>
            </AnimatedSection>
          ) : null}

          {/* ── CARD DE LOGOMARCA DA LOJA ── */}
          {store && (
            <AnimatedSection delay={0.3} className="mb-8">
              <KineticCard>
                <div className="mb-6 pb-4 border-b-2 border-kinetic-border dark:border-kinetic-border-dark flex items-center justify-between">
                  <div>
                    <h2 className="font-kinetic text-xl md:text-2xl font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark flex items-center gap-2">
                      <MdImage className="text-cyan-500" /> Logomarca da Loja no Portal do Cliente
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Adicione a imagem da logomarca oficial da sua loja para exibição no card de busca e nos modais dos clientes.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveLogo} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Live Preview Container */}
                    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Preview no Card
                      </p>
                      <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-1 overflow-hidden">
                        {logoUrl.trim() ? (
                          <img
                            src={logoUrl.trim()}
                            alt="Logo da Loja"
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/64?text=Logo';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-cyan-100 text-cyan-700 font-extrabold text-xl rounded-xl">
                            {store.tradeName?.charAt(0) || 'L'}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-2 font-semibold text-center">
                        {formData.tradeName || store.tradeName}
                      </span>
                    </div>

                    {/* URL Input field */}
                    <div className="md:col-span-2 space-y-3">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Link da imagem OU envie um arquivo (PNG, JPG, WebP ou SVG)
                      </label>
                      <input
                        type="text"
                        value={logoUrl.startsWith('data:') ? '' : logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder={logoUrl.startsWith('data:') ? '✔ Imagem enviada' : 'https://sualoja.com.br/logo.png'}
                        disabled={logoUrl.startsWith('data:')}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-900"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => logoFileRef.current?.click()}
                          className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <MdUploadFile className="h-4 w-4" /> Enviar imagem
                        </button>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            <MdDelete className="h-4 w-4" /> Remover
                          </button>
                        )}
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handleLogoFile}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Recomendado: Imagem quadrada (ex: 200x200px) com fundo transparente ou branco.
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={updateLogoMutation.isPending}
                          className="flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cyan-700 disabled:opacity-50 transition-all"
                        >
                          <MdSave className="h-4 w-4" />
                          {updateLogoMutation.isPending ? 'Salvando...' : 'Salvar Logomarca'}
                        </button>

                        {logoSuccess && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-fade-in">
                            <MdCheckCircle className="h-4 w-4" /> Logomarca atualizada com sucesso!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </KineticCard>
            </AnimatedSection>
          )}

          {/* ── INFORMAÇÕES DE ACESSO DO USUÁRIO ── */}
          <AnimatedSection delay={0.35} className="mb-8">
            <KineticCard>
              <div className="mb-4 pb-3 border-b-2 border-kinetic-border dark:border-kinetic-border-dark">
                <h2 className="font-kinetic text-lg font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark">
                  Informações da Conta do Usuário
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="font-kinetic text-xs uppercase tracking-widest font-medium text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark mb-1">
                    Nome do Operador
                  </p>
                  <p className="font-kinetic text-base font-semibold text-kinetic-fg dark:text-kinetic-fg-dark">
                    {user?.name || '—'}
                  </p>
                </div>
                <div>
                  <p className="font-kinetic text-xs uppercase tracking-widest font-medium text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark mb-1">
                    E-mail de Acesso
                  </p>
                  <p className="font-kinetic text-base font-semibold text-kinetic-fg dark:text-kinetic-fg-dark">
                    {user?.email || '—'}
                  </p>
                </div>
                <div>
                  <p className="font-kinetic text-xs uppercase tracking-widest font-medium text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark mb-1">
                    Nível de Acesso
                  </p>
                  <p className="font-kinetic text-base font-semibold text-kinetic-fg dark:text-kinetic-fg-dark">
                    {user?.role === 'LOJA' ? 'Lojista Parceiro' : user?.role || '—'}
                  </p>
                </div>
              </div>
            </KineticCard>
          </AnimatedSection>

          {/* ── NOTA DE SENHA ── */}
          <AnimatedSection delay={0.4}>
            <KineticCard>
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-2.5 w-11 h-11 rounded-xl bg-[#ccd3dd] dark:bg-[#171b21] shadow-[inset_7px_7px_12px_#8a92a0,inset_-6px_-6px_12px_#ffffff] dark:shadow-[inset_7px_7px_12px_#0a0d11,inset_-6px_-6px_12px_#2e353f] flex items-center justify-center text-[#0A1929] dark:text-[#2196F3]">
                  <MdInfo size={22} />
                </div>
                <div>
                  <h3 className="font-kinetic text-lg font-bold uppercase tracking-tight text-kinetic-fg dark:text-kinetic-fg-dark mb-1">
                    Alteração de Senha
                  </h3>
                  <p className="font-kinetic text-sm text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark">
                    Para alterar sua senha de acesso, clique na sua foto ou iniciais no canto superior direito da tela e escolha a opção{' '}
                    <strong className="text-kinetic-fg dark:text-kinetic-fg-dark font-semibold">"Alterar Senha"</strong>.
                  </p>
                </div>
              </div>
            </KineticCard>
          </AnimatedSection>

        </div>
      </div>
    </div>
  );
}
