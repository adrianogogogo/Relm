import { useAuthStore } from '../store/authStore';
import {
  KineticCard,
  KineticPageHeader,
  KineticStatCard,
  StatsMarquee,
  NoiseTexture,
  AnimatedSection,
} from '../components/ui/kinetic';
import { MdStorefront, MdPeople, MdLocationOn, MdInfo } from 'react-icons/md';

/**
 * Perfil do lojista logado (somente leitura no v1) — inclui dados da loja
 * quando disponíveis no usuário do authStore.
 * A troca de senha fica no menu do avatar (TopBarChrome → ChangePasswordModal).
 */
export default function StoreProfilePage() {
  const { user } = useAuthStore();
  const store = user?.store;

  const fields = [
    { label: 'Nome', value: user?.name },
    { label: 'E-mail', value: user?.email },
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
                  <h3 className="font-kinetic text-lg font-bold uppercase tracking-tighter text-kinetic-fg dark:text-kinetic-fg-dark mb-1">
                    Alterar Senha
                  </h3>
                  <p className="font-kinetic text-sm text-kinetic-fg-muted dark:text-kinetic-fg-muted-dark">
                    Para alterar sua senha, use o menu do avatar no topo da tela → "Alterar Senha".
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
