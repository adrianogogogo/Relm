export default function PublicEventsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Eventos RELM</h1>
        <p className="text-xl text-gray-600 mb-8">
          Participe dos nossos eventos exclusivos
        </p>
        
        <div className="bg-[#00BCD4] bg-opacity-10 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#00BCD4] mb-4">
            Próximos Eventos
          </h2>
          <p className="text-gray-700 mb-4">
            Fique por dentro dos próximos eventos, pedais, workshops e encontros
            da comunidade RELM Care+.
          </p>
          <button className="bg-[#00BCD4] text-white px-6 py-3 rounded-lg hover:bg-[#2FC0D3] transition-colors">
            Ver Calendário
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Pedal da Primavera</h3>
                <p className="text-gray-600">15 de Março de 2026</p>
              </div>
              <span className="bg-[#00FF8E] text-gray-900 px-3 py-1 rounded text-sm font-medium">
                Em Breve
              </span>
            </div>
            <p className="text-gray-700 mb-4">
              Pedal de 50km pela Serra da Mantiqueira. Café da manhã e almoço inclusos.
            </p>
            <button className="text-[#00BCD4] hover:underline font-medium">
              Saiba mais →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Workshop de Manutenção</h3>
                <p className="text-gray-600">22 de Março de 2026</p>
              </div>
              <span className="bg-[#00FF8E] text-gray-900 px-3 py-1 rounded text-sm font-medium">
                Vagas Limitadas
              </span>
            </div>
            <p className="text-gray-700 mb-4">
              Aprenda a fazer manutenções básicas em sua bike com nossos especialistas.
            </p>
            <button className="text-[#00BCD4] hover:underline font-medium">
              Saiba mais →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Encontro RELM Club</h3>
                <p className="text-gray-600">30 de Março de 2026</p>
              </div>
              <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded text-sm font-medium">
                Planejando
              </span>
            </div>
            <p className="text-gray-700 mb-4">
              Encontro mensal dos membros do RELM Club. Networking e novidades.
            </p>
            <button className="text-[#00BCD4] hover:underline font-medium">
              Saiba mais →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
