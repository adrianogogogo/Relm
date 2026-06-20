export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-title text-xl font-bold mb-4">Relm Care+</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sistema de CRM e Garantias para Relm Bikes. Gestão completa de
              garantias, vantagens, eventos e muito mais.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="/" className="hover:text-primary-200 transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a
                  href="/garantia"
                  className="hover:text-primary-200 transition-colors"
                >
                  Garantia
                </a>
              </li>
              <li>
                <a
                  href="/vantagens"
                  className="hover:text-primary-200 transition-colors"
                >
                  Vantagens
                </a>
              </li>
              <li>
                <a
                  href="/eventos"
                  className="hover:text-primary-200 transition-colors"
                >
                  Eventos
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="/newsletter"
                  className="hover:text-primary-200 transition-colors"
                >
                  Newsletter
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-primary-200 transition-colors">
                  Portal do Cliente
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-slate-400">
          <p>
            &copy; {currentYear} Relm Bikes. Todos os direitos reservados. |
            Versão 1.0.0
          </p>
          <p className="mt-1">Desenvolvido por GogoLab</p>
        </div>
      </div>
    </footer>
  );
}
