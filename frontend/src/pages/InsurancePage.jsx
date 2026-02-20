export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold mb-4">Cotação de Seguro</h1>
            <p className="text-gray-600 mb-8">
              Proteja sua bike com nossos planos de seguro especiais.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
              <p className="text-blue-700">
                🚧 Funcionalidade em desenvolvimento. Em breve você poderá cotar seguros
                diretamente pelo portal!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-4xl mb-3">🛡️</div>
                <h3 className="font-bold text-lg mb-2">Proteção Total</h3>
                <p className="text-sm text-gray-600">Cobertura completa contra roubo e danos</p>
              </div>
              <div className="card text-center">
                <div className="text-4xl mb-3">💰</div>
                <h3 className="font-bold text-lg mb-2">Melhor Preço</h3>
                <p className="text-sm text-gray-600">Condições especiais para clientes Relm</p>
              </div>
              <div className="card text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-lg mb-2">Cotação Rápida</h3>
                <p className="text-sm text-gray-600">Receba sua cotação em minutos</p>
              </div>
            </div>

            <div className="text-center">
              <a href="/" className="btn btn-outline">
                Voltar para Início
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
