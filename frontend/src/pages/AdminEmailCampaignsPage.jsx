import React, { useState, useEffect } from 'react';
import { emailCrmAPI } from '../services/api';
import AiMarketingModal from '../components/AiMarketingModal';
import { MdEmail, MdSend, MdAdd, MdStars, MdCheckCircle, MdErrorOutline, MdDescription, MdPeople, MdAutorenew } from 'react-icons/md';

export default function AdminEmailCampaignsPage() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'CAMPAIGNS' | 'TEMPLATES'
  const [activeTab, setActiveTab] = useState('CAMPAIGNS');

  // Modal Campaign State
  const [showCampModal, setShowCampModal] = useState(false);
  const [campTitle, setCampTitle] = useState('');
  const [campTemplateId, setCampTemplateId] = useState('');
  const [campSegment, setCampSegment] = useState('ALL_CUSTOMERS');

  // Modal Template State
  const [showTmplModal, setShowTmplModal] = useState(false);
  const [tmplName, setTmplName] = useState('');
  const [tmplSlug, setTmplSlug] = useState('');
  const [tmplSubject, setTmplSubject] = useState('');
  const [tmplBody, setTmplBody] = useState('');

  // Test Email State
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  // AI Modal State
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tmplData, campData] = await Promise.all([
        emailCrmAPI.getTemplates(),
        emailCrmAPI.getCampaigns(),
      ]);
      setTemplates(tmplData || []);
      setCampaigns(campData || []);
      if (tmplData && tmplData.length > 0) {
        setCampTemplateId(tmplData[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar e-mail CRM:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplate(e) {
    e.preventDefault();
    try {
      await emailCrmAPI.createTemplate({
        name: tmplName,
        slug: tmplSlug.toLowerCase().replace(/\s+/g, '-'),
        subject: tmplSubject,
        bodyHtml: tmplBody,
      });
      setShowTmplModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao criar template.');
    }
  }

  async function handleCreateCampaign(e) {
    e.preventDefault();
    try {
      await emailCrmAPI.createCampaign({
        title: campTitle,
        templateId: campTemplateId,
        targetSegment: campSegment,
      });
      setShowCampModal(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao criar campanha.');
    }
  }

  async function handleTriggerCampaign(campaignId) {
    if (!confirm('Deseja disparar esta campanha agora para o segmento selecionado?')) return;
    try {
      await emailCrmAPI.sendCampaign(campaignId);
      alert('Campanha enviada com sucesso!');
      loadData();
    } catch (err) {
      alert('Erro ao disparar campanha.');
    }
  }

  async function handleSendTest() {
    if (!testEmail.trim()) return;
    try {
      setSendingTest(true);
      await emailCrmAPI.sendTest({
        to: testEmail,
        subject: tmplSubject || 'E-mail de Teste Relm Care+',
        bodyHtml: tmplBody || '<p>Teste de envio de e-mail</p>',
      });
      alert(`E-mail de teste enviado para ${testEmail}!`);
    } catch (err) {
      alert('Falha ao enviar e-mail de teste.');
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MdEmail className="w-6 h-6 text-emerald-400" />
            Campanhas de E-mail & CRM
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie templates e envie disparos de e-mail segmentados para clientes e lojas credenciadas.
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
            onClick={() => setShowCampModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
          >
            <MdSend className="w-4 h-4" />
            Nova Campanha
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`px-4 py-2 font-bold text-sm rounded-lg transition ${
            activeTab === 'CAMPAIGNS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Campanhas ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-4 py-2 font-bold text-sm rounded-lg transition ${
            activeTab === 'TEMPLATES' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          Templates ({templates.length})
        </button>
      </div>

      {/* Tab: Campanhas */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Carregando campanhas...</div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <MdEmail className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium">Nenhuma campanha enviada ainda.</p>
              <button
                onClick={() => setShowCampModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg"
              >
                Criar Minha Primeira Campanha
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Título da Campanha</th>
                    <th className="px-6 py-4">Segmento Alvo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Enviados</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        {camp.title}
                        <span className="block text-xs font-normal text-slate-400">Template: {camp.template?.name || 'Padrão'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs">
                          <MdPeople className="w-3.5 h-3.5 text-emerald-400" />
                          {camp.targetSegment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            camp.status === 'SENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : camp.status === 'SENDING'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {camp.sentCount} ok / {camp.errorCount} erros
                      </td>
                      <td className="px-6 py-4 text-right">
                        {camp.status === 'DRAFT' && (
                          <button
                            onClick={() => handleTriggerCampaign(camp.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                          >
                            <MdSend className="w-3.5 h-3.5" /> Disparar Agora
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Templates */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Templates Cadastrados</h3>
            <button
              onClick={() => setShowTmplModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-lg transition text-xs flex items-center gap-1.5 border border-emerald-500/20"
            >
              <MdAdd className="w-4 h-4" /> Criar Template
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">/{tmpl.slug}</span>
                  <MdDescription className="w-4 h-4 text-slate-500" />
                </div>
                <h4 className="text-base font-bold text-white">{tmpl.name}</h4>
                <p className="text-xs text-slate-400">Assunto: {tmpl.subject}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Criar Campanha */}
      {showCampModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCampaign}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
          >
            <h2 className="text-xl font-bold text-white">Criar Nova Campanha de E-mail</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título Interno da Campanha</label>
                <input
                  type="text"
                  required
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  placeholder="Ex: Disparo Lançamento Plano Plus de Agosto"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Selecione o Template de E-mail</label>
                <select
                  value={campTemplateId}
                  onChange={(e) => setCampTemplateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Segmento Alvo de Envio</label>
                <select
                  value={campSegment}
                  onChange={(e) => setCampSegment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL_CUSTOMERS">Todos os Clientes Cadastrados</option>
                  <option value="PLUS_ONLY">Apenas Assinantes Membros Plus</option>
                  <option value="STORES_ONLY">Apenas Lojas Parceiras Credenciadas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCampModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
              >
                Salvar Rascunho da Campanha
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Criar Template */}
      {showTmplModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTemplate}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-bold text-white">Criar Template de E-mail HTML</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Template</label>
                <input
                  type="text"
                  required
                  value={tmplName}
                  onChange={(e) => setTmplName(e.target.value)}
                  placeholder="Ex: Lembrete de Pontos a Vencer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Slug</label>
                <input
                  type="text"
                  required
                  value={tmplSlug}
                  onChange={(e) => setTmplSlug(e.target.value)}
                  placeholder="ex: pontos-vencendo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assunto do E-mail</label>
                <input
                  type="text"
                  required
                  value={tmplSubject}
                  onChange={(e) => setTmplSubject(e.target.value)}
                  placeholder="Ex: 🚨 Seus pontos do mês vencem em breve!"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Corpo do E-mail (HTML)</label>
                <textarea
                  rows={6}
                  required
                  value={tmplBody}
                  onChange={(e) => setTmplBody(e.target.value)}
                  placeholder="<h1>Olá {{customerName}}!</h1><p>Seus pontos valem desonctos em nossas lojas.</p>"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Enviar teste para este e-mail..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendingTest || !testEmail}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-emerald-400 rounded-lg"
                >
                  {sendingTest ? 'Enviando...' : 'Testar'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowTmplModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg"
              >
                Salvar Template
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal IA Assistant */}
      <AiMarketingModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyCopy={(res) => {
          if (res.suggestedSubject) setTmplSubject(res.suggestedSubject);
          if (res.content) setTmplBody(`<p>${res.content}</p>`);
        }}
      />
    </div>
  );
}
