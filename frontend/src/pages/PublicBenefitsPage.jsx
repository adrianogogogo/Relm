export default function PublicBenefitsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">RELM Club</h1>
        <p className="text-xl text-gray-600 mb-8">
          Clube de benefícios exclusivos para clientes RELM Care+
        </p>
        
        <div className="bg-[#00BCD4] bg-opacity-10 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#00BCD4] mb-4">
            Seja membro do RELM Club!
          </h2>
          <p className="text-gray-700 mb-4">
            Aproveite descontos exclusivos, acesso antecipado a eventos e produtos,
            e muito mais.
          </p>
          <button className="bg-[#00BCD4] text-white px-6 py-3 rounded-lg hover:bg-[#2FC0D3] transition-colors">
            Saiba Mais
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Descontos Exclusivos</h3>
            <p className="text-gray-600">
              Até 30% de desconto em produtos e serviços parceiros
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Acesso Antecipado</h3>
            <p className="text-gray-600">
              Seja o primeiro a conhecer novos produtos e eventos
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cashback</h3>
            <p className="text-gray-600">
              Ganhe até 10% de cashback em suas compras
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Frete Grátis</h3>
            <p className="text-gray-600">
              Frete grátis em compras acima de R$ 300
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
