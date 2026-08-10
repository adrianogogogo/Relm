import React, { useState, useEffect } from 'react';
import { marketingAPI, storesAPI, aiAssistantAPI } from '../services/api';
import WysiwygPreview from '../components/WysiwygPreview';
import { MdStars, MdAdd, MdImage, MdShare, MdCheck, MdLaunch, MdDelete, MdEdit, MdCheckCircle, MdAutorenew, MdArrowForward } from 'react-icons/md';

export default function AdminLandingPagesPage() {
  const [pages, setPages] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mode: 'LIST' | 'CREATE_MAGIC' | 'EDIT_WYSIWYG'
  const [mode, setMode] = useState('LIST');

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Active Editing Page State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [copiedSlug, setCopiedSlug] = useState('');
  const [saving, setSaving] = useState(false);

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
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Magic AI Landing Page Generation
  async function handleMagicGenerate(e) {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setGenerating(true);
      const copyRes = await aiAssistantAPI.generateCopy({
        prompt: aiPrompt,
        type: 'LANDING_PAGE',
      });

      const mainTitle = copyRes.hero?.title || aiPrompt;
      const mainSub = copyRes.hero?.subtitle || 'Aproveite esta vantagem exclusiva do Clube Relm Care+';

      const generatedBlocks = [
        {
          type: 'HERO',
          title: mainTitle,
          subtitle: mainSub,
          ctaText: 'Quero Garantir Minha Oferta',
          imageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        },
        {
          type: 'FEATURES',
          title: 'Por Que Participar Desta Promoção',
          items: [
            { title: 'RevisãoPreventiva Inclusa', description: 'Atendimento prioritário na oficina credenciada.' },
            { title: 'Pontos em Dobro', description: 'Acumule pontos extras para resgatar prêmios e vouchers.' },
            { title: 'Garantia Digital Protegida', description: 'Registro em tempo real por número de série.' },
          ],
        },
        {
          type: 'PRICING',
          title: 'Escolha Seu Plano',
        },
        {
          type: 'CTA_BANNER',
          title: 'Garanta Suas Vantagens Hoje!',
          subtitle: 'Fale com a loja parceira mais próxima no WhatsApp.',
        },
      ];

      setEditingId(null);
      setTitle(mainTitle);
      setSlug(mainTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-'));
      setDescription(mainSub);
      setBlocks(generatedBlocks);
      setMode('EDIT_WYSIWYG');
    } catch (err) {
      alert('Erro ao gerar página com IA.');
    } finally {
      setGenerating(false);
    }
  }

  // Open Edit Existing Page in WYSIWYG
  function handleOpenEdit(page) {
    setEditingId(page.id);
    setTitle(page.title);
    setSlug(page.slug);
    setDescription(page.description || '');
    setSelectedStoreId(page.storeId || '');
    setBlocks(Array.isArray(page.blocksJson) ? page.blocksJson : []);
    setMode('EDIT_WYSIWYG');
  }

  // Save Page
  async function handleSavePage() {
    try {
      setSaving(true);
      const payload = {
        title,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        description,
        blocksJson: blocks,
        active: true,
        storeId: selectedStoreId || null,
      };

      if (editingId) {
        await marketingAPI.update(editingId, payload);
      } else {
        await marketingAPI.create(payload);
      }

      setMode('LIST');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao salvar Landing Page.');
    } finally {
      setSaving(false);
    }
  }

  // Delete Page
  async function handleDelete(id) {
    if (!confirm('Deseja excluir esta Landing Page?')) return;
    try {
      await marketingAPI.delete(id);
      loadData();
    } catch (err) {
      alert('Erro ao excluir.');
    }
  }

  function handleCopyShareLink(pageSlug, storeIdParam) {
    const origin = window.location.origin;
    let url = `${origin}/lp/${pageSlug}`;
    if (storeIdParam) url += `?storeId=${storeIdParam}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(pageSlug);
    setTimeout(() => setCopiedSlug(''), 2000);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MdImage className="w-6 h-6 text-emerald-400" />
            Criador Mágico de Landing Pages
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gere páginas promocionais instantâneas com IA e edite tudo clicando diretamente sobre o preview.
          </p>
        </div>
        {mode === 'LIST' && (
          <button
            onClick={() => setMode('CREATE_MAGIC')}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl transition flex items-center gap-2 text-sm shadow-xl shadow-emerald-500/20"
          >
            <MdStars className="w-5 h-5" />
            Criar Nova Página com IA
          </button>
        )}
      </div>

      {/* MODE 1: LISTING LANDING PAGES */}
      {mode === 'LIST' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Carregando landing pages...</div>
          ) : pages.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800 space-y-4">
              <MdStars className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-lg font-bold text-white">Nenhuma Landing Page Criada</h3>
                <p className="text-sm text-slate-400">Digite uma frase sobre sua promoção e deixe a IA criar a página completa em segundos.</p>
              </div>
              <button
                onClick={() => setMode('CREATE_MAGIC')}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition"
              >
                Criar Minha Primeira Página Agora
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
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Ativa
                      </span>
                      <span className="text-xs text-slate-400">{page.viewCount} acessos</span>
                    </div>

                    <h3 className="text-lg font-bold text-white line-clamp-1">{page.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{page.description || 'Sem descrição.'}</p>
                    <div className="text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-1 rounded inline-block">
                      /lp/{page.slug}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`/lp/${page.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <MdLaunch className="w-3.5 h-3.5" /> Ver Pública
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyShareLink(page.slug, page.storeId)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                        title="Copiar Link"
                      >
                        {copiedSlug === page.slug ? <MdCheck className="w-4 h-4 text-emerald-400" /> : <MdShare className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(page)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                        title="Editar no Preview"
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
        </div>
      )}

      {/* MODE 2: MAGIC AI PROMPT BOX */}
      {mode === 'CREATE_MAGIC' && (
        <div className="max-w-2xl mx-auto bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <MdStars className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">O que você deseja divulgar hoje?</h2>
            <p className="text-sm text-slate-400">
              Descreva em linguagem simples sua promoção ou evento. A IA cuidará do layout, títulos e fotos automaticamente.
            </p>
          </div>

          <form onSubmit={handleMagicGenerate} className="space-y-4">
            <textarea
              rows={4}
              required
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Promoção de revisão preventiva com desconto de 20% e acúmulo de pontos em dobro para o mês do ciclista..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 shadow-inner"
            />

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMode('LIST')}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={generating || !aiPrompt.trim()}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm transition flex items-center gap-2 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <MdAutorenew className="w-5 h-5 animate-spin" />
                    Gerando Página Completa...
                  </>
                ) : (
                  <>
                    <MdStars className="w-5 h-5" />
                    Gerar Landing Page com IA
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODE 3: WYSIWYG EDITING PREVIEW MODE */}
      {mode === 'EDIT_WYSIWYG' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setMode('LIST')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition"
              >
                ← Voltar sem salvar
              </button>
              <div>
                <span className="text-xs text-slate-400 block">Vincular a uma Loja Parceira (Opcional):</span>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="">Nenhuma (Link Genérico Relm)</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.tradeName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleSavePage}
              disabled={saving}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl transition flex items-center gap-2 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
            >
              {saving ? 'Publicando...' : '🚀 Publicar Página Agora'}
            </button>
          </div>

          {/* Interactive WYSIWYG Live Preview */}
          <WysiwygPreview
            blocks={blocks}
            onUpdateBlocks={setBlocks}
            store={stores.find((s) => s.id === selectedStoreId)}
          />
        </div>
      )}
    </div>
  );
}
