import React, { useState } from 'react';
import { MdCheckCircle, MdArrowForward, MdImage, MdUploadFile, MdClose, MdEdit, MdStars } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';

export const STOCK_CYCLING_IMAGES = [
  { id: '1', category: 'WORKSHOP', title: 'Oficina & Manutenção', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80' },
  { id: '2', category: 'MTB_TRAIL', title: 'Mountain Bike em Trilha', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80' },
  { id: '3', category: 'ROAD', title: 'Ciclismo de Estrada & Asfalto', url: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?auto=format&fit=crop&w=1200&q=80' },
  { id: '4', category: 'URBAN', title: 'Bike Urbana & Deslocamento', url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=1200&q=80' },
  { id: '5', category: 'EQUIPMENT', title: 'Capacetes & Equipamentos', url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1200&q=80' },
  { id: '6', category: 'EVENT', title: 'Eventos & Competições de Bike', url: 'https://images.unsplash.com/photo-1571068316344-75ad7692d490?auto=format&fit=crop&w=1200&q=80' },
];

export default function WysiwygPreview({ blocks, onUpdateBlocks, store, storylineCategory, dalleImageUrl }) {
  const [editingImageIdx, setEditingImageIdx] = useState(null);
  const [activeTab, setActiveTab] = useState('SUGGESTIONS'); // 'SUGGESTIONS' | 'UPLOAD'

  // Handle Inline Text Edit
  function handleTextChange(blockIdx, fieldPath, newValue) {
    const updatedBlocks = JSON.parse(JSON.stringify(blocks));
    const block = updatedBlocks[blockIdx];

    if (fieldPath === 'title') block.title = newValue;
    else if (fieldPath === 'subtitle') block.subtitle = newValue;
    else if (fieldPath === 'ctaText') block.ctaText = newValue;
    else if (fieldPath.startsWith('item_title_')) {
      const itemIdx = parseInt(fieldPath.replace('item_title_', ''), 10);
      if (block.items && block.items[itemIdx]) block.items[itemIdx].title = newValue;
    } else if (fieldPath.startsWith('item_desc_')) {
      const itemIdx = parseInt(fieldPath.replace('item_desc_', ''), 10);
      if (block.items && block.items[itemIdx]) block.items[itemIdx].description = newValue;
    }

    onUpdateBlocks(updatedBlocks);
  }

  // Handle Image Change
  function handleSelectImage(url) {
    if (editingImageIdx === null) return;
    const updatedBlocks = JSON.parse(JSON.stringify(blocks));
    updatedBlocks[editingImageIdx].imageUrl = url;
    onUpdateBlocks(updatedBlocks);
    setEditingImageIdx(null);
  }

  // Handle Local File Upload Convert to DataURL
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleSelectImage(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  // Filter gallery photos matching the storyline category
  const filteredStock = STOCK_CYCLING_IMAGES.filter(
    (img) => !storylineCategory || img.category === storylineCategory
  );
  const displayStock = filteredStock.length > 0 ? filteredStock : STOCK_CYCLING_IMAGES;

  return (
    <div className="bg-slate-950 rounded-2xl border border-slate-800 text-slate-100 overflow-hidden shadow-2xl relative">
      {/* Visual Indicator Banner */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-xs text-emerald-400 font-semibold">
        <span className="flex items-center gap-1.5">
          <MdEdit className="w-4 h-4 animate-pulse" />
          Modo de Edição Direta no Preview (Clique sobre os textos ou fotos para alterar)
        </span>
        <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
          Enredo: {storylineCategory || 'Personalizado'}
        </span>
      </div>

      {/* Header Preview */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            R
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block leading-tight">RELM CARE+</span>
            {store && (
              <span className="text-xs text-emerald-400 font-medium">
                Unidade Parceira: {store.tradeName}
              </span>
            )}
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg text-sm">
          <FaWhatsapp className="w-4 h-4" />
          Falar no WhatsApp
        </button>
      </header>

      {/* Dynamic Blocks Preview */}
      <div className="p-6 space-y-16">
        {blocks.map((block, bIdx) => {
          switch (block.type) {
            case 'HERO':
              return (
                <section key={bIdx} className="text-center py-12 px-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 relative overflow-hidden space-y-6">
                  {/* Hero Background Image or Placeholder */}
                  {block.imageUrl ? (
                    <div className="relative h-72 rounded-2xl overflow-hidden mb-6 border border-slate-800 group shadow-xl">
                      <img src={block.imageUrl} alt="Hero Destaque" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditingImageIdx(bIdx)}
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-sm"
                      >
                        <MdImage className="w-5 h-5 text-emerald-400" />
                        Trocar Foto do Destaque (DALL-E 3 / Galeria)
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingImageIdx(bIdx)}
                      className="h-36 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-400 cursor-pointer transition text-xs font-semibold"
                    >
                      <MdImage className="w-5 h-5" />
                      Clique aqui para escolher a foto do destaque do enredo
                    </div>
                  )}

                  <div className="max-w-3xl mx-auto space-y-4">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
                      Oferta Exclusiva Relm Care+
                    </span>

                    {/* Inline Editable Hero Title */}
                    <div className="relative group">
                      <h1
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange(bIdx, 'title', e.target.innerText)}
                        className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight outline-none border-b border-transparent focus:border-emerald-500 hover:bg-slate-800/40 p-2 rounded-lg transition"
                      >
                        {block.title || 'Título da Sua Oferta Aqui'}
                      </h1>
                      <span className="text-[10px] text-slate-500 block text-right pr-2">Clique para editar</span>
                    </div>

                    {/* Inline Editable Hero Subtitle */}
                    <div className="relative group">
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleTextChange(bIdx, 'subtitle', e.target.innerText)}
                        className="text-base text-slate-300 leading-relaxed outline-none border-b border-transparent focus:border-emerald-500 hover:bg-slate-800/40 p-2 rounded-lg transition"
                      >
                        {block.subtitle || 'Subtítulo explicativo da promoção ou evento...'}
                      </p>
                    </div>

                    <div className="pt-2 flex justify-center">
                      <button className="px-8 py-3.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-base shadow-xl flex items-center gap-2">
                        {block.ctaText || 'Garantir Meu Benefício'}
                        <MdArrowForward className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </section>
              );

            case 'FEATURES':
              return (
                <section key={bIdx} className="space-y-6">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange(bIdx, 'title', e.target.innerText)}
                      className="text-2xl font-bold text-white outline-none hover:bg-slate-800/40 p-1 rounded transition"
                    >
                      {block.title || 'Vantagens do Clube Relm Care+'}
                    </h2>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {(block.items || []).map((item, fIdx) => (
                      <div key={fIdx} className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                          <MdCheckCircle className="w-5 h-5" />
                        </div>
                        <h3
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleTextChange(bIdx, `item_title_${fIdx}`, e.target.innerText)}
                          className="text-base font-bold text-white outline-none hover:bg-slate-800/40 p-1 rounded"
                        >
                          {item.title}
                        </h3>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleTextChange(bIdx, `item_desc_${fIdx}`, e.target.innerText)}
                          className="text-xs text-slate-400 outline-none hover:bg-slate-800/40 p-1 rounded"
                        >
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case 'PRICING':
              return (
                <section key={bIdx} className="space-y-6 py-4">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange(bIdx, 'title', e.target.innerText)}
                      className="text-2xl font-bold text-white outline-none hover:bg-slate-800/40 p-1 rounded"
                    >
                      {block.title || 'Planos do Clube Relm'}
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <h3 className="text-xl font-bold text-white">Plano Care</h3>
                      <div className="text-3xl font-extrabold text-white">Gratuito</div>
                      <ul className="space-y-2 text-slate-300 text-xs">
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Registro de Garantia Digital</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Acúmulo de Pontos em Compras</li>
                      </ul>
                    </div>

                    <div className="p-6 bg-gradient-to-b from-emerald-950/40 to-slate-900 rounded-2xl border-2 border-emerald-500 space-y-4">
                      <h3 className="text-xl font-bold text-white">Plano Plus</h3>
                      <div className="text-3xl font-extrabold text-emerald-400">R$ 299 <span className="text-xs font-normal text-slate-400">/ano</span></div>
                      <ul className="space-y-2 text-slate-200 text-xs">
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Serviços de Oficina Gratuitos</li>
                        <li className="flex items-center gap-2"><MdCheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Pontos Mensais Renováveis</li>
                      </ul>
                    </div>
                  </div>
                </section>
              );

            case 'CTA_BANNER':
              return (
                <section key={bIdx} className="p-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl text-slate-950 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center md:text-left">
                    <h2
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange(bIdx, 'title', e.target.innerText)}
                      className="text-2xl font-extrabold outline-none hover:bg-emerald-500/30 p-1 rounded"
                    >
                      {block.title || 'Pronto para Começar?'}
                    </h2>
                    <p
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => handleTextChange(bIdx, 'subtitle', e.target.innerText)}
                      className="text-emerald-950 text-sm font-medium outline-none hover:bg-emerald-500/30 p-1 rounded"
                    >
                      {block.subtitle || 'Fale com nossa equipe ou visite a unidade parceira mais próxima.'}
                    </p>
                  </div>
                  <button className="px-6 py-3 bg-slate-950 text-white font-bold rounded-xl text-sm shrink-0">
                    Falar com a Loja
                  </button>
                </section>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Modal Selection for DALL-E 3 + Storyline Categorized Photos */}
      {editingImageIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative text-white">
            <button
              onClick={() => setEditingImageIdx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <MdClose className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <MdImage className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Escolher Imagem do Enredo</h3>
                <p className="text-xs text-slate-400">Fotos selecionadas com base na história do seu prompt</p>
              </div>
            </div>

            <div className="flex border-b border-slate-800 gap-4 text-sm">
              <button
                onClick={() => setActiveTab('SUGGESTIONS')}
                className={`pb-2 font-bold ${activeTab === 'SUGGESTIONS' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-400'}`}
              >
                Fotos do Enredo ({storylineCategory || 'Geral'})
              </button>
              <button
                onClick={() => setActiveTab('UPLOAD')}
                className={`pb-2 font-bold ${activeTab === 'UPLOAD' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-slate-400'}`}
              >
                Upload do Computador
              </button>
            </div>

            {activeTab === 'SUGGESTIONS' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* DALL-E 3 Exclusive Generated Image Option */}
                {dalleImageUrl && (
                  <div
                    onClick={() => handleSelectImage(dalleImageUrl)}
                    className="group relative h-36 rounded-xl overflow-hidden border-2 border-emerald-500 cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <img src={dalleImageUrl} alt="DALL-E 3 IA" className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col justify-between p-2">
                      <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded self-start flex items-center gap-1">
                        <MdStars className="w-3 h-3" /> Gerada por DALL-E 3
                      </span>
                      <span className="text-[11px] font-bold text-white">Exclusiva do Enredo</span>
                    </div>
                  </div>
                )}

                {/* Categorized Stock Images */}
                {displayStock.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => handleSelectImage(img.url)}
                    className="group relative h-36 rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500 cursor-pointer transition"
                  >
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent flex items-end p-2">
                      <span className="text-[11px] font-bold text-white">{img.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'UPLOAD' && (
              <div className="space-y-4 py-4 text-center">
                <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500 p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/50">
                  <MdUploadFile className="w-10 h-10 text-emerald-400 mb-2" />
                  <span className="text-sm font-bold text-white">Clique para selecionar um arquivo de foto</span>
                  <span className="text-xs text-slate-500 mt-1">Suporta JPG, PNG, WEBP até 5MB</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
