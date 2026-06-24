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
import WarrantyWorkflowPanel from './WarrantyWorkflowPanel';


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

// Código do perfil (UserRole no backend) -> rótulo amigável.
const ROLE_LABELS = {
  ADMIN_RELM: 'Admin',
  GERENTE_RELM: 'Gerente',
  SUPORTE_RELM: 'Suporte',
  LOJA: 'Loja',
  DISTRIBUIDOR: 'Distribuidor',
  CLIENTE: 'Cliente',
};

export default function WarrantyReviewModal({ warranty, onClose, onSuccess }) {
  const { data: fullWarranty, refetch: refetchWarranty } = useQuery({
    queryKey: ['warranty-claim-detail', warranty.id],
    queryFn: () => warrantyAPI.getById(warranty.id),
    initialData: warranty,
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ['warranty-statuses'],
    queryFn: () => warrantyAPI.getStatuses(),
    staleTime: 5 * 60 * 1000,
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
  const [newTaskRole, setNewTaskRole] = useState('');
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

  const ACTION_CONFIG = {
    status_change: { label: 'Mudança de status', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
    solution_proposed: { label: 'Solução proposta', color: 'bg-yellow-100 text-yellow-800', icon: '💡' },
    solution_approved: { label: 'Solução aprovada', color: 'bg-green-100 text-green-800', icon: '✅' },
    solution_rejected: { label: 'Solução reprovada', color: 'bg-red-100 text-red-800', icon: '❌' },
    note: { label: 'Nota', color: 'bg-gray-100 text-gray-800', icon: '📝' },
    task_created: { label: 'Tarefa criada', color: 'bg-purple-100 text-purple-800', icon: '📋' },
    default: { label: 'Ação', color: 'bg-gray-100 text-gray-800', icon: '⚙️' },
  };
  const getActionConfig = (actionType) => ACTION_CONFIG[actionType] || ACTION_CONFIG.default;
  const getStatusLabel = (statusId) => statuses.find((s) => s.id === statusId)?.name || `ID ${statusId}`;
  const getStatusColor = (statusId) => statuses.find((s) => s.id === statusId)?.color;
  const getUserName = (userId) => assignableUsers.find((u) => u.id === userId)?.name;

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
      setNewTaskRole('');
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
      assigneeRole: newTaskRole || undefined,
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

  // Visibilidade das tarefas: ADMIN/GERENTE veem todas; demais perfis veem
  // apenas as do seu perfil (assigneeRole).
  const allTasks = currentWarranty.tasks || [];
  const visibleTasks = isAdminOrManager
    ? allTasks
    : allTasks.filter((t) => t.assigneeRole === userType);
  const hiddenTaskCount = allTasks.length - visibleTasks.length;

  // Tarefas vinculadas à etapa (status) atual — alimentam "Próximos Passos".
  const currentStageTasks = visibleTasks.filter((t) => t.stage === currentWarranty.status);
  const pendingStageTasks = currentStageTasks.filter((t) => t.status === 'pendente');

  const resolvedAt =
    events.filter((e) => e.toStatus === 'FINALIZADO').slice(-1)[0]?.createdAt ||
    (['FINALIZADO', 'CANCELADO'].includes(currentWarranty.status)
      ? currentWarranty.updatedAt
      : null);

  const TABS = [
    { id: 'principal', label: 'Principal' },
    { id: 'anexos', label: 'Anexos' },
    { id: 'tarefas', label: 'Tarefas' },
    { id: 'historico', label: `Histórico (${(currentWarranty.history || []).length})` },
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
                      <span
                        className="inline-block ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${currentWarranty.statusDef?.color || '#666'}1a`, color: currentWarranty.statusDef?.color || '#666' }}
                      >
                        {currentWarranty.statusDef?.name || currentWarranty.status}
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

                {/* Novo workflow: status configurável + soluções (2 níveis) */}
                <WarrantyWorkflowPanel
                  warranty={currentWarranty}
                  onChanged={refetchWarranty}
                  assignableUsers={assignableUsers}
                  userType={userType}
                />
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
                {!isAdminOrManager && (
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Mostrando apenas as tarefas do seu perfil.
                  </p>
                )}
                {/* Lista */}
                {visibleTasks.length === 0 ? (
                  <EmptyState>
                    <MdAssignment className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    {allTasks.length > 0 && hiddenTaskCount > 0
                      ? 'Nenhuma tarefa do seu perfil'
                      : 'Nenhuma tarefa ainda'}
                  </EmptyState>
                ) : (
                  <ul className="space-y-2">
                    {visibleTasks.map((task) => {
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
                                // Perfil responsável: preferir a coluna assigneeRole;
                                // fallback ao texto legado "[Label] Nome".
                                const parsed = parseAssignee(task.assignee);
                                const roleLabel = task.assigneeRole
                                  ? (ROLE_LABELS[task.assigneeRole] || task.assigneeRole)
                                  : parsed.role;
                                const name = task.assigneeRole ? (task.assignee || '') : parsed.name;
                                if (roleLabel) {
                                  const badgeClass = roleBadgeClasses[roleLabel] || 'bg-gray-50 dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700';
                                  return (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-gray-400">→</span>
                                      <span className={`px-2.5 py-0.5 rounded-full font-semibold border ${badgeClass}`}>
                                        {roleLabel}
                                      </span>
                                      {name && (
                                        <span className="text-gray-600 dark:text-slate-300 font-medium">{name}</span>
                                      )}
                                    </span>
                                  );
                                }
                                if (!task.assignee) return null;
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
                      placeholder="Nome (opcional)"
                      className="flex-1 px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:text-slate-100 text-sm"
                    />
                    <select
                      value={newTaskRole}
                      onChange={(e) => setNewTaskRole(e.target.value)}
                      className="px-4 py-2 bg-white dark:bg-slate-900/50 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:text-slate-100 text-sm"
                    >
                      <option value="">Perfil…</option>
                      {Object.entries(ROLE_LABELS).map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
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
                {(currentWarranty.history || []).length === 0 ? (
                  <EmptyState>Nenhuma ação registrada ainda.</EmptyState>
                ) : (
                  <ol className="space-y-4">
                    {(currentWarranty.history || []).map((h) => {
                      const cfg = getActionConfig(h.actionType);
                      const fromStatus = h.statusFromId ? { label: getStatusLabel(h.statusFromId), color: getStatusColor(h.statusFromId) } : null;
                      const toStatus = h.statusToId ? { label: getStatusLabel(h.statusToId), color: getStatusColor(h.statusToId) } : null;
                      const fromUser = h.ballFromId ? getUserName(h.ballFromId) : null;
                      const toUser = h.ballToId ? getUserName(h.ballToId) : null;
                      const actor = h.userId ? getUserName(h.userId) : 'Sistema';

                      return (
                        <li key={h.id} className="flex gap-3 text-sm border-b border-gray-100 dark:border-slate-800 pb-4">
                          <div className="shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-lg leading-none">
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-slate-100">{actor}</span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                              {fromStatus && toStatus && (
                                <span className="flex items-center gap-1.5 text-[11px]">
                                  <span className="px-1.5 py-0.5 rounded text-gray-700 dark:text-slate-300 font-medium" style={{color: fromStatus.color}}>{fromStatus.label}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="px-1.5 py-0.5 rounded text-gray-700 dark:text-slate-300 font-medium" style={{color: toStatus.color}}>{toStatus.label}</span>
                                </span>
                              )}
                              {fromUser && toUser && (
                                <span className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-slate-400">
                                  <span>🌐</span><span>{fromUser ?? 'Ninguém'}</span><span>→</span><span>{toUser ?? 'Ninguém'}</span>
                                </span>
                              )}
                            </div>
                            {h.note && (
                              <p className="mt-1 text-xs italic text-gray-600 dark:text-slate-400 whitespace-pre-wrap">{h.note}</p>
                            )}
                            <p className="mt-1.5 text-[10px] text-gray-400 dark:text-slate-500">
                              {new Date(h.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </li>
                      );
                    })}
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
