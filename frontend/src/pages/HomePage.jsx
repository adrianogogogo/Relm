import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdVerifiedUser, MdCardGiftcard, MdDescription, MdEvent, MdEmail } from 'react-icons/md';
import { healthAPI } from '../services/api';
import StoreLocator from '../components/StoreLocator';
import BannerCarousel from '../components/BannerCarousel';
import { KineticCard, KineticButton } from '../components/ui/kinetic';

export default function HomePage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthAPI.check().then((res) => res.data),
  });

  const features = [
    {
      icon: MdVerifiedUser,
      title: 'Garantias',
      description:
        'Gerencie solicitações de garantia com rastreamento completo de status.',
      link: '/garantia',
    },
    {
      icon: MdCardGiftcard,
      title: 'Clube de Vantagens',
      description:
        'Benefícios exclusivos para clientes, lojas e distribuidores.',
      link: '/vantagens',
    },
    {
      icon: MdDescription,
      title: 'Seguro',
      description: 'Cotação de seguros integrada para proteção completa.',
      link: '/seguro',
    },
    {
      icon: MdEvent,
      title: 'Eventos',
      description: 'Participe de eventos exclusivos da Relm Bikes.',
      link: '/eventos',
    },
    {
      icon: MdEmail,
      title: 'Newsletter',
      description: 'Fique por dentro das novidades e lançamentos.',
      link: '/newsletter',
    },
  ];

  return (
    <div className="min-h-screen bg-[#e0e5ec] text-[#2d3436]">
      {/* Banner Carousel */}
      <div className="px-4 py-6">
        <BannerCarousel audience="PUBLIC" page="home" />
      </div>

      {/* Features Grid */}
      <section className="py-12 bg-[#e0e5ec]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 font-sans">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#183757] bg-[#d1d9e6] px-3 py-1 rounded-full shadow-[inset_1px_1px_3px_#babecc,inset_-1px_-1px_3px_#ffffff]">
              SISTEMA DE MÓDULOS RELM
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-[#2d3436] mt-3">
              Nossos Serviços
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link key={index} to={feature.link} className="block group">
                  <KineticCard className="h-full flex flex-col justify-between p-8">
                    <div>
                      <div className="mb-5 text-[#183757] p-3.5 w-14 h-14 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Icon size={32} />
                      </div>
                      <h3 className="font-sans text-xl font-bold uppercase tracking-tight text-[#2d3436] mb-2 group-hover:text-[#183757] transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-[#4a5568] text-sm leading-relaxed font-medium">
                        {feature.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#babecc]/30 flex items-center justify-between text-xs font-mono font-bold text-[#183757] uppercase tracking-wider">
                      <span>ACESSAR MÓDULO</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </KineticCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Store Locator */}
      <div className="py-6 container mx-auto px-4">
        <StoreLocator />
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-[#e0e5ec]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto p-10 rounded-3xl bg-[#e0e5ec] shadow-[12px_12px_24px_#babecc,-12px_-12px_24px_#ffffff] border border-white/60">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#183757] bg-[#d1d9e6] px-3.5 py-1 rounded-full shadow-[inset_1px_1px_3px_#babecc]">
              ACESSO COMPLETO AO SISTEMA
            </span>
            <h2 className="font-sans text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[#2d3436] mt-4 mb-4">
              Pronto para começar?
            </h2>
            <p className="text-base md:text-lg text-[#4a5568] mb-8 font-medium max-w-xl mx-auto">
              Tenha acesso completo ao sistema de garantias, vantagens exclusivas e muito mais.
            </p>
            <Link to="/login" className="inline-block">
              <KineticButton variant="primary" size="lg">
                Acessar Portal do Cliente / Loja
              </KineticButton>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
