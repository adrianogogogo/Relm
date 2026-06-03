export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Relm Care+</h3>
            <p className="text-gray-400 text-sm">
              Sistema de CRM e Garantias para Relm Bikes. Gestão completa de
              garantias, vantagens, eventos e muito mais.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="/" className="hover:text-secondary transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a
                  href="/garantia"
                  className="hover:text-secondary transition-colors"
                >
                  Garantia
                </a>
              </li>
              <li>
                <a
                  href="/vantagens"
                  className="hover:text-secondary transition-colors"
                >
                  Vantagens
                </a>
              </li>
              <li>
                <a
                  href="/eventos"
                  className="hover:text-secondary transition-colors"
                >
                  Eventos
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href="http://191.252.217.190:3005/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-secondary transition-colors"
                >
                  Documentação da API
                </a>
              </li>
              <li>
                <a
                  href="/newsletter"
                  className="hover:text-secondary transition-colors"
                >
                  Newsletter
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-secondary transition-colors">
                  Portal do Cliente
                </a>
              </li>
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="font-semibold mb-4">Tecnologia</h4>
            <p className="text-sm text-gray-400 mb-2">
              Backend: NestJS + PostgreSQL
            </p>
            <p className="text-sm text-gray-400 mb-2">
              Frontend: React + Vite
            </p>
            <p className="text-sm text-gray-400">Auth: JWT + RBAC</p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>
            &copy; {currentYear} Relm Bikes. Todos os direitos reservados. |
            Versão 1.0.0
          </p>
        </div>
      </div>
    </footer>
  );
}
