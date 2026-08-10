import React, { useState, useEffect } from 'react';
import { marketingAPI, storesAPI } from '../services/api';
import AiMarketingModal from '../components/AiMarketingModal';
import { MdImage, MdAdd, MdVisibility, MdShare, MdStars, MdDelete, MdCheckCircle, MdEdit, MdLaunch, MdAutorenew, MdContentCopy, MdCheck } from 'react-icons/md';

export default function AdminLandingPagesPage() {
  const [pages, setPages] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [copiedSlug, setCopiedSlug] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  // Blocks
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [ctaTitle, setCtaTitle] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [pagesData, storesData] = await Promise.all([
        marketingAPI.getAll(),
        storesAPI.getAll(),
      ]);
      setPages(pagesData || []);
      setStores(storesData || []);
    } catch (err) {
      console.error('Erro ao carregar landing pages:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setActive(true);
    setHeroTitle('');
    setHeroSubtitle('');
    setCtaTitle('');
    setShowModal(true);
  }

  function handleOpenEdit(page) {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setDescription(page.description || '');
    setActive(page.active);

    const blocks = Array.isArray(page.blocksJson) ? page.blocksJson : [];
    const hero = blocks.find((b) => b.type === 'HERO');
    const cta = blocks.find((b) => b.type === 'CTA_BANNER');

    setHeroTitle(hero?.title || '');
    setHeroSubtitle(hero?.subtitle || '');
    setCtaTitle(cta?.title || '');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const blocksJson = [
        {
          type: 'HERO',
          title: heroTitle || title,
          subtitle: heroSubtitle || description,
          ctaText: 'Quero Ser Membro Plus',
        },
        {
          type: 'FEATURES',
          title: 'Vantagens do Clube Relm Care+',
          items: [
            { title: 'Revisão Preventiva Mensal', description: 'Serviço de oficina gratuito incluído para assinantes.' },
            { title: 'Garantia Digital Protegida', description: 'Registro e acompanhamento por número de série.' },
            { title: 'Pontos que Valem Descontos', description: 'Acumule em compras e resgate prêmios ou serviços.' },
          ],
        },
        {
          type: 'PRICING',
          title: 'Planos Disponíveis',
        },
        {
          type: 'CTA_BANNER',
          title: ctaTitle || 'Garanta Sua Vantagem Agora!',
          subtitle: 'Fale com nossa equipe ou consulte uma loja parceira.',
        },
      ];

      const payload = {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description,
        blocksJson,
        active,
      };

      if (editingId) {
        await marketingAPI.update(editingId, payload);
      } else {
        await marketingAPI.create(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao salvar Landing Page.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja excluir esta Landing Page?')) return;
    try {
      await marketingAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Erro ao excluir página.');
    }
  }

  function handleCopyShareLink(pageSlug) {
    const origin = window.location.origin;
    let url = `${origin}/lp/${pageSlug}`;
    if (selectedStoreId) {
      url += `?storeId=${selectedStoreId}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedSlug(pageSlug);
    setTimeout(() => setCopiedSlug(''), 2000);
  }

  function handleApplyAiCopy(aiResult) {
    if (aiResult.hero) {
      setHeroTitle(aiResult.hero.title || '');
      setHeroSubtitle(aiResult.hero.subtitle || '');
    }
    if (aiResult.heading) {
      setTitle(aiResult.heading.replace(/[^\w\s]/gi, ''));
    }
    if (aiResult.content) {
      setDescription(aiResult.content);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MdImage className="w-6 h-6 text-emerald-400" />
            Gestão de Landing Pages
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Crie páginas promocionais em blocos e compartilhe URLs personalizadas por loja parceira.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl transition flex items-center gap-2 border border-emerald-500/20 text-sm"
          >
            <MdStars className="w-4 h-4" />
            Assistente IA
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
          >
            <MdAdd className="w-4 h-4" />
            Nova Landing Page
          </button>
        </div>
      </div>

      {/* Select Store for Share Links */}
      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <MdShare className="w-4 h-4 text-emerald-400" />
          Gerar link de compartilhamento para loja parceira:
        </span>
        <select
          value={selectedStoreId}
          onChange={(e) => setSelectedStoreId(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500 max-w-xs"
        >
          <option value="">Nenhuma (Link Genérico Relm)</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.tradeName} ({s.city})
            </option>
          ))}
        </select>
      </div>

      {/* Landing Pages Table / List */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">Carregando landing pages...</div>
      ) : pages.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
          <MdImage className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-medium">Nenhuma Landing Page criada ainda.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg"
          >
            Criar Minha Primeira Página
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      page.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {page.active ? 'Ativa' : 'Rascunho'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MdVisibility className="w-3.5 h-3.5 text-slate-500" /> {page.viewCount} visualizações
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white line-clamp-1">{page.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{page.description || 'Sem descrição.'}</p>
                <div className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-1 rounded inline-block">
                  /lp/{page.slug}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={`/lp/${page.slug}${selectedStoreId ? `?storeId=${selectedStoreId}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <MdLaunch className="w-3.5 h-3.5" /> Ver Página
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyShareLink(page.slug)}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                    title="Copiar Link Compartilhável"
                  >
                    {copiedSlug === page.slug ? <MdCheck className="w-4 h-4 text-emerald-400" /> : <MdShare className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(page)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Editar"
                  >
                    <MdEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(page.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Excluir"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Construtor de Landing Page */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-white">
              {editingId ? 'Editar Landing Page' : 'Criar Nova Landing Page'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título Principal</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campanha Pedal de Primavera Relm Care+"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug da URL (/lp/:slug)</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ex: pedal-primavera"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Subtítulo</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição da oferta ou evento..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Configuração de Blocos Visuais</h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Bloco Hero (Destaque)</label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Garantia Digital & Revisão Inclusa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subtítulo Hero</label>
                  <input
                    type="text"
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    placeholder="Sua bike protegida e com pontos que valem prêmios."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Título da Chamada de Ação Final (CTA)</label>
                  <input
                    type="text"
                    value={ctaTitle}
                    onChange={(e) => setCtaTitle(e.target.value)}
                    placeholder="Garanta Suas Vantagens Hoje!"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="activeCheck" className="text-xs text-slate-300">
                  Página Ativa e Pública
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
              >
                Salvar Landing Page
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal IA Assistant */}
      <AiMarketingModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyCopy={handleApplyAiCopy}
      />
    </div>
  );
}
