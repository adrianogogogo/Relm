import { MdVerifiedUser, MdAttachMoney, MdBolt, MdWarning } from 'react-icons/md';
import { PageHeader } from '../components/ui';

export default function InsurancePage() {
  return (
    <div className="min-h-screen bg-app dark:bg-app-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card p-8">
            <PageHeader
              title="Cotação de Seguro"
              subtitle="Proteja sua bike com nossos planos de seguro especiais."
            />

            <div className="bg-info/10 border-l-4 border-info p-4 mb-8 flex items-start gap-3 rounded">
              <MdWarning className="text-info shrink-0 mt-0.5" size={20} />
              <p className="text-info-700 dark:text-info-100 text-sm">
                Funcionalidade em desenvolvimento. Em breve você poderá cotar seguros
                diretamente pelo portal!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <div className="text-primary mb-3 flex justify-center"><MdVerifiedUser size={32} /></div>
                <h3 className="font-title font-bold text-lg mb-2">Proteção Total</h3>
                <p className="text-sm text-gray-600">Cobertura completa contra roubo e danos</p>
              </div>
              <div className="card text-center">
                <div className="text-primary mb-3 flex justify-center"><MdAttachMoney size={32} /></div>
                <h3 className="font-title font-bold text-lg mb-2">Melhor Preço</h3>
                <p className="text-sm text-gray-600">Condições especiais para clientes Relm</p>
              </div>
              <div className="card text-center">
                <div className="text-primary mb-3 flex justify-center"><MdBolt size={32} /></div>
                <h3 className="font-title font-bold text-lg mb-2">Cotação Rápida</h3>
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
