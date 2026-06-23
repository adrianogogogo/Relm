import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  MdClose, MdPerson, MdPedalBike, MdStore, MdDescription, MdCancel, MdCheck,
  MdPlayArrow, MdAttachMoney, MdHistory, MdAttachFile, MdAssignment, MdEmail,
  MdContentCopy, MdPictureAsPdf, MdEvent, MdSupportAgent, MdWhatsapp,
} from 'react-icons/md';
import { warrantyAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Todos os status da FSM (enum WarrantyStatus no backend).
const WARRANTY_STATUSES = [
  'RECEBIDO',
  'EM_ANALISE',
  'AGUARDANDO_CLIENTE',
  'APROVADO',
  'REPROVADO',
  'FINALIZADO',
  'CANCELADO',
];

// Rótulos pt-BR para os tipos de evento do histórico (warrantyEvent.eventType).
const EVENT_LABELS = {
  CREATED: 'Garantia criada',
  STATUS_CHANGE: 'Status atualizado',
  APPROVED: 'Garantia aprovada',
  REJECTED: 'Garantia reprovada',
  STATUS_REVERTED: 'Status revertido',
  COST_UPDATED: 'Custo atualizado',
};

// Formata um valor numérico/string como moeda brasileira (R$).
function formatBRL(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Data+hora pt-BR (ou '—' quando ausente/ inválida).
function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function onlyDigits(s) {
  return (s || '').replace(/\D/g, '');
}

function statusBadgeClass(status) {
  switch (status) {
    case 'RECEBIDO':
      return 'bg-info/15 text-info';
    case 'EM_ANALISE':
    case 'AGUARDANDO_CLIENTE':
      return 'bg-warning/15 text-warning';
    case 'APROVADO':
      return 'bg-success/15 text-success';
    case 'REPROVADO':
      return 'bg-error/15 text-error';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300';
  }
}

// Relatório de texto para colar em e-mail / exportar — montado dos dados existentes.
function buildEmailReport(w) {
  const sep = '─'.repeat(46);
  const compra = w.product?.purchaseDate
    ? new Date(w.product.purchaseDate).toLocaleDateString('pt-BR')
    : '—';
  return [
    sep,
    '  RESUMO DA GARANTIA — Relm Care+',
    sep,
    '',
    `Protocolo: ${w.protocolNumber || '—'}`,
    `Status:    ${w.status || '—'}`,
    `Marca:     ${w.product?.brand || '—'}`,
    `Tipo:      ${w.product?.productType || '—'}`,
    '',
    sep,
    '  CLIENTE',
    sep,
    `Nome:     ${w.customer?.fullName || '—'}`,
    `E-mail:   ${w.customer?.email || '—'}`,
    `Telefone: ${w.customer?.phone || '—'}`,
    '',
    sep,
    '  DESCRIÇÃO DO PROBLEMA',
    sep,
    w.customerNotes || '—',
    '',
    sep,
    '  PRODUTO',
    sep,
    `Modelo: ${w.product?.model || '—'}`,
    `  Série:  ${w.product?.serialNumber || '—'}`,
    `  NF:     ${w.invoiceNumber || '—'}`,
    `  Compra: ${compra}`,
  ].join('\n');
}

// Estado vazio reutilizado nas abas ainda sem dados (Anexos / Tarefas).
function EmptyState({ children }) {
  return (
    <div className="py-12 text-center text-gray-400 dark:text-slate-500 text-sm">
      {children}
    </div>
  );
}

export default function WarrantyReviewModal({ warranty, onClose, onSuccess }) {
  const [currentWarranty, setCurrentWarranty] = useState(warranty);
  const [activeTab, setActiveTab] = useState('principal');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Custo da garantia (input controlado; inicia com o valor atual, se houver).
  const [costInput, setCostInput] = useState(
    currentWarranty.cost !== null && currentWarranty.cost !== undefined
      ? String(currentWarranty.cost)
      : '',
  );

  // Reversão de status (override administrativo).
  const [revertToStatus, setRevertToStatus] = useState('');
  const [revertReason, setRevertReason] = useState('');

  // Gating: somente ADMIN_RELM/GERENTE_RELM veem custo e reversão.
  const userType = useAuthStore((state) => state.user?.userType);
  const isAdminOrManager = userType === 'ADMIN_RELM' || userType === 'GERENTE_RELM';

  // ponytail: mutations de status retornam o claim "cru" (sem customer/product/
  // events). Fazemos merge em vez de replace para não apagar os includes que as
  // abas (sidebar Cliente, Histórico) dependem. Eventos novos só aparecem ao
  // reabrir — aceitável na Onda 1; refetch por getById se virar requisito.
  const mergeWarranty = (data) =>
    setCurrentWarranty((prev) => ({ ...prev, ...data }));

  const startAnalysisMutation = useMutation({
    mutationFn: () => warrantyAPI.updateStatus(currentWarranty.id, { to_status: 'EM_ANALISE' }),
    onSuccess: (data) => {
      alert('✅ Análise iniciada com sucesso!');
      mergeWarranty(data);
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao iniciar análise: ${error.response?.data?.message || error.message}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => warrantyAPI.approve(currentWarranty.id, { adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia aprovada! Email enviado ao cliente.');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`❌ Erro ao aprovar: ${error.response?.data?.message || error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => warrantyAPI.reject(currentWarranty.id, { rejectionReason, adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia rejeitada. Email enviado ao cliente.');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`❌ Erro ao rejeitar: ${error.response?.data?.message || error.message}`);
    },
  });

  const setCostMutation = useMutation({
    mutationFn: (cost) => warrantyAPI.setCost(currentWarranty.id, cost),
    onSuccess: (data) => {
      alert('✅ Custo salvo com sucesso!');
      mergeWarranty(data);
      setCostInput(
        data.cost !== null && data.cost !== undefined ? String(data.cost) : '',
      );
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao salvar custo: ${error.response?.data?.message || error.message}`);
    },
  });

  const revertMutation = useMutation({
    mutationFn: () =>
      warrantyAPI.revertStatus(currentWarranty.id, {
        toStatus: revertToStatus,
        reason: revertReason,
      }),
    onSuccess: (data) => {
      alert('✅ Status revertido com sucesso!');
      mergeWarranty(data);
      setRevertToStatus('');
      setRevertReason('');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      alert(`❌ Erro ao reverter status: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleSaveCost = () => {
    const trimmed = costInput.trim();
    // Vazio => limpa o custo (null).
    if (trimmed === '') {
      setCostMutation.mutate(null);
      return;
    }
    // Aceita vírgula ou ponto como separador decimal.
    const normalized = trimmed.replace(',', '.');
    const num = Number(normalized);
    if (Number.isNaN(num) || num < 0) {
      alert('Informe um valor de custo válido (número maior ou igual a zero).');
      return;
    }
    setCostMutation.mutate(Math.round(num * 100) / 100);
  };

  const handleRevertStatus = () => {
    if (!revertToStatus) {
      alert('Selecione o status de destino.');
      return;
    }
    if (!revertReason.trim()) {
      alert('Informe a justificativa da reversão.');
      return;
    }
    if (
      !window.confirm(
        `Confirma a REVERSÃO do status da garantia ${currentWarranty.protocolNumber}?\n\nDe: ${currentWarranty.status}\nPara: ${revertToStatus}\n\nJustificativa: ${revertReason}\n\nEste é um override administrativo (não envia e-mail ao cliente).`,
      )
    ) {
      return;
    }
    revertMutation.mutate();
  };

  const handleStartAnalysis = () => {
    if (
      !window.confirm(
        `Deseja iniciar a análise da garantia ${currentWarranty.protocolNumber}?`
      )
    ) {
      return;
    }
    startAnalysisMutation.mutate();
  };

  const handleApprove = () => {
    if (
      !window.confirm(
        `Confirma a APROVAÇÃO da garantia ${currentWarranty.protocolNumber}?\n\nUm email será enviado ao cliente com o token de validação.`,
      )
    ) {
      return;
    }
    approveMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    if (
      !window.confirm(
        `Confirma a REJEIÇÃO da garantia ${currentWarranty.protocolNumber}?\n\nMotivo: ${rejectionReason}\n\nUm email será enviado ao cliente.`,
      )
    ) {
      return;
    }
    rejectMutation.mutate();
  };

  const reportText = buildEmailReport(currentWarranty);

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Não foi possível copiar. Copie manualmente o texto.');
    }
  };

  const handleExportPdf = () => {
    // ponytail: PDF via janela de impressão do navegador — sem dependência
    // (jsPDF/html2pdf). Troque por uma lib se precisar de layout rico.
    const win = window.open('', '_blank');
    if (!win) {
      alert('Permita pop-ups para exportar o PDF.');
      return;
    }
    const safe = reportText.replace(/[<&>]/g, (c) =>
      ({ '<': '&lt;', '&': '&amp;', '>': '&gt;' }[c]),
    );
    win.document.write(
      `<title>Garantia ${currentWarranty.protocolNumber || ''}</title>` +
        `<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap">${safe}</pre>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  const canApprove = currentWarranty.status === 'EM_ANALISE';
  const canReject = currentWarranty.status === 'EM_ANALISE';
  const canStartAnalysis = currentWarranty.status === 'RECEBIDO';

  const events = currentWarranty.events || [];
  const resolvedAt =
    events.filter((e) => e.toStatus === 'FINALIZADO').slice(-1)[0]?.createdAt ||
    (['FINALIZADO', 'CANCELADO'].includes(currentWarranty.status)
      ? currentWarranty.updatedAt
      : null);

  const TABS = [
    { id: 'principal', label: 'Principal' },
    { id: 'anexos', label: 'Anexos' },
    { id: 'tarefas', label: 'Tarefas' },
    { id: 'historico', label: `Histórico (${events.length})` },
    { id: 'email', label: 'E-mail' },
  ];

  const phoneDigits = onlyDigits(currentWarranty.customer?.phone);

  const busy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    startAnalysisMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-auth-gradient text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-title text-2xl font-bold">Resumo da Garantia</h2>
            <p className="text-white/80 text-sm">Protocolo: {currentWarranty.protocolNumber}</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-2" disabled={busy}>
            <MdClose className="h-6 w-6" />
          </button>
        </div>

        {/* Body: conteúdo (abas) + sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 p-6">
          {/* ── Coluna principal ───────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-800 mb-6">
              <nav className="flex -mb-px overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary text-primary dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* ── Aba PRINCIPAL ──────────────────────────────────────── */}
            {activeTab === 'principal' && (
              <div className="space-y-6">
                {/* Produto */}
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <MdPedalBike size={18} className="text-gray-500 dark:text-slate-400" /> Dados do Produto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Modelo:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.product?.model || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Número de Série:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.product?.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Marca:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.product?.brand || 'Relm Bikes'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Tipo:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.product?.productType || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Loja de Compra */}
                <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <MdStore size={18} className="text-gray-500 dark:text-slate-400" /> Loja de Compra
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Nome:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.purchaseStoreName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Localização:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {currentWarranty.purchaseStoreCity && currentWarranty.purchaseStoreState
                          ? `${currentWarranty.purchaseStoreCity}, ${currentWarranty.purchaseStoreState}`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Nota Fiscal:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.invoiceNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-slate-400">Data da Compra:</span>
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {currentWarranty.product?.purchaseDate
                          ? new Date(currentWarranty.product.purchaseDate).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Atual */}
                <div className="bg-primary/5 dark:bg-primary-400/10 border border-primary/20 dark:border-primary-400/20 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary dark:text-primary-300 mb-3 flex items-center gap-2">
                    <MdDescription size={18} className="text-primary dark:text-primary-400" /> Status e Observações
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-primary-700 dark:text-primary-300">Status:</span>
                      <span className={`inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(currentWarranty.status)}`}>
                        {currentWarranty.status}
                      </span>
                    </div>
                    {currentWarranty.customerNotes && (
                      <div>
                        <span className="text-primary-700 dark:text-primary-300">Observações do Cliente:</span>
                        <p className="font-medium text-gray-900 dark:text-slate-100 whitespace-pre-wrap">{currentWarranty.customerNotes}</p>
                      </div>
                    )}
                    {currentWarranty.adminNotes && (
                      <div>
                        <span className="text-primary-700 dark:text-primary-300">Notas Internas:</span>
                        <p className="font-medium text-gray-900 dark:text-slate-100 whitespace-pre-wrap">{currentWarranty.adminNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custo da garantia (admin/gerente) */}
                {isAdminOrManager && (
                  <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <MdAttachMoney size={18} className="text-gray-500 dark:text-slate-400" /> Custo da garantia (para a empresa)
                    </h3>
                    {formatBRL(currentWarranty.cost) && (
                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                        Custo atual:{' '}
                        <span className="font-semibold text-gray-900 dark:text-slate-100">
                          {formatBRL(currentWarranty.cost)}
                        </span>
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                      <div className="flex-1">
                        <label htmlFor="warrantyCost" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Valor do custo (R$)
                        </label>
                        <input
                          id="warrantyCost"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={costInput}
                          onChange={(e) => setCostInput(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-100"
                          placeholder="Ex.: 150.00 (deixe vazio para limpar)"
                        />
                      </div>
                      <button
                        onClick={handleSaveCost}
                        disabled={setCostMutation.isPending}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {setCostMutation.isPending && (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Salvar custo
                      </button>
                    </div>
                  </div>
                )}

                {/* Reverter status (override admin/gerente) */}
                {isAdminOrManager && (
                  <div className="bg-warning/5 dark:bg-warning/10 border border-warning/20 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-warning flex items-center gap-2">
                      <MdHistory size={18} className="text-warning" /> Reverter status
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Override administrativo do status (ignora o fluxo normal). Não envia e-mail ao cliente. A justificativa é registrada no histórico.
                    </p>
                    <div>
                      <label htmlFor="revertToStatus" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Novo status *
                      </label>
                      <select
                        id="revertToStatus"
                        value={revertToStatus}
                        onChange={(e) => setRevertToStatus(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-warning/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent dark:text-slate-100"
                      >
                        <option value="">Selecione…</option>
                        {WARRANTY_STATUSES.filter((s) => s !== currentWarranty.status).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="revertReason" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Justificativa *
                      </label>
                      <textarea
                        id="revertReason"
                        value={revertReason}
                        onChange={(e) => setRevertReason(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-warning/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent dark:text-slate-100"
                        placeholder="Explique o motivo da reversão do status..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleRevertStatus}
                        disabled={revertMutation.isPending || !revertToStatus || !revertReason.trim()}
                        className="px-6 py-2.5 bg-warning hover:bg-warning-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {revertMutation.isPending && (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Reverter
                      </button>
                    </div>
                  </div>
                )}

                {/* Notas Admin */}
                {canApprove && !showRejectForm && (
                  <div>
                    <label htmlFor="adminNotes" className="label">
                      Notas Internas (opcional)
                    </label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="input"
                      placeholder="Adicione observações internas sobre esta garantia..."
                    />
                  </div>
                )}

                {/* Formulário de Rejeição */}
                {showRejectForm && (
                  <div className="bg-error/5 dark:bg-error/10 border border-error/20 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-error flex items-center gap-2">
                      <MdCancel size={18} className="text-error" /> Rejeitar Garantia
                    </h3>
                    <div>
                      <label htmlFor="rejectionReason" className="block text-sm font-medium text-error mb-2">
                        Motivo da Rejeição *
                      </label>
                      <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-error/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent dark:text-slate-100"
                        placeholder="Explique ao cliente o motivo da rejeição..."
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="adminNotesReject" className="block text-sm font-medium text-error mb-2">
                        Notas Internas (opcional)
                      </label>
                      <textarea
                        id="adminNotesReject"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-error/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent dark:text-slate-100"
                        placeholder="Observações internas..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Aba ANEXOS (Onda 3: backend de uploads) ────────────── */}
            {activeTab === 'anexos' && (
              // ponytail: sem modelo de anexos no backend ainda. Estado vazio
              // até a Onda 3 (warranty_attachments + upload).
              <EmptyState>
                <MdAttachFile className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Nenhum anexo ainda
              </EmptyState>
            )}

            {/* ── Aba TAREFAS (Onda 2: backend de tarefas) ───────────── */}
            {activeTab === 'tarefas' && (
              // ponytail: sem modelo de tarefas no backend ainda. Estado vazio
              // até a Onda 2 (warranty_tasks + endpoints).
              <EmptyState>
                <MdAssignment className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Nenhuma tarefa ainda
              </EmptyState>
            )}

            {/* ── Aba HISTÓRICO ──────────────────────────────────────── */}
            {activeTab === 'historico' && (
              <div>
                {events.length === 0 ? (
                  <EmptyState>Sem histórico ainda</EmptyState>
                ) : (
                  <ol className="space-y-4">
                    {events.map((ev) => (
                      <li key={ev.id || ev.createdAt} className="flex gap-3">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
                          {(ev.createdBy?.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-slate-800 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                              {ev.createdBy?.name || 'Sistema'}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                              {EVENT_LABELS[ev.eventType] || ev.eventType}
                            </span>
                            {ev.fromStatus && ev.toStatus && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${statusBadgeClass(ev.fromStatus)}`}>{ev.fromStatus}</span>
                                <span className="text-gray-400">→</span>
                                <span className={`px-1.5 py-0.5 rounded-full font-semibold ${statusBadgeClass(ev.toStatus)}`}>{ev.toStatus}</span>
                              </span>
                            )}
                          </div>
                          {ev.comment && (
                            <p className="mt-1 text-sm italic text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                              "{ev.comment}"
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">{formatDateTime(ev.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* ── Aba E-MAIL ─────────────────────────────────────────── */}
            {activeTab === 'email' && (
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                      <MdEmail size={18} className="text-gray-500 dark:text-slate-400" /> Relatório para E-mail
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Copie o texto abaixo para colar em um e-mail ou exporte como PDF.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleCopyReport}
                      className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <MdContentCopy size={16} /> {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    <button
                      onClick={handleExportPdf}
                      className="px-3 py-2 bg-error hover:bg-error-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
                    >
                      <MdPictureAsPdf size={16} /> Exportar PDF
                    </button>
                  </div>
                </div>
                <pre className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4 text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap font-mono overflow-x-auto">
                  {reportText}
                </pre>
              </div>
            )}
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────── */}
          <aside className="lg:w-80 shrink-0 space-y-4">
            {/* Responsável (sem campo no backend ainda — Onda 4) */}
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <MdSupportAgent size={16} className="text-gray-500 dark:text-slate-400" /> Responsável
              </h4>
              {/* ponytail: sem campo de atendente/responsável no claim ainda. */}
              <p className="text-sm text-gray-400 dark:text-slate-500">Atendente designado: —</p>
            </div>

            {/* Cliente */}
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <MdPerson size={16} className="text-gray-500 dark:text-slate-400" /> Cliente
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Nome</span>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{currentWarranty.customer?.fullName || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">E-mail</span>
                  <p className="font-medium text-gray-900 dark:text-slate-100 break-all">{currentWarranty.customer?.email || '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Telefone</span>
                  <p className="font-medium text-gray-900 dark:text-slate-100 flex items-center gap-2">
                    {currentWarranty.customer?.phone || '—'}
                    {phoneDigits && (
                      <a
                        href={`https://wa.me/${phoneDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-success hover:text-success-600"
                        title="Abrir no WhatsApp"
                      >
                        <MdWhatsapp size={18} />
                      </a>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <MdEvent size={16} className="text-gray-500 dark:text-slate-400" /> Datas
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Criado em</span>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{formatDateTime(currentWarranty.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Última atualização</span>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{formatDateTime(currentWarranty.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Resolvido em</span>
                  <p className="font-medium text-success">{resolvedAt ? formatDateTime(resolvedAt) : '—'}</p>
                </div>
                {/* ponytail: sem fechamento automático no backend ainda — Onda 4. */}
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Fecha automaticamente</span>
                  <p className="font-medium text-gray-400 dark:text-slate-500">—</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-slate-900/60 px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 disabled:opacity-50"
            disabled={busy}
          >
            Fechar
          </button>

          <div className="flex gap-3">
            {canStartAnalysis && (
              <button
                onClick={handleStartAnalysis}
                disabled={startAnalysisMutation.isPending}
                className="px-6 py-2.5 bg-warning hover:bg-warning-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {startAnalysisMutation.isPending && (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <MdPlayArrow size={16} /> Iniciar Análise
              </button>
            )}

            {canReject && !showRejectForm && (
              <button
                onClick={() => {
                  setActiveTab('principal');
                  setShowRejectForm(true);
                }}
                className="px-6 py-2.5 border-2 border-error text-error rounded-lg text-sm font-semibold hover:bg-error hover:text-white transition-colors disabled:opacity-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Rejeitar
              </button>
            )}

            {showRejectForm && (
              <>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                  disabled={rejectMutation.isPending}
                >
                  Cancelar Rejeição
                </button>
                <button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="px-6 py-2.5 bg-error hover:bg-error-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {rejectMutation.isPending && (
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Confirmar Rejeição
                </button>
              </>
            )}

            {canApprove && !showRejectForm && (
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="px-6 py-2.5 bg-success hover:bg-success-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {approveMutation.isPending && (
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <MdCheck size={16} /> Aprovar Garantia
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
