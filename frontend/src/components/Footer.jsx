export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#e0e5ec] text-[#2d3436] border-t border-[#babecc]/50 mt-auto font-sans">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Panel */}
          <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[inset_3px_3px_6px_#babecc,inset_-3px_-3px_6px_#ffffff] border border-white/40 font-mono">
            <h3 className="font-sans text-lg font-bold uppercase tracking-wider text-[#183757] mb-3">Relm Care+</h3>
            <p className="text-[#4a5568] text-xs leading-relaxed font-medium">
              Sistema de CRM e Garantias para Relm Bikes. Gestão completa de
              garantias, vantagens, eventos e muito mais.
            </p>
          </div>

          {/* Links */}
          <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#babecc,-8px_-8px_16px_#ffffff] border border-white/60">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#183757] mb-3">Links Rápidos</h4>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-[#4a5568]">
              <li>
                <a href="/" className="hover:text-[#183757] transition-colors">
                  /// Início
                </a>
              </li>
              <li>
                <a href="/garantia" className="hover:text-[#183757] transition-colors">
                  /// Garantia
                </a>
              </li>
              <li>
                <a href="/vantagens" className="hover:text-[#183757] transition-colors">
                  /// Vantagens
                </a>
              </li>
              <li>
                <a href="/eventos" className="hover:text-[#183757] transition-colors">
                  /// Eventos
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="p-5 rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#babecc,-8px_-8px_16px_#ffffff] border border-white/60">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#183757] mb-3">Suporte & Acesso</h4>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider text-[#4a5568]">
              <li>
                <a href="/newsletter" className="hover:text-[#183757] transition-colors">
                  /// Newsletter
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-[#183757] transition-colors">
                  /// Portal do Cliente
                </a>
              </li>
              <li>
                <a href="/validar-garantia/check" className="hover:text-[#183757] transition-colors">
                  /// Validar Garantia
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#babecc]/40 mt-8 pt-6 text-center text-xs font-mono text-[#4a5568]">
          <p className="font-bold">
            &copy; {currentYear} RELM BIKES. TODOS OS DIREITOS RESERVADOS. | VERSÃO 1.0.0
          </p>
          <p className="mt-1 text-[10px] uppercase">Desenvolvido por GogoLab</p>
        </div>
      </div>
    </footer>
  );
}
