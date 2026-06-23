import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  MdClose, MdPerson, MdPedalBike, MdStore, MdDescription, MdCancel, MdCheck,
  MdPlayArrow, MdAttachMoney, MdHistory, MdAttachFile, MdAssignment, MdEmail,
  MdContentCopy, MdPictureAsPdf, MdEvent, MdSupportAgent, MdWhatsapp,
  MdAdd, MdDelete, MdCheckCircle, MdRadioButtonUnchecked, MdDownload, MdUploadFile,
  MdFlashOn,
} from 'react-icons/md';
import { warrantyAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const STEP_INFO = [
  { name: 'Novo', desc: 'Garantia recebida, aguarda início da análise.' },
  { name: 'Em Triagem', desc: 'Análise inicial iniciada pela equipe Relm.' },
  { name: 'Em Análise', desc: 'Identificação de problemas e testes em data/tarefas em andamento.' },
  { name: 'Solução Proposta', desc: 'Aguardando retorno do cliente sobre a solução proposta.' },
  { name: 'Em Definição', desc: 'Custo da garantia definido e sob avaliação financeira.' },
  { name: 'Reprovado', desc: 'A solicitação de garantia foi reprovada.' },
  { name: 'Logística/Envio', desc: 'Garantia aprovada, processo de envio iniciado.' },
  { name: 'Em Logística', desc: 'Peças em trânsito ou recebidas.' },
  { name: 'Resolvido', desc: 'Problema solucionado e registrado.' },
  { name: 'Fechado', desc: 'Finalização total de tarefas e fechamento do ticket.' }
];

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
  ASSIGNED: 'Responsável alterado',
};

const STATUS_LABELS_HISTORY = {
  RECEBIDO: 'Novo',
  EM_ANALISE: 'Em Triagem',
  AGUARDANDO_CLIENTE: 'Solução Proposta',
  APROVADO: 'Logística/Envio',
  REPROVADO: 'Reprovado',
  FINALIZADO: 'Resolvido',
  CANCELADO: 'Cancelado',
};

function formatDateTimeWithWord(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} às ${timeStr}`;
}

function getActionBadge(ev) {
  switch (ev.eventType) {
    case 'CREATED':
      return { text: 'Ticket criado', emoji: '🎫' };
    case 'APPROVED':
      return { text: 'Solução aprovada', emoji: '✅' };
    case 'REJECTED':
      return { text: 'Solução reprovada', emoji: '❌' };
    case 'COST_UPDATED':
      return { text: 'Custo atualizado', emoji: '💰' };
    case 'ASSIGNED':
      return { text: 'Responsável alterado', emoji: '👤' };
    case 'TASK_CREATED':
      return { text: 'Tarefa criada', emoji: '📋' };
    case 'TASK_UPDATED':
      if (ev.comment?.includes('concluída')) {
        return { text: 'Tarefa concluída', emoji: '📋' };
      } else if (ev.comment?.includes('reaberta')) {
        return { text: 'Tarefa reaberta', emoji: '📋' };
      }
      return { text: 'Tarefa concluída/reaberta', emoji: '📋' };
    case 'TASK_DELETED':
      return { text: 'Tarefa excluída', emoji: '📋' };
    case 'ATTACHMENT_UPLOADED':
      return { text: 'Arquivo anexado', emoji: '📎' };
    case 'ATTACHMENT_DELETED':
      return { text: 'Arquivo removido', emoji: '📎' };
    case 'STATUS_REVERTED':
      return { text: 'Status revertido', emoji: '⚡' };
    case 'SOLUTION_PROPOSED':
      return { text: 'Solução proposta', emoji: '💡' };
    case 'STATUS_CHANGE':
    default:
      if (ev.toStatus === 'AGUARDANDO_CLIENTE') {
        return { text: 'Solução proposta', emoji: '💡' };
      }
      return { text: 'Status atualizado', emoji: '⚡' };
  }
}

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

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

// Mapeamento lógico da garantia para 10 etapas do Stepper
function getProgressStep(w) {
  const status = w.status;
  const tasks = w.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'concluida').length;
  const hasCost = w.cost !== null && w.cost !== undefined;

  if (status === 'RECEBIDO') {
    return { step: 1, label: 'Novo', badgeColor: 'bg-info/15 text-info dark:bg-info/10 border-info/20' };
  }
  if (status === 'AGUARDANDO_CLIENTE') {
    return { step: 4, label: 'Solução Proposta', badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800' };
  }
  if (status === 'REPROVADO') {
    return { step: 6, label: 'Reprovado', badgeColor: 'bg-error/15 text-error dark:bg-error/10 border-error/20' };
  }
  if (status === 'FINALIZADO') {
    const hasPendingTasks = tasks.some((t) => t.status !== 'concluida');
    if (!hasPendingTasks && totalTasks > 0) {
      return { step: 10, label: 'Fechado', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300 border-gray-200 dark:border-slate-700' };
    }
    return { step: 9, label: 'Resolvido', badgeColor: 'bg-success/15 text-success dark:text-success border-success/30' };
  }
  if (status === 'APROVADO') {
    const hasLogisticsTasks = tasks.some((t) => t.title.toLowerCase().includes('envio') || t.title.toLowerCase().includes('logística'));
    if (hasLogisticsTasks && completedTasks === totalTasks) {
      return { step: 8, label: 'Em Logística', badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    }
    return { step: 7, label: 'Logística/Envio', badgeColor: 'bg-success/15 text-success dark:bg-success/10 border-success/20' };
  }
  if (status === 'EM_ANALISE') {
    if (hasCost) {
      return { step: 5, label: 'Em Definição', badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' };
    }
    if (totalTasks > 0) {
      return { step: 3, label: 'Em Análise', badgeColor: 'bg-warning/15 text-warning dark:bg-warning/10 border-warning/20' };
    }
    return { step: 2, label: 'Em Triagem', badgeColor: 'bg-warning/15 text-warning dark:bg-warning/10 border-warning/20' };
  }

  return { step: 1, label: 'Novo', badgeColor: 'bg-info/15 text-info dark:bg-info/10 border-info/20' };
}

const parseAssignee = (assignee) => {
  if (!assignee) return { role: null, name: '' };
  const match = assignee.match(/^\[([^\]]+)\](?:\s+(.+))?$/);
  if (match) {
    return { role: match[1], name: match[2] || '' };
  }
  return { role: null, name: assignee };
};

const roleBadgeClasses = {
  'Admin': 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50',
  'Gerente': 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50',
  'Suporte': 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
  'Loja': 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  'Distribuidor': 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/50',
  'Cliente': 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
};

export default function WarrantyReviewModal({ warranty, onClose, onSuccess }) {
  const { data: fullWarranty, refetch: refetchWarranty } = useQuery({
    queryKey: ['warranty-claim-detail', warranty.id],
    queryFn: () => warrantyAPI.getById(warranty.id),
    initialData: warranty,
  });

  const [currentWarranty, setCurrentWarranty] = useState(fullWarranty || warranty);

  useEffect(() => {
    if (fullWarranty) {
      setCurrentWarranty(fullWarranty);
      setCostInput(
        fullWarranty.cost !== null && fullWarranty.cost !== undefined ? String(fullWarranty.cost) : ''
      );
    }
  }, [fullWarranty]);
  const [activeTab, setActiveTab] = useState('principal');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showStartAnalysisForm, setShowStartAnalysisForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showAwaitingClientForm, setShowAwaitingClientForm] = useState(false);
  const [awaitingClientComment, setAwaitingClientComment] = useState('');
  const [showFinalizeForm, setShowFinalizeForm] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [showReturnToAnalysisForm, setShowReturnToAnalysisForm] = useState(false);
  const [returnToAnalysisChannel, setReturnToAnalysisChannel] = useState('WhatsApp');
  const [returnToAnalysisNotes, setReturnToAnalysisNotes] = useState('');
  const [nextAssigneeId, setNextAssigneeId] = useState('');
  const [copied, setCopied] = useState(false);

  // Formulário de nova tarefa (aba Tarefas).
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

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
  const startAnalysisMutation = useMutation({
    mutationFn: (comment) => warrantyAPI.updateStatus(currentWarranty.id, { to_status: 'EM_ANALISE', comment }),
    onSuccess: () => {
      alert('✅ Análise iniciada ou atualizada com sucesso!');
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro na transição de análise: ${error.response?.data?.message || error.message}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => warrantyAPI.approve(currentWarranty.id, { adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia aprovada! Email enviado ao cliente.');
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao aprovar: ${error.response?.data?.message || error.message}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => warrantyAPI.reject(currentWarranty.id, { rejectionReason, adminNotes }),
    onSuccess: () => {
      alert('✅ Garantia rejeitada. Email enviado ao cliente.');
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao rejeitar: ${error.response?.data?.message || error.message}`);
    },
  });

  const awaitingClientMutation = useMutation({
    mutationFn: (comment) =>
      warrantyAPI.updateStatus(currentWarranty.id, {
        to_status: 'AGUARDANDO_CLIENTE',
        comment,
      }),
    onSuccess: () => {
      alert('✅ Solução proposta e status atualizado para Pendente Cliente!');
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao propor solução: ${error.response?.data?.message || error.message}`);
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (resolution) =>
      warrantyAPI.updateStatus(currentWarranty.id, {
        to_status: 'FINALIZADO',
        resolution,
      }),
    onSuccess: () => {
      alert('✅ Garantia finalizada com sucesso!');
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao finalizar garantia: ${error.response?.data?.message || error.message}`);
    },
  });

  const setCostMutation = useMutation({
    mutationFn: (cost) => warrantyAPI.setCost(currentWarranty.id, cost),
    onSuccess: () => {
      alert('✅ Custo salvo com sucesso!');
      refetchWarranty();
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
    onSuccess: () => {
      alert('✅ Status revertido com sucesso!');
      refetchWarranty();
      setRevertToStatus('');
      setRevertReason('');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao reverter status: ${error.response?.data?.message || error.message}`);
    },
  });

  // ── Tarefas (Onda 2) ────────────────────────────────────────────────────────
  const createTaskMutation = useMutation({
    mutationFn: (payload) => warrantyAPI.createTask(currentWarranty.id, payload),
    onSuccess: () => {
      refetchWarranty();
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDue('');
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao criar tarefa: ${error.response?.data?.message || error.message}`);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => warrantyAPI.updateTask(taskId, data),
    onSuccess: () => {
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao atualizar tarefa: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => warrantyAPI.deleteTask(taskId),
    onSuccess: () => {
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao remover tarefa: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      alert('Informe o título da tarefa.');
      return;
    }
    createTaskMutation.mutate({
      title: newTaskTitle.trim(),
      assignee: newTaskAssignee.trim() || undefined,
      dueDate: newTaskDue || undefined,
    });
  };

  const toggleTaskDone = (task) => {
    const next = task.status === 'concluida' ? 'pendente' : 'concluida';
    updateTaskMutation.mutate({ taskId: task.id, data: { status: next } });
  };

  // ── Anexos (Onda 3) ─────────────────────────────────────────────────────────
  const uploadAttachmentMutation = useMutation({
    mutationFn: (file) => warrantyAPI.uploadAttachment(currentWarranty.id, file),
    onSuccess: () => {
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao enviar anexo: ${error.response?.data?.message || error.message}`);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attId) => warrantyAPI.deleteAttachment(attId),
    onSuccess: () => {
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao remover anexo: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadAttachmentMutation.mutate(file);
    e.target.value = ''; // permite reenviar o mesmo arquivo
  };

  const handleDownloadAttachment = async (att) => {
    try {
      const blob = await warrantyAPI.downloadAttachment(att.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Não foi possível baixar o anexo.');
    }
  };

  // ── Responsável (Onda 4) ────────────────────────────────────────────────────
  const { data: assignableUsers = [] } = useQuery({
    queryKey: ['warranty-assignable-users'],
    queryFn: () => warrantyAPI.assignableUsers(),
    enabled: isAdminOrManager,
    staleTime: 5 * 60 * 1000,
  });

  const assignMutation = useMutation({
    mutationFn: (userId) => warrantyAPI.assign(currentWarranty.id, userId),
    onSuccess: () => {
      refetchWarranty();
      onSuccess();
    },
    onError: (error) => {
      alert(`❌ Erro ao atribuir responsável: ${error.response?.data?.message || error.message}`);
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

  const handleRevertStatus = async () => {
    if (!revertToStatus) {
      alert('Selecione o status de destino.');
      return;
    }
    if (!revertReason.trim()) {
      alert('Informe a justificativa da reversão.');
      return;
    }
    try {
      await revertMutation.mutateAsync();
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setNextAssigneeId('');
      onClose();
    } catch {
      // erros já tratados nas mutations
    }
  };

  const handleStartAnalysis = async () => {
    try {
      await startAnalysisMutation.mutateAsync();
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setShowStartAnalysisForm(false);
      setNextAssigneeId('');
    } catch {
      // erros já tratados
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync();
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setShowApproveForm(false);
      setNextAssigneeId('');
      onClose();
    } catch {
      // erros já tratados
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }
    try {
      await rejectMutation.mutateAsync();
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setShowRejectForm(false);
      setRejectionReason('');
      setNextAssigneeId('');
      onClose();
    } catch {
      // erros já tratados
    }
  };

  const handleAwaitingClient = async () => {
    if (!awaitingClientComment.trim()) {
      alert('Por favor, informe a proposta ou instruções para o cliente.');
      return;
    }
    try {
      await awaitingClientMutation.mutateAsync(awaitingClientComment.trim());
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setShowAwaitingClientForm(false);
      setAwaitingClientComment('');
      setNextAssigneeId('');
    } catch {
      // erros já tratados
    }
  };

  const handleFinalize = async () => {
    if (!resolutionText.trim()) {
      alert('Por favor, informe a resolução/fechamento.');
      return;
    }
    try {
      await finalizeMutation.mutateAsync(resolutionText.trim());
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setShowFinalizeForm(false);
      setResolutionText('');
      setNextAssigneeId('');
    } catch {
      // erros já tratados
    }
  };

  const handleReturnToAnalysis = async () => {
    if (!returnToAnalysisNotes.trim()) {
      alert('Por favor, insira a justificativa do contato ou retorno.');
      return;
    }
    try {
      const formattedComment = `[Retornado via ${returnToAnalysisChannel}] ${returnToAnalysisNotes.trim()}`;
      await startAnalysisMutation.mutateAsync(formattedComment);
      if (nextAssigneeId) {
        await assignMutation.mutateAsync(nextAssigneeId);
      }
      setShowReturnToAnalysisForm(false);
      setReturnToAnalysisNotes('');
      setNextAssigneeId('');
    } catch {
      // erros já tratados
    }
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

        {/* Stepper Visual de Status (10 Etapas) */}
        {(() => {
          const currentStatus = currentWarranty.status;
          if (currentStatus === 'CANCELADO') {
            return (
              <div className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/10 px-6 py-5">
                <div className="flex items-center gap-2 text-error bg-error/10 border border-error/20 rounded-lg p-3 text-sm font-semibold">
                  <MdCancel className="h-5 w-5 shrink-0" />
                  <span>Esta garantia foi cancelada.</span>
                </div>
              </div>
            );
          }

          const { step: activeStep, label: activeLabel, badgeColor } = getProgressStep(currentWarranty);
          const stepsCount = 10;
          const stepColors = [
            '#3B82F6', // 1. Novo (Azul)
            '#F97316', // 2. Em Triagem (Laranja)
            '#FBBF24', // 3. Em Análise (Amarelo)
            '#A855F7', // 4. Solução Proposta / Pendente Cliente (Roxo)
            '#06B6D4', // 5. Em Definição (Ciano)
            '#F87171', // 6. Reprovado (Vermelho/Coral)
            '#B45309', // 7. Logística/Envio (Castanho/Laranja Escuro)
            '#64748B', // 8. Em Logística (Cinza Slate)
            '#10B981', // 9. Resolvido (Verde)
            '#9CA3AF', // 10. Fechado (Cinza Escuro)
          ];

          return (
            <div className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/10 px-6 py-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Fileira de 10 pílulas */}
                <div className="flex gap-2">
                  {Array.from({ length: stepsCount }).map((_, idx) => {
                    const stepNum = idx + 1;
                    const isCompleted = stepNum < activeStep;
                    const isActive = stepNum === activeStep;
                    const color = stepColors[idx];
                    const info = STEP_INFO[idx];
                    
                    return (
                      <div key={idx} className="relative group flex-1">
                        <div
                          className="h-3 w-full rounded-full bg-gray-200 dark:bg-slate-700 transition-all duration-500 cursor-help"
                          style={{
                            backgroundColor: (isCompleted || isActive) 
                              ? color 
                              : undefined,
                            boxShadow: isActive 
                              ? `0 0 10px ${color}` 
                              : 'none',
                          }}
                        />
                        {/* Tooltip premium customizado */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-slate-900 dark:bg-slate-950 text-white text-[11px] p-2.5 rounded-lg shadow-xl text-center z-30 pointer-events-none transition-all">
                          <div className="font-bold mb-0.5" style={{ color }}>
                            {stepNum}. {info.name}
                          </div>
                          <div className="text-white/80 leading-normal">{info.desc}</div>
                          {/* Setinha do tooltip */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-950" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Rótulos e Badges */}
                <div className="flex justify-between items-start text-xs font-semibold text-gray-500 dark:text-slate-400">
                  {/* Esquerda: Novo */}
                  <div className="w-24 text-left">
                    <span>Novo</span>
                  </div>

                  {/* Centro: Badge ativo */}
                  <div className="flex flex-col items-center">
                    <div className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${badgeColor}`}>
                      {activeLabel}
                    </div>
                    <span className="mt-1.5 text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                      Etapa {activeStep} de {stepsCount}
                    </span>
                  </div>

                  {/* Direita: Fechado */}
                  <div className="w-24 text-right">
                    <span>Fechado</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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

                {/* Card: Fluxo de Trabalho e Próximos Passos */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                      <MdAssignment className="text-primary" /> Fluxo de Trabalho e Próximos Passos
                    </h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                      FSM do Sistema
                    </span>
                  </div>

                  {/* Mini-Fluxograma FSM Estático */}
                  <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-4">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Visualização do Fluxograma
                    </span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-center">
                      {/* 1. Recebido */}
                      <div className={`p-3 rounded-lg border transition-all ${
                        currentWarranty.status === 'RECEBIDO'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 font-bold shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                          : 'bg-white dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 opacity-60'
                      }`}>
                        <p className="text-xs">1. Recebido</p>
                        <span className="text-[10px] opacity-70">Novo Ticket</span>
                      </div>

                      {/* 2. Em Análise */}
                      <div className={`p-3 rounded-lg border transition-all relative ${
                        currentWarranty.status === 'EM_ANALISE'
                          ? 'bg-warning/15 text-warning border-warning/50 font-bold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'bg-white dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 opacity-60'
                      }`}>
                        <p className="text-xs">2. Em Análise</p>
                        <span className="text-[10px] opacity-70">Triagem / Definição</span>
                        {/* Setas de retorno para Pendente Cliente */}
                        <div className="hidden md:block absolute -right-3.5 top-1/2 transform -translate-y-1/2 text-gray-300 dark:text-slate-700 z-10 font-bold text-sm">↔</div>
                      </div>

                      {/* 3. Pendente Cliente */}
                      <div className={`p-3 rounded-lg border transition-all ${
                        currentWarranty.status === 'AGUARDANDO_CLIENTE'
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800 font-bold shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                          : 'bg-white dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 opacity-60'
                      }`}>
                        <p className="text-xs">3. Pendente Cliente</p>
                        <span className="text-[10px] opacity-70">Solução Proposta</span>
                      </div>

                      {/* 4. Decisão / Fim */}
                      <div className={`p-3 rounded-lg border transition-all ${
                        ['APROVADO', 'REPROVADO', 'FINALIZADO'].includes(currentWarranty.status)
                          ? 'bg-success/15 text-success border-success/50 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'bg-white dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 opacity-60'
                      }`}>
                        <p className="text-xs">4. Decisão & Fim</p>
                        <span className="text-[10px] opacity-70">
                          {currentWarranty.status === 'FINALIZADO' ? 'Finalizado' :
                           currentWarranty.status === 'APROVADO' ? 'Aprovado (Logística)' :
                           currentWarranty.status === 'REPROVADO' ? 'Reprovado' : 'Aprov./Reprov./Fim'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Contextualizado */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Situação do Ticket
                    </span>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
                        {currentWarranty.status === 'RECEBIDO' && "📥 A garantia foi registrada pelo cliente ou loja e está aguardando a triagem inicial para começar o fluxo de análise técnica."}
                        {currentWarranty.status === 'EM_ANALISE' && "🔍 A garantia está sob triagem e análise técnica. A equipe pode definir custos, tarefas, solicitar mais informações ao cliente, ou aprovar/rejeitar a solicitação."}
                        {currentWarranty.status === 'AGUARDANDO_CLIENTE' && "💡 A equipe Relm propôs uma solução ou solicitou informações adicionais do cliente. O fluxo aguarda a resposta do cliente ou o retorno manual à análise."}
                        {currentWarranty.status === 'APROVADO' && "🚚 A solicitação de garantia foi aprovada. O processo de logística para envio da peça de reposição está em andamento. Finalize a garantia quando concluído."}
                        {currentWarranty.status === 'REPROVADO' && "❌ A solicitação de garantia foi reprovada devido às especificações ou critérios não atendidos. Finalize a garantia para concluir o ticket."}
                        {currentWarranty.status === 'FINALIZADO' && "✅ Esta garantia foi resolvida e fechada. Nenhuma ação adicional é necessária."}
                        {currentWarranty.status === 'CANCELADO' && "🚫 Esta garantia foi cancelada. Nenhuma ação adicional é necessária."}
                      </p>
                    </div>
                  </div>

                  {/* Ações Disponíveis */}
                  {!['FINALIZADO', 'CANCELADO'].includes(currentWarranty.status) && (
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                        Ações de Transição
                      </span>
                      
                      {/* Mensagem de RBAC */}
                      {!isAdminOrManager && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                          <span className="text-sm shrink-0">⚠️</span>
                          <span>
                            <strong>Ações restritas:</strong> Seu perfil atual não possui permissão para executar transições nesta garantia. Apenas Administradores ou Gerentes da Relm podem realizar estas alterações.
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {/* RECEBIDO -> EM_ANALISE */}
                        {currentWarranty.status === 'RECEBIDO' && (
                          <button
                            onClick={() => setShowStartAnalysisForm(true)}
                            disabled={!isAdminOrManager || startAnalysisMutation.isPending}
                            className="px-5 py-2.5 bg-warning hover:bg-warning-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {!isAdminOrManager && <span>🔒</span>}
                            <MdPlayArrow size={16} /> Iniciar Análise
                          </button>
                        )}

                        {/* EM_ANALISE -> AGUARDANDO_CLIENTE / APROVADO / REPROVADO */}
                        {currentWarranty.status === 'EM_ANALISE' && (
                          <>
                            <button
                              onClick={() => {
                                setShowAwaitingClientForm(true);
                                setShowApproveForm(false);
                                setShowRejectForm(false);
                                setShowStartAnalysisForm(false);
                              }}
                              disabled={!isAdminOrManager || awaitingClientMutation.isPending}
                              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {!isAdminOrManager && <span>🔒</span>}
                              <span>💡</span> Solicitar Info / Propor Solução
                            </button>
                            <button
                              onClick={() => {
                                setShowApproveForm(true);
                                setShowAwaitingClientForm(false);
                                setShowRejectForm(false);
                                setShowStartAnalysisForm(false);
                              }}
                              disabled={!isAdminOrManager || approveMutation.isPending}
                              className="px-5 py-2.5 bg-success hover:bg-success-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {!isAdminOrManager && <span>🔒</span>}
                              <MdCheck size={16} /> Aprovar Garantia
                            </button>
                            <button
                              onClick={() => {
                                setShowRejectForm(true);
                                setShowAwaitingClientForm(false);
                                setShowApproveForm(false);
                                setShowStartAnalysisForm(false);
                              }}
                              disabled={!isAdminOrManager || rejectMutation.isPending}
                              className="px-5 py-2.5 border-2 border-error text-error hover:bg-error hover:text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                              {!isAdminOrManager && <span>🔒</span>}
                              <MdCancel size={16} /> Rejeitar Garantia
                            </button>
                          </>
                        )}

                        {/* AGUARDANDO_CLIENTE -> EM_ANALISE */}
                        {currentWarranty.status === 'AGUARDANDO_CLIENTE' && (
                          <button
                            onClick={() => {
                              setShowReturnToAnalysisForm(true);
                              setShowAwaitingClientForm(false);
                              setShowApproveForm(false);
                              setShowRejectForm(false);
                              setShowStartAnalysisForm(false);
                              setShowFinalizeForm(false);
                            }}
                            disabled={!isAdminOrManager || startAnalysisMutation.isPending}
                            className="px-5 py-2.5 bg-warning hover:bg-warning-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {!isAdminOrManager && <span>🔒</span>}
                            <MdPlayArrow size={16} /> Retornar para Análise
                          </button>
                        )}

                        {/* APROVADO / REPROVADO -> FINALIZADO */}
                        {['APROVADO', 'REPROVADO'].includes(currentWarranty.status) && (
                          <button
                            onClick={() => {
                              setShowFinalizeForm(true);
                              setShowApproveForm(false);
                              setShowRejectForm(false);
                              setShowAwaitingClientForm(false);
                            }}
                            disabled={!isAdminOrManager || finalizeMutation.isPending}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {!isAdminOrManager && <span>🔒</span>}
                            <MdCheckCircle size={16} /> Finalizar Garantia
                          </button>
                        )}
                      </div>

                      {/* Formulários de Confirmação e Ação Inline */}
                      <div className="space-y-4 pt-2">
                        {/* Formulário Iniciar Análise */}
                        {showStartAnalysisForm && (
                          <div className="bg-primary/5 dark:bg-primary-400/10 border border-primary/20 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                              <MdPlayArrow size={18} className="text-primary" /> Iniciar Análise da Garantia
                            </h4>
                            <div>
                              <label htmlFor="startAnalysisAssignee" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Responsável pela Análise
                              </label>
                              <select
                                id="startAnalysisAssignee"
                                value={nextAssigneeId}
                                onChange={(e) => setNextAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                              >
                                <option value="">— Sem responsável —</option>
                                {assignableUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="startAnalysisNotes" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Notas Internas / Observações (opcional)
                              </label>
                              <textarea
                                id="startAnalysisNotes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                                placeholder="Observações iniciais sobre a triagem..."
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowStartAnalysisForm(false);
                                  setNextAssigneeId('');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                disabled={startAnalysisMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleStartAnalysis}
                                disabled={startAnalysisMutation.isPending}
                                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {startAnalysisMutation.isPending && (
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Confirmar Início
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Formulário Solicitar Info / Propor Solução (Pendente Cliente) */}
                        {showAwaitingClientForm && (
                          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                              <span>💡</span> Solicitar Informações / Propor Solução
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                              Descreva as informações que o cliente precisa enviar ou a solução proposta. Este texto será registrado e enviado ao cliente.
                            </p>
                            <div>
                              <label htmlFor="awaitingClientComment" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Instruções / Proposta para o Cliente *
                              </label>
                              <textarea
                                id="awaitingClientComment"
                                value={awaitingClientComment}
                                onChange={(e) => setAwaitingClientComment(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-purple-300 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-slate-100 text-sm"
                                placeholder="Ex.: Solicito fotos adicionais do número de série..."
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="awaitingClientAssignee" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Responsável pelo Acompanhamento
                              </label>
                              <select
                                id="awaitingClientAssignee"
                                value={nextAssigneeId}
                                onChange={(e) => setNextAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-purple-300 dark:border-purple-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-slate-100 text-sm"
                              >
                                <option value="">— Sem responsável —</option>
                                {assignableUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowAwaitingClientForm(false);
                                  setAwaitingClientComment('');
                                  setNextAssigneeId('');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                disabled={awaitingClientMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleAwaitingClient}
                                disabled={awaitingClientMutation.isPending || !awaitingClientComment.trim()}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {awaitingClientMutation.isPending && (
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Enviar Solicitação
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Formulário Aprovar Garantia */}
                        {showApproveForm && (
                          <div className="bg-success/5 dark:bg-success/10 border border-success/20 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-success flex items-center gap-2">
                              <MdCheck size={18} className="text-success" /> Aprovar Garantia
                            </h4>
                            <div>
                              <label htmlFor="approveAssignee" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Responsável pela Próxima Etapa (Logística/Envio)
                              </label>
                              <select
                                id="approveAssignee"
                                value={nextAssigneeId}
                                onChange={(e) => setNextAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-success dark:text-slate-100 text-sm"
                              >
                                <option value="">— Sem responsável —</option>
                                {assignableUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="approveNotes" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Notas Internas / Observações (opcional)
                              </label>
                              <textarea
                                id="approveNotes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-success dark:text-slate-100 text-sm"
                                placeholder="Observações ou orientações sobre a aprovação..."
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowApproveForm(false);
                                  setNextAssigneeId('');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                disabled={approveMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleApprove}
                                disabled={approveMutation.isPending}
                                className="px-4 py-2 bg-success hover:bg-success-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {approveMutation.isPending && (
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Confirmar Aprovação
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Formulário Rejeitar Garantia */}
                        {showRejectForm && (
                          <div className="bg-error/5 dark:bg-error/10 border border-error/20 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-error flex items-center gap-2">
                              <MdCancel size={18} className="text-error" /> Rejeitar Garantia
                            </h4>
                            <div>
                              <label htmlFor="rejectionReason" className="block text-xs font-semibold text-error mb-2">
                                Motivo da Rejeição *
                              </label>
                              <textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-error/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent dark:text-slate-100 text-sm"
                                placeholder="Explique ao cliente o motivo da rejeição..."
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="rejectAssignee" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Responsável pela Próxima Etapa
                              </label>
                              <select
                                id="rejectAssignee"
                                value={nextAssigneeId}
                                onChange={(e) => setNextAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-error/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent dark:text-slate-100 text-sm"
                              >
                                <option value="">— Sem responsável —</option>
                                {assignableUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor="adminNotesReject" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Notas Internas (opcional)
                              </label>
                              <textarea
                                id="adminNotesReject"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-error/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent dark:text-slate-100 text-sm"
                                placeholder="Observações internas..."
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowRejectForm(false);
                                  setRejectionReason('');
                                  setNextAssigneeId('');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                disabled={rejectMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleReject}
                                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                className="px-4 py-2 bg-error hover:bg-error-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                              >
                                {rejectMutation.isPending && (
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Confirmar Rejeição
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Formulário Finalizar Garantia */}
                        {showFinalizeForm && (
                          <div className="bg-primary/5 dark:bg-primary-400/10 border border-primary/20 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                              <MdCheckCircle size={18} className="text-primary" /> Finalizar Garantia
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                              Descreva a resolução técnica final desta garantia. Este campo é obrigatório para fechamento.
                            </p>
                            <div>
                              <label htmlFor="resolutionText" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Resolução / Detalhes do Encerramento *
                              </label>
                              <textarea
                                id="resolutionText"
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                                placeholder="Ex.: Peça trocada com sucesso e bicicleta entregue ao cliente."
                                required
                              />
                            </div>
                            <div>
                              <label htmlFor="finalizeAssignee" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Responsável pelo Encerramento
                              </label>
                              <select
                                id="finalizeAssignee"
                                value={nextAssigneeId}
                                onChange={(e) => setNextAssigneeId(e.target.value)}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                              >
                                <option value="">— Sem responsável —</option>
                                {assignableUsers.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowFinalizeForm(false);
                                  setResolutionText('');
                                  setNextAssigneeId('');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                disabled={finalizeMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleFinalize}
                                disabled={finalizeMutation.isPending || !resolutionText.trim()}
                                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {finalizeMutation.isPending && (
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Confirmar Encerramento
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Formulário Retornar para Análise */}
                        {showReturnToAnalysisForm && (
                          <div className="bg-warning/5 dark:bg-warning/10 border border-warning/20 rounded-lg p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-warning flex items-center gap-2">
                              <MdPlayArrow size={18} className="text-warning" /> Retornar Garantia para Análise
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-slate-400">
                              Registre o retorno manual de contato do cliente realizado fora da plataforma. A garantia voltará para o status <strong>Em Análise</strong>.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="returnToAnalysisChannel" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                  Canal de Comunicação *
                                </label>
                                <select
                                  id="returnToAnalysisChannel"
                                  value={returnToAnalysisChannel}
                                  onChange={(e) => setReturnToAnalysisChannel(e.target.value)}
                                  className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-warning/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning dark:text-slate-100 text-sm"
                                >
                                  <option value="WhatsApp">WhatsApp</option>
                                  <option value="E-mail">E-mail</option>
                                  <option value="Telefone">Telefone</option>
                                  <option value="Outro">Outro</option>
                                </select>
                              </div>
                              <div>
                                <label htmlFor="returnToAnalysisAssignee" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                  Responsável pela Análise
                                </label>
                                <select
                                  id="returnToAnalysisAssignee"
                                  value={nextAssigneeId}
                                  onChange={(e) => setNextAssigneeId(e.target.value)}
                                  className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-warning/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning dark:text-slate-100 text-sm"
                                >
                                  <option value="">— Sem responsável —</option>
                                  {assignableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label htmlFor="returnToAnalysisNotes" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                Justificativa / Detalhes do Contato *
                              </label>
                              <textarea
                                id="returnToAnalysisNotes"
                                value={returnToAnalysisNotes}
                                onChange={(e) => setReturnToAnalysisNotes(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-warning/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning dark:text-slate-100 text-sm"
                                placeholder="Descreva o que foi acordado ou respondido pelo cliente (ex: cliente enviou os dados via WhatsApp)..."
                                required
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => {
                                  setShowReturnToAnalysisForm(false);
                                  setReturnToAnalysisNotes('');
                                  setNextAssigneeId('');
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                                disabled={startAnalysisMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={handleReturnToAnalysis}
                                disabled={startAnalysisMutation.isPending || !returnToAnalysisNotes.trim()}
                                className="px-4 py-2 bg-warning hover:bg-warning-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                {startAnalysisMutation.isPending && (
                                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                                Confirmar Retorno
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                      <label htmlFor="revertAssignee" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Novo Responsável (para a próxima etapa)
                      </label>
                      <select
                        id="revertAssignee"
                        value={nextAssigneeId}
                        onChange={(e) => setNextAssigneeId(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-warning/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-warning focus:border-transparent dark:text-slate-100 text-sm"
                      >
                        <option value="">— Manter responsável atual / Sem alterar —</option>
                        {assignableUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
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

                {/* Formulário para Iniciar Análise */}
                {showStartAnalysisForm && (
                  <div className="bg-primary/5 dark:bg-primary-400/10 border border-primary/20 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                      <MdPlayArrow size={18} className="text-primary" /> Iniciar Análise da Garantia
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Defina um responsável da equipe para acompanhar a triagem desta garantia.
                    </p>
                    {isAdminOrManager && (
                      <div>
                        <label htmlFor="startAnalysisAssignee" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Responsável pela Análise
                        </label>
                        <select
                          id="startAnalysisAssignee"
                          value={nextAssigneeId}
                          onChange={(e) => setNextAssigneeId(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                        >
                          <option value="">— Sem responsável —</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="startAnalysisNotes" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Notas Internas / Observações (opcional)
                      </label>
                      <textarea
                        id="startAnalysisNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                        placeholder="Observações iniciais sobre a triagem..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowStartAnalysisForm(false);
                          setNextAssigneeId('');
                        }}
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                        disabled={startAnalysisMutation.isPending}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleStartAnalysis}
                        disabled={startAnalysisMutation.isPending}
                        className="px-5 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {startAnalysisMutation.isPending && (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Confirmar Início
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulário para Aprovar Garantia */}
                {showApproveForm && (
                  <div className="bg-success/5 dark:bg-success/10 border border-success/20 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-success flex items-center gap-2">
                      <MdCheck size={18} className="text-success" /> Aprovar Garantia
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Defina quem será o responsável por conduzir a próxima etapa (Logística/Envio da peça de reposição).
                    </p>
                    {isAdminOrManager && (
                      <div>
                        <label htmlFor="approveAssignee" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Responsável pela Próxima Etapa
                        </label>
                        <select
                          id="approveAssignee"
                          value={nextAssigneeId}
                          onChange={(e) => setNextAssigneeId(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-success dark:text-slate-100 text-sm"
                        >
                          <option value="">— Sem responsável —</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label htmlFor="approveNotes" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        Notas Internas / Observações (opcional)
                      </label>
                      <textarea
                        id="approveNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-success dark:text-slate-100 text-sm"
                        placeholder="Observações ou orientações sobre a aprovação..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowApproveForm(false);
                          setNextAssigneeId('');
                        }}
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                        disabled={approveMutation.isPending}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={approveMutation.isPending}
                        className="px-5 py-2 bg-success hover:bg-success-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        {approveMutation.isPending && (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Confirmar Aprovação
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulário de Rejeição */}
                {showRejectForm && (
                  <div className="bg-error/5 dark:bg-error/10 border border-error/20 rounded-lg p-4 space-y-4">
                    <h3 className="text-lg font-semibold text-error flex items-center gap-2">
                      <MdCancel size={18} className="text-error" /> Rejeitar Garantia
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      Defina o motivo da rejeição e quem será o responsável por acompanhar a conclusão desta garantia.
                    </p>
                    {isAdminOrManager && (
                      <div>
                        <label htmlFor="rejectAssignee" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Responsável pela Próxima Etapa
                        </label>
                        <select
                          id="rejectAssignee"
                          value={nextAssigneeId}
                          onChange={(e) => setNextAssigneeId(e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-error/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent dark:text-slate-100 text-sm"
                        >
                          <option value="">— Sem responsável —</option>
                          {assignableUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
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
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                          setNextAssigneeId('');
                        }}
                        className="px-5 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                        disabled={rejectMutation.isPending}
                      >
                        Cancelar Rejeição
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={rejectMutation.isPending || !rejectionReason.trim()}
                        className="px-5 py-2 bg-error hover:bg-error-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {rejectMutation.isPending && (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Confirmar Rejeição
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Aba ANEXOS ─────────────────────────────────────────── */}
            {activeTab === 'anexos' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <label className="px-5 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                    <MdUploadFile size={16} />
                    {uploadAttachmentMutation.isPending ? 'Enviando…' : 'Enviar arquivo'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,image/*"
                      onChange={handleFileChange}
                      disabled={uploadAttachmentMutation.isPending}
                    />
                  </label>
                </div>

                {(currentWarranty.attachments || []).length === 0 ? (
                  <EmptyState>
                    <MdAttachFile className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    Nenhum anexo ainda
                  </EmptyState>
                ) : (
                  <ul className="space-y-2">
                    {currentWarranty.attachments.map((att) => (
                      <li
                        key={att.id}
                        className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3"
                      >
                        <MdAttachFile size={20} className="shrink-0 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{att.fileName}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {formatBytes(att.size)} · {formatDateTime(att.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownloadAttachment(att)}
                          className="shrink-0 text-gray-400 hover:text-primary"
                          title="Baixar"
                        >
                          <MdDownload size={18} />
                        </button>
                        <button
                          onClick={() => deleteAttachmentMutation.mutate(att.id)}
                          disabled={deleteAttachmentMutation.isPending}
                          className="shrink-0 text-gray-400 hover:text-error disabled:opacity-50"
                          title="Remover"
                        >
                          <MdDelete size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500">PDF ou imagem, até 10MB.</p>
              </div>
            )}

            {/* ── Aba TAREFAS ────────────────────────────────────────── */}
            {activeTab === 'tarefas' && (
              <div className="space-y-4">
                {/* Lista */}
                {(currentWarranty.tasks || []).length === 0 ? (
                  <EmptyState>
                    <MdAssignment className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    Nenhuma tarefa ainda
                  </EmptyState>
                ) : (
                  <ul className="space-y-2">
                    {currentWarranty.tasks.map((task) => {
                      const done = task.status === 'concluida';
                      return (
                        <li
                          key={task.id}
                          className="flex items-start gap-3 bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3"
                        >
                          <button
                            onClick={() => toggleTaskDone(task)}
                            disabled={updateTaskMutation.isPending}
                            className="mt-0.5 shrink-0 text-primary disabled:opacity-50"
                            title={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
                          >
                            {done ? <MdCheckCircle size={20} className="text-success" /> : <MdRadioButtonUnchecked size={20} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${done ? 'line-through text-gray-400 dark:text-slate-500' : 'text-gray-900 dark:text-slate-100'}`}>
                              {task.title}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                                task.status === 'concluida' ? 'bg-success/10 border-success/20 text-success' :
                                task.status === 'cancelada' ? 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300' :
                                'bg-warning/10 border-warning/20 text-warning'
                              }`}>
                                {task.status === 'concluida' ? 'Concluída' : task.status === 'pendente' ? 'Pendente' : task.status}
                              </span>

                              {task.autoGenerated && (
                                <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full font-semibold border bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400">
                                  <MdFlashOn className="w-3.5 h-3.5" />
                                  <span>Automática</span>
                                </span>
                              )}

                              {(() => {
                                if (!task.assignee) return null;
                                const parsed = parseAssignee(task.assignee);
                                if (parsed.role) {
                                  const badgeClass = roleBadgeClasses[parsed.role] || 'bg-gray-50 dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700';
                                  return (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-gray-400">→</span>
                                      <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
                                        {parsed.role}
                                      </span>
                                      {parsed.name && (
                                        <span className="text-gray-600 dark:text-slate-300 font-medium">{parsed.name}</span>
                                      )}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                                    <span>→</span>
                                    <span className="font-medium">{task.assignee}</span>
                                  </span>
                                );
                              })()}

                              {task.dueDate && (
                                <span className="text-gray-500 dark:text-slate-400 flex items-center gap-1 bg-gray-50 dark:bg-slate-900/20 border border-gray-100 dark:border-slate-800/50 px-2.5 py-0.5 rounded-full">
                                  <MdEvent size={13} className="text-gray-400" />
                                  <span>Vence em {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                            className="shrink-0 text-gray-400 hover:text-error disabled:opacity-50"
                            title="Remover tarefa"
                          >
                            <MdDelete size={18} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Nova tarefa */}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Nova tarefa</h4>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Título (ex.: Enviar pneu para a fábrica)"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-100 text-sm"
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="Responsável (opcional)"
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-100 text-sm"
                    />
                    <input
                      type="date"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-100 text-sm"
                    />
                    <button
                      onClick={handleCreateTask}
                      disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
                      className="px-5 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <MdAdd size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              </div>
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
                        <div className="shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          {(ev.createdBy?.name || 'Sistema').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 border-b border-gray-100 dark:border-slate-800 pb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                              {ev.createdBy?.name || 'Sistema'}
                            </span>
                            {(() => {
                              const badge = getActionBadge(ev);
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 shadow-sm">
                                  <span>{badge.emoji}</span>
                                  <span>{badge.text}</span>
                                </span>
                              );
                            })()}
                            {ev.fromStatus && ev.toStatus && (
                              <span className="flex items-center gap-1.5 text-[11px] ml-1">
                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium">
                                  {STATUS_LABELS_HISTORY[ev.fromStatus] || ev.fromStatus}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="px-1.5 py-0.5 rounded bg-primary text-white font-medium">
                                  {STATUS_LABELS_HISTORY[ev.toStatus] || ev.toStatus}
                                </span>
                                {currentWarranty.assignedTo?.name && (
                                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium ml-1">
                                    <span>🌐</span>
                                    <span>→</span>
                                    <span>{currentWarranty.assignedTo.name}</span>
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {ev.comment && (
                            <p className="mt-1 text-sm italic text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                              "{ev.comment}"
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            <span>{formatDateTimeWithWord(ev.createdAt)}</span>
                            <span>·</span>
                            {ev.eventType === 'CREATED' ? (
                              <span className="flex items-center gap-1">
                                <span>👁️</span>
                                <span>Público</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <span>🔒</span>
                                <span>Interno</span>
                              </span>
                            )}
                          </p>
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
            {/* Responsável */}
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <MdSupportAgent size={16} className="text-gray-500 dark:text-slate-400" /> Responsável
              </h4>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                {currentWarranty.assignedTo?.name || '—'}
              </p>
              {isAdminOrManager && (
                <select
                  value={currentWarranty.assignedToUserId || ''}
                  onChange={(e) => assignMutation.mutate(e.target.value || null)}
                  disabled={assignMutation.isPending}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 disabled:opacity-50"
                >
                  <option value="">— Sem responsável —</option>
                  {assignableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              )}
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
                <div>
                  <span className="text-gray-500 dark:text-slate-400 text-xs">Fecha automaticamente</span>
                  <p className={`font-medium ${currentWarranty.autoCloseAt ? 'text-warning' : 'text-gray-400 dark:text-slate-500'}`}>
                    {currentWarranty.autoCloseAt ? formatDateTime(currentWarranty.autoCloseAt) : '—'}
                  </p>
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

        </div>
      </div>
    </div>
  );
}
