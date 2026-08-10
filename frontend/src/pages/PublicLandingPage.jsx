import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { marketingAPI, storesAPI } from '../services/api';
import { MdDirectionsBike, MdVerifiedUser, MdStars, MdCheckCircle, MdLocationOn, MdArrowForward, MdLaunch } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

export default function PublicLandingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');

  const [page, setPage] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await marketingAPI.getPublicBySlug(slug);
        setPage(data);

        // Target store override from URL parameter or page definition
        const activeStoreId = storeId || data.storeId;
        if (activeStoreId) {
          try {
            const storeData = await storesAPI.getById(activeStoreId);
            setStore(storeData);
          } catch (e) {
            console.warn('Store not found for ID:', activeStoreId);
          }
        }
      } catch (err) {
        console.error('Error loading landing page:', err);
        setError('Página não encontrada ou temporariamente indisponível.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, storeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Página Não Encontrada</h1>
        <p className="text-slate-400 mb-6">{error || 'A Landing Page solicitada não existe.'}</p>
        <Link to="/" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium">
          Voltar ao Início
        </Link>
      </div>
    );
  }

  const blocks = Array.isArray(page.blocksJson) ? page.blocksJson : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Header Banner with Store Branding */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            R
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-tight">RELM CARE+</span>
            {store && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <MdLocationOn className="w-3.5 h-3.5" /> Unidade Parceira: {store.tradeName} ({store.city}/{store.state})
              </span>
            )}
          </div>
        </div>

        {store && store.phone && (
          <a
            href={`https://wa.me/55${store.phone.replace(/\D/g, '')}?text=Olá! Vi a oferta da Relm Care+ e gostaria de mais informações.`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition text-sm shadow-md shadow-emerald-500/10"
          >
            <FaWhatsapp className="w-4 h-4" />
            Falar com a Loja
          </a>
        )}
      </header>

      {/* Dynamic Blocks Renderer */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'HERO':
              return (
                <section key={idx} className="text-center py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="max-w-3xl mx-auto relative z-10 space-y-6">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold tracking-wider uppercase border border-emerald-500/20">
                      Oferta Exclusiva Relm Care+
                    </span>
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
                      {block.title || page.title}
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed">
                      {block.subtitle || page.description}
                    </p>
                    <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                      <a
                        href={block.ctaUrl || '#cta'}
                        className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-lg transition shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                      >
                        {block.ctaText || 'Garantir Meu Benefício'}
                        <MdArrowForward className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </section>
              );

            case 'FEATURES':
              return (
                <section key={idx} className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <h2 className="text-3xl font-bold text-white">{block.title || 'Por Que Escolher a Relm Care+'}</h2>
                    {block.subtitle && <p className="text-slate-400">{block.subtitle}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(block.items || []).map((item, fIdx) => (
                      <div key={fIdx} className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                          <MdCheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case 'PRICING':
              return (
                <section key={idx} className="space-y-8 py-8">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-white">{block.title || 'Planos do Clube Relm'}</h2>
                    {block.subtitle && <p className="text-slate-400 mt-2">{block.subtitle}</p>}
                  </div>
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 space-y-6">
                      <h3 className="text-2xl font-bold text-white">Plano Care</h3>
                      <div className="text-4xl font-extrabold text-white">Gratuito</div>
                      <ul className="space-y-3 text-slate-300 text-sm">
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Registro de Garantia Digital</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Pontuação Acumulativa em Vendas</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Histórico de Compras 360°</li>
                      </ul>
                    </div>

                    <div className="p-8 bg-gradient-to-b from-emerald-950/40 to-slate-900 rounded-3xl border-2 border-emerald-500 relative space-y-6 shadow-xl shadow-emerald-500/10">
                      <span className="absolute -top-4 right-8 bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                        Recomendado
                      </span>
                      <h3 className="text-2xl font-bold text-white">Plano Plus</h3>
                      <div className="text-4xl font-extrabold text-emerald-400">R$ 299 <span className="text-base font-normal text-slate-400">/ano</span></div>
                      <ul className="space-y-3 text-slate-200 text-sm">
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Todos os benefícios do Care</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Pontos Mensais Renováveis (uso-ou-perde)</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Resgate de Serviços de Oficina Gratuitos</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-4 h-4 text-emerald-400" /> Descontos e Vouchers Exclusivos</li>
                      </ul>
                    </div>
                  </div>
                </section>
              );

            case 'CTA_BANNER':
              return (
                <section id="cta" key={idx} className="p-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-3xl font-extrabold">{block.title || 'Pronto para Começar?'}</h2>
                    <p className="text-emerald-950 font-medium">{block.subtitle || 'Entre em contato ou visite a unidade mais próxima.'}</p>
                  </div>
                  {store && store.phone ? (
                    <a
                      href={`https://wa.me/55${store.phone.replace(/\D/g, '')}?text=Quero%20me%20cadastrar%20no%20Relm%20Care+`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl transition shadow-xl shrink-0 flex items-center gap-2"
                    >
                      <FaWhatsapp className="w-5 h-5 text-emerald-400" />
                      Falar no WhatsApp
                    </a>
                  ) : (
                    <Link
                      to="/login"
                      className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white font-bold rounded-xl transition shadow-xl shrink-0"
                    >
                      Acessar Plataforma
                    </Link>
                  )}
                </section>
              );

            default:
              return null;
          }
        })}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-6 text-center text-slate-500 text-sm space-y-2">
        <p>© {new Date().getFullYear()} Relm Bikes. Todos os direitos reservados.</p>
        {store && (
          <p className="text-slate-400">
            Página da loja parceira: <strong>{store.tradeName}</strong> ({store.city} - {store.state})
          </p>
        )}
      </footer>
    </div>
  );
}
