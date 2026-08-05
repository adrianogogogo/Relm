import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { storesAPI } from '../services/api';
import { fileToLogoDataUrl } from '../utils/imageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KineticCard,
  KineticPageHeader,
  KineticStatCard,
  StatsMarquee,
  NoiseTexture,
  AnimatedSection,
} from '../components/ui/kinetic';
import { MdStorefront, MdPeople, MdLocationOn, MdInfo, MdImage, MdSave, MdCheckCircle, MdUploadFile, MdDelete } from 'react-icons/md';

/**
 * Perfil do lojista logado — inclui dados da loja e gerenciador de Logomarca Oficial.
 */
export default function StoreProfilePage() {
  const { user, setUser } = useAuthStore();
  const store = user?.store;
  const queryClient = useQueryClient();

  const [logoUrl, setLogoUrl] = useState(store?.logoUrl || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const logoFileRef = useRef(null);

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reenviar o mesmo arquivo
    if (!file) return;
    try {
      setLogoUrl(await fileToLogoDataUrl(file));
    } catch (err) {
      alert(err.message || 'Falha ao processar imagem.');
    }
  };

  useEffect(() => {
    if (store?.logoUrl) {
      setLogoUrl(store.logoUrl);
    }
  }, [store]);

  const updateLogoMutation = useMutation({
    mutationFn: (newLogoUrl) => storesAPI.update(store.id, { logoUrl: newLogoUrl }),
    onSuccess: (updatedStore) => {
      queryClient.invalidateQueries({ queryKey: ['public-stores-customer'] });
      queryClient.invalidateQueries({ queryKey: ['store', store?.id] });
      
      // Update local authStore user store object
      if (user && store) {
        setUser({
          ...user,
          store: {
            ...store,
            logoUrl: updatedStore.logoUrl || logoUrl,
          },
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err) => {
      alert(`Erro ao salvar logo da loja: ${err.response?.data?.message || err.message}`);
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

  const fields = [
    { label: 'Nome do Usuário', value: user?.name },
    { label: 'E-mail de Login', value: user?.email },
    { label: 'Cargo', value: user?.role || 'Loja' },
    { label: 'Loja', value: store?.tradeName },
    { label: 'CNPJ', value: store?.cnpj || '—' },
    { label: 'Cidade', value: store?.city },
    { label: 'Estado', value: store?.state },
    { label: 'Telefone', value: store?.phone || '—' },
  ];

  // Stats marquee items
  const marqueeItems = [
    { value: store?.totalCustomers || '0', label: 'Clientes' },
    { value: store?.totalSales || '0', label: 'Vendas' },
    { value: store?.activeWarranties || '0', label: 'Garantias Ativas' },
    { value: store?.city || '—', label: 'Localização' },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Noise texture overlay */}
      <NoiseTexture />

      <div className="py-8 px-4 md:px-8">
        <div className="max-w-[90vw] lg:max-w-5xl mx-auto space-y-0">

          {/* ── KINETIC PAGE HEADER ── */}
          <AnimatedSection className="mb-2">
            <KineticPageHeader
              name={store?.tradeName || user?.name || 'Minha Loja'}
              subtitle={user?.email}
              badge={user?.role === 'LOJA' ? 'Lojista Parceiro' : user?.role}
              initial={store?.tradeName?.charAt(0) || user?.name?.charAt(0)}
            />
          </AnimatedSection>

          {/* ── STATS MARQUEE ── */}
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

          {/* ── CARD DE LOGOMARCA DA LOJA (Onda 8) ── */}
          {store && (
            <AnimatedSection delay={0.25} className="mb-8">
              <KineticCard>
                <div className="mb-6 pb-4 border-b-2 border-kinetic-border dark:border-kinetic-border-dark flex items-center justify-between">
                  <div>
                    <h2 className="font-kinetic text-xl md:text-2xl font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark flex items-center gap-2">
                      <MdImage className="text-cyan-500" /> Logomarca da Loja no Portal do Cliente
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Adicione o link da imagem da logomarca oficial da sua loja para exibição no card de busca e nos modais dos clientes.
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
                      <span className="text-[10px] text-slate-400 mt-2 font-semibold">
                        {store.tradeName}
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

                        {saveSuccess && (
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

          {/* ── CARD DE INFORMAÇÕES ── */}
          <AnimatedSection delay={0.3} className="mb-8">
            <KineticCard>
              <div className="mb-8 pb-6 border-b-2 border-kinetic-border dark:border-kinetic-border-dark">
                <h2 className="font-kinetic text-2xl md:text-3xl font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark">
                  Dados do Perfil
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {fields.map((f) => (
                  <div key={f.label} className="group/field">
                    <p className="font-kinetic text-xs uppercase tracking-widest font-medium text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark mb-1">
                      {f.label}
                    </p>
                    <p className="font-kinetic text-lg font-semibold text-kinetic-fg dark:text-kinetic-fg-dark group-hover/field:translate-x-2 transition-transform duration-300">
                      {f.value || '—'}
                    </p>
                  </div>
                ))}
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
