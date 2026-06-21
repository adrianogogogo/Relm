import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdVerifiedUser, MdCardGiftcard, MdDescription, MdEvent, MdEmail } from 'react-icons/md';
import { healthAPI } from '../services/api';
import StoreLocator from '../components/StoreLocator';
import BannerCarousel from '../components/BannerCarousel';

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
    <div className="min-h-screen">
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Features Grid */}
      <section className="py-16 bg-app dark:bg-app-dark">
        <div className="container mx-auto px-4">
          <h2 className="font-title text-4xl font-bold text-center mb-12">
            Nossos Serviços
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="text-primary dark:text-primary-400 mb-4 flex justify-center">
                  <feature.icon size={48} />
                </div>
                <h3 className="font-title text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Store Locator */}
      <StoreLocator />

      {/* CTA Section */}
      <section className="py-16 bg-white dark:bg-surface-dark">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-title text-4xl font-bold mb-6">Pronto para começar?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Tenha acesso completo ao sistema de garantias, vantagens exclusivas
            e muito mais.
          </p>
          <Link to="/login" className="btn btn-primary text-lg">
            Acessar Portal
          </Link>
        </div>
      </section>
    </div>
  );
}
