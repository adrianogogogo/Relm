import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { healthAPI } from '../services/api';
import StoreLocator from '../components/StoreLocator';

export default function HomePage() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => healthAPI.check().then((res) => res.data),
  });

  const features = [
    {
      icon: '🛡️',
      title: 'Garantias',
      description:
        'Gerencie solicitações de garantia com rastreamento completo de status.',
      link: '/garantia',
    },
    {
      icon: '🎁',
      title: 'Clube de Vantagens',
      description:
        'Benefícios exclusivos para clientes, lojas e distribuidores.',
      link: '/vantagens',
    },
    {
      icon: '🏍️',
      title: 'Seguro',
      description: 'Cotação de seguros integrada para proteção completa.',
      link: '/seguro',
    },
    {
      icon: '📅',
      title: 'Eventos',
      description: 'Participe de eventos exclusivos da Relm Bikes.',
      link: '/eventos',
    },
    {
      icon: '📧',
      title: 'Newsletter',
      description: 'Fique por dentro das novidades e lançamentos.',
      link: '/newsletter',
    },
    {
      icon: '👥',
      title: 'Portais',
      description: 'Acesso dedicado para clientes, lojas e distribuidores.',
      link: '/login',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-secondary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Bem-vindo ao Relm Care+
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-50">
            Sistema de CRM e Garantias para Relm Bikes
          </p>
          
          {health && (
            <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8">
              <span className="text-white font-semibold">
                ✅ API Online | Database: {health.database} | Uptime: {Math.floor(health.uptime)}s
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/garantia" className="btn bg-white text-primary hover:bg-primary-50">
              Solicitar Garantia
            </Link>
            <Link to="/vantagens" className="btn border-2 border-white text-white hover:bg-white hover:text-primary">
              Ver Vantagens
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Nossos Serviços
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="card hover:scale-105 transition-transform"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Store Locator */}
      <StoreLocator />

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para começar?</h2>
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
