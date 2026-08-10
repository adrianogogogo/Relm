import React, { useState, useEffect } from 'react';
import { emailCrmAPI, aiAssistantAPI } from '../services/api';
import { MdEmail, MdSend, MdStars, MdAutorenew, MdPeople, MdCheck, MdEdit, MdContentCopy, MdArrowForward } from 'react-icons/md';

export default function AdminEmailCampaignsPage() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'CAMPAIGNS' | 'MAGIC_CREATE'
  const [activeTab, setActiveTab] = useState('CAMPAIGNS');

  // AI Prompt & Model State
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [generating, setGenerating] = useState(false);

  // Generated Email Form & WYSIWYG Preview State
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [bodyMessage, setBodyMessage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [targetSegment, setTargetSegment] = useState('ALL_CUSTOMERS');
  const [campaignTitle, setCampaignTitle] = useState('');

  // Test Email
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(false);

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
    } catch (err) {
      console.error('Erro ao carregar e-mail CRM:', err);
    } finally {
      setLoading(false);
    }
  }

  // 1-Click Magic AI Email Generation
  async function handleMagicGenerate(e) {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setGenerating(true);
      const copyRes = await aiAssistantAPI.generateCopy({
        prompt: aiPrompt,
        type: 'EMAIL_SUBJECT',
        model: selectedModel,
      });

      const genSubject = copyRes.suggestedSubject || copyRes.heading || aiPrompt;
      const genHeading = copyRes.heading || 'Vantagem Exclusiva Relm Care+';
      const genContent = copyRes.content || aiPrompt;

      setSubject(genSubject);
      setHeading(genHeading);
      setBodyMessage(genContent);
      setCtaText('Conferir Meu Benefício');
      setCampaignTitle(`Campanha: ${genSubject.substring(0, 30)}...`);
    } catch (err) {
      console.error('Erro na OpenAI:', err);
      alert(err.response?.data?.message || err.message || 'Erro ao comunicar com a API da OpenAI. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  }

  // Send Test Email
  async function handleSendTest() {
    if (!testEmail.trim()) return;
    try {
      setSendingTest(true);
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px;">
          <h1 style="color: #10b981; font-size: 24px;">${heading || 'Relm Care+'}</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">${bodyMessage}</p>
          <div style="margin-top: 24px;">
            <a href="https://relmcareplus.com.br" style="background-color: #10b981; color: #020617; padding: 12px 24px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block;">
              ${ctaText || 'Acessar Plataforma'}
            </a>
          </div>
        </div>
      `;
      await emailCrmAPI.sendTest({
        to: testEmail,
        subject: subject || 'E-mail de Teste Relm Care+',
        bodyHtml: htmlBody,
      });
      alert(`E-mail de teste enviado para ${testEmail}!`);
    } catch (err) {
      alert('Falha ao enviar e-mail de teste.');
    } finally {
      setSendingTest(false);
    }
  }

  // Create & Trigger Campaign 1-Click
  async function handleCreateAndSendCampaign() {
    if (!subject.trim() || !bodyMessage.trim()) {
      alert('Por favor, digite ou gere um assunto e mensagem para o e-mail.');
      return;
    }
    try {
      setSendingCampaign(true);
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px;">
          <h1 style="color: #10b981; font-size: 24px;">${heading || 'Relm Care+'}</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">${bodyMessage}</p>
          <div style="margin-top: 24px;">
            <a href="https://relmcareplus.com.br" style="background-color: #10b981; color: #020617; padding: 12px 24px; font-weight: bold; border-radius: 8px; text-decoration: none; display: inline-block;">
              ${ctaText || 'Acessar Plataforma'}
            </a>
          </div>
        </div>
      `;

      // 1. Create template
      const tmpl = await emailCrmAPI.createTemplate({
        name: campaignTitle || subject,
        slug: `email-${Date.now()}`,
        subject: subject,
        bodyHtml: htmlBody,
      });

      // 2. Create campaign
      const camp = await emailCrmAPI.createCampaign({
        title: campaignTitle || subject,
        templateId: tmpl.id,
        targetSegment: targetSegment,
      });

      // 3. Trigger campaign immediately
      await emailCrmAPI.sendCampaign(camp.id);

      alert('Campanha criada e enviada com sucesso!');
      setActiveTab('CAMPAIGNS');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao disparar campanha.');
    } finally {
      setSendingCampaign(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MdEmail className="w-6 h-6 text-emerald-400" />
            Campanhas de E-mail CRM por IA
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gere mensagens e assuntos com inteligência artificial e edite diretamente no preview sem precisar de código HTML.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === 'MAGIC_CREATE' ? 'CAMPAIGNS' : 'MAGIC_CREATE')}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl transition flex items-center gap-2 text-sm shadow-xl shadow-emerald-500/20"
          >
            <MdStars className="w-5 h-5" />
            {activeTab === 'MAGIC_CREATE' ? 'Ver Minhas Campanhas' : 'Criar E-mail com IA'}
          </button>
        </div>
      </div>

      {/* TAB: MAGIC CREATE (100% INTUITIVE EMAIL BUILDER) */}
      {activeTab === 'MAGIC_CREATE' && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: AI Prompt & Campaign Controls */}
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <MdStars className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">1. Digite a Ideia do Seu E-mail</h3>
                <p className="text-xs text-slate-400">Descreva o que deseja divulgar aos seus clientes</p>
              </div>
            </div>

            <form onSubmit={handleMagicGenerate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Modelo OpenAI:</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="gpt-4o-mini">🤖 OpenAI gpt-4o-mini (Recomendado — Rápido & Inteligente)</option>
                  <option value="gpt-4o">🚀 OpenAI gpt-4o (Criatividade Avançada & Raciocínio Persuasivo)</option>
                  <option value="gpt-3.5-turbo">⚡ OpenAI gpt-3.5-turbo (Padrão)</option>
                </select>
              </div>

              <textarea
                rows={3}
                required
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Enviar lembrete sobre o acúmulo de pontos do mês para assinantes Plus com convite para o pedal..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                disabled={generating || !aiPrompt.trim()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 border border-emerald-500/20 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <MdAutorenew className="w-4 h-4 animate-spin" />
                    Gerando E-mail por IA...
                  </>
                ) : (
                  <>
                    <MdStars className="w-4 h-4" />
                    Gerar Assunto e Mensagem com IA
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MdPeople className="w-4 h-4 text-emerald-400" />
                2. Selecione o Público-Alvo de Envio
              </h3>

              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL_CUSTOMERS">Todos os Clientes Cadastrados</option>
                <option value="PLUS_ONLY">Apenas Assinantes Membros Plus</option>
                <option value="STORES_ONLY">Apenas Lojas Credenciadas</option>
              </select>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-semibold">Testar Envio no Seu E-mail:</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sendingTest || !testEmail}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 rounded-xl disabled:opacity-50"
                  >
                    {sendingTest ? 'Enviando...' : 'Testar'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateAndSendCampaign}
                disabled={sendingCampaign || !subject}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-base transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingCampaign ? (
                  <>
                    <MdAutorenew className="w-5 h-5 animate-spin" />
                    Enviando Campanha...
                  </>
                ) : (
                  <>
                    <MdSend className="w-5 h-5" />
                    🚀 Disparar Campanha Agora
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Interactive WYSIWYG Email Live Preview */}
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <MdEdit className="w-4 h-4" /> Preview do E-mail (Clique nos textos para alterar)
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Sem HTML</span>
            </div>

            {/* Email Subject Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Assunto da Mensagem:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: 🚨 Seus pontos do mês vencem em breve!"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Visual Email Card Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-slate-100">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center text-sm">
                  R
                </div>
                <span className="font-bold text-white text-sm">RELM CARE+</span>
              </div>

              {/* Editable Heading */}
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setHeading(e.target.innerText)}
                className="text-xl font-extrabold text-white outline-none hover:bg-slate-800 p-1.5 rounded transition"
              >
                {heading || 'Título Principal da Mensagem'}
              </h2>

              {/* Editable Body */}
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setBodyMessage(e.target.innerText)}
                className="text-sm text-slate-300 leading-relaxed outline-none hover:bg-slate-800 p-1.5 rounded transition whitespace-pre-line"
              >
                {bodyMessage || 'Sua mensagem formatada aparecerá aqui. Clique para alterar o texto livremente.'}
              </p>

              {/* Editable Button */}
              <div className="pt-2">
                <button
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setCtaText(e.target.innerText)}
                  className="px-6 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm outline-none hover:bg-emerald-400"
                >
                  {ctaText || 'Acessar Minha Conta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CAMPAIGNS LISTING */}
      {activeTab === 'CAMPAIGNS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Carregando campanhas...</div>
          ) : campaigns.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800 space-y-3">
              <MdEmail className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium">Nenhuma campanha enviada ainda.</p>
              <button
                onClick={() => setActiveTab('MAGIC_CREATE')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl"
              >
                Criar Minha Primeira Campanha
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Título / Assunto</th>
                    <th className="px-6 py-4">Segmento Alvo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Resultado Envio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-bold text-white">
                        {camp.title}
                        <span className="block text-xs font-normal text-slate-400">
                          {camp.template?.subject || 'Assunto Personalizado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-medium">
                          <MdPeople className="w-3.5 h-3.5 text-emerald-400" />
                          {camp.targetSegment}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {camp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                        {camp.sentCount} ok / {camp.errorCount} erros
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
