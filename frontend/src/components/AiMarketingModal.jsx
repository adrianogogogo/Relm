import React, { useState } from 'react';
import { aiAssistantAPI } from '../services/api';
import { MdStars, MdContentCopy, MdCheck, MdClose, MdAutorenew } from 'react-icons/md';

export default function AiMarketingModal({ isOpen, onClose, onApplyCopy }) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('LANDING_PAGE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!prompt.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      const res = await aiAssistantAPI.generateCopy({ prompt, type });
      setResult(res);
    } catch (err) {
      console.error('Erro ao gerar IA copy:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyText(text) {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
        >
          <MdClose className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <MdStars className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Assistente de Marketing IA</h2>
            <p className="text-xs text-slate-400">Gere títulos, copys e estruturas de campanhas personalizadas</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Conteúdo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="LANDING_PAGE">Estrutura de Landing Page</option>
              <option value="EMAIL_SUBJECT">Assunto de E-mail de Alta Conversão</option>
              <option value="DAILY_RIDER_MESSAGE">Mensagem Diária para Ciclistas</option>
              <option value="CAMPAIGN_COPY">Copy Geral de Campanha</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descreva a ideia ou oferta da campanha</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex: Promoção de revisão preventiva para ciclistas de fim de semana com acúmulo duplo de pontos..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <MdAutorenew className="w-4 h-4 animate-spin" />
                Gerando com IA...
              </>
            ) : (
              <>
                <MdStars className="w-4 h-4" />
                Gerar Sugestões de Marketing
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">{result.heading}</span>
              <button
                onClick={() => handleCopyText(result.content || result.hero?.title || result)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
              >
                {copied ? <MdCheck className="w-3.5 h-3.5 text-emerald-400" /> : <MdContentCopy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {result.hero && (
              <div className="space-y-1 text-sm">
                <p className="font-bold text-white">Título: {result.hero.title}</p>
                <p className="text-slate-300">{result.hero.subtitle}</p>
              </div>
            )}

            {result.content && (
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{result.content}</p>
            )}

            {onApplyCopy && (
              <button
                onClick={() => {
                  onApplyCopy(result);
                  onClose();
                }}
                className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 rounded transition"
              >
                Aplicar no Formulário
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
