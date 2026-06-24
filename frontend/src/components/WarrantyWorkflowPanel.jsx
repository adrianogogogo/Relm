import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { warrantyAPI } from '../services/api';
import Dialog from './Dialog';

// Mantém sincronizado com SOLUTION_TYPES_REQUIRE_DIRECTOR do backend.
const SOLUTION_TYPES = [
  { value: 'reparo', label: '🔧 Reparo / Manutenção', requiresDirector: false },
  { value: 'troca', label: '🔄 Troca de Produto', requiresDirector: true },
  { value: 'reembolso', label: '💰 Reembolso', requiresDirector: true },
  { value: 'cortesia', label: '🎁 Cortesia / Bonificação', requiresDirector: false },
  { value: 'outro', label: '📋 Outro', requiresDirector: false },
];
const typeLabel = (v) => SOLUTION_TYPES.find((t) => t.value === v)?.label || v;
const fmtBRL = (v) =>
  v == null ? null : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function WarrantyWorkflowPanel({ warranty, onChanged, assignableUsers = [], userType }) {
  const isAdminOrManager = userType === 'ADMIN_RELM' || userType === 'GERENTE_RELM';

  const { data: statuses = [] } = useQuery({
    queryKey: ['warranty-statuses'],
    queryFn: () => warrantyAPI.getStatuses(),
    staleTime: 5 * 60 * 1000,
  });

  const [statusId, setStatusId] = useState(warranty.statusId || '');
  const [ballOwnerId, setBallOwnerId] = useState(warranty.assignedToUserId || '');
  const [note, setNote] = useState('');

  const [sol, setSol] = useState({ description: '', solutionType: 'reparo', hasCost: false, costValue: '' });
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [openSolutionDialog, setOpenSolutionDialog] = useState(false);

  const refresh = () => onChanged?.();

  const statusMut = useMutation({
    mutationFn: () => warrantyAPI.updateWorkflowStatus(warranty.id, {
      statusId: statusId ? Number(statusId) : undefined,
      ballOwnerId: ballOwnerId || undefined,
      note: note.trim() || undefined,
    }),
    onSuccess: () => { setNote(''); setOpenStatusDialog(false); refresh(); },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const addSolMut = useMutation({
    mutationFn: () => warrantyAPI.addSolution(warranty.id, {
      description: sol.description.trim(),
      solutionType: sol.solutionType,
      hasCost: sol.hasCost,
      costValue: sol.hasCost && sol.costValue ? Number(sol.costValue) : undefined,
    }),
    onSuccess: () => { setSol({ description: '', solutionType: 'reparo', hasCost: false, costValue: '' }); setOpenSolutionDialog(false); refresh(); },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const approveMut = useMutation({
    mutationFn: ({ solutionId, approved, rejectionReason }) =>
      warrantyAPI.approveSolution(warranty.id, solutionId, { approved, rejectionReason }),
    onSuccess: (data) => {
      setRejectingId(null); setRejectReason('');
      if (data?.next_level === 'diretor') alert('✅ Aprovado pelo gestor — aguardando diretor.');
      refresh();
    },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const handleAddSolution = () => {
    if (!sol.description.trim()) { alert('Descreva a solução.'); return; }
    addSolMut.mutate();
  };

  const solRequiresDirector = SOLUTION_TYPES.find((t) => t.value === sol.solutionType)?.requiresDirector;
  const solutions = warranty.solutions || [];

  // ── Timeline helpers ──
  const history = warranty.history || [];
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Status & Soluções</h3>

      {/* Régua de status */}
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((s) => {
          const current = s.id === warranty.statusId;
          const passed = warranty.statusId && s.sortOrder < (warranty.statusDef?.sortOrder ?? 0);
          return (
            <span
              key={s.id}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold border"
              style={current
                ? { backgroundColor: s.color, color: '#fff', borderColor: s.color }
                : { backgroundColor: `${s.color}1a`, color: s.color, borderColor: `${s.color}40`, opacity: passed ? 1 : 0.5 }}
              title={s.description || s.name}
            >
              {s.name}
            </span>
          );
        })}
      </div>

      {/* Botões de ação */}
      {isAdminOrManager && (
        <div className="flex gap-3 border-t border-gray-100 dark:border-slate-800 pt-4">
          <button onClick={() => setOpenStatusDialog(true)} className="btn btn-primary flex-1">
            Atualizar status
          </button>
          <button onClick={() => setOpenSolutionDialog(true)} className="btn btn-outline flex-1">
            Propor solução
          </button>
        </div>
      )}

      {/* ── Dialog: Atualizar status + passar a bola ── */}
      <Dialog
        open={openStatusDialog}
        onClose={() => setOpenStatusDialog(false)}
        title="Atualizar Status / Passar a Bola"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <label className="block text-sm text-gray-600 dark:text-slate-300">Status</label>
            <select className="input" value={statusId} onChange={(e) => setStatusId(e.target.value)}>
              <option value="">Manter status</option>
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <label className="block text-sm text-gray-600 dark:text-slate-300">Passar a bola para</label>
            <select className="input" value={ballOwnerId} onChange={(e) => setBallOwnerId(e.target.value)}>
              <option value="">Mantém comigo</option>
              {assignableUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <textarea className="input" rows={3} placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => setOpenStatusDialog(false)}>Cancelar</button>
            <button onClick={() => statusMut.mutate()} disabled={statusMut.isPending} className="btn btn-primary">
              {statusMut.isPending ? 'Salvando…' : 'Atualizar status'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Lista de soluções */}
      <div className="space-y-3 border-t border-gray-100 dark:border-slate-800 pt-4">
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Soluções propostas</span>
        {solutions.length === 0 && <p className="text-sm text-gray-400 dark:text-slate-500 italic">Nenhuma solução proposta.</p>}
        {solutions.map((s) => {
          const isAwaitingGestor = s.status === 'pendente' && s.authorizationLevel === 'gestor';
          const isAwaitingDirector = s.status === 'pendente' && s.authorizationLevel === 'diretor';
          const canActAsGestor = isAwaitingGestor && ['GERENTE_RELM', 'ADMIN_RELM'].includes(userType);
          const canActAsDirector = isAwaitingDirector && userType === 'ADMIN_RELM';
          const badge = s.status === 'aprovado' ? 'bg-success/15 text-success'
            : s.status === 'reprovado' ? 'bg-error/15 text-error'
            : 'bg-warning/15 text-warning';
          return (
            <div key={s.id} className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-gray-900 dark:text-slate-100">{typeLabel(s.solutionType)}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge}`}>
                  {s.status === 'pendente' ? (isAwaitingDirector ? 'Aguardando diretor' : 'Aguardando gestor') : s.status}
                </span>
                {s.hasCost && fmtBRL(s.costValue) && (
                  <span className="text-xs text-gray-600 dark:text-slate-400">{fmtBRL(s.costValue)}</span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{s.description}</p>
              {s.status === 'reprovado' && s.rejectionReason && (
                <p className="text-xs text-error">Motivo: {s.rejectionReason}</p>
              )}

              {rejectingId === s.id ? (
                <div className="space-y-2">
                  <textarea className="input" rows={2} placeholder="Motivo da reprovação" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <button className="text-xs font-semibold text-gray-600 px-3" onClick={() => { setRejectingId(null); setRejectReason(''); }}>Cancelar</button>
                    <button className="px-3 py-1.5 bg-error text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      disabled={approveMut.isPending || !rejectReason.trim()}
                      onClick={() => approveMut.mutate({ solutionId: s.id, approved: false, rejectionReason: rejectReason.trim() })}>
                      Confirmar reprovação
                    </button>
                  </div>
                </div>
              ) : (canActAsGestor || canActAsDirector) && (
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1.5 border border-error text-error rounded-lg text-xs font-semibold hover:bg-error hover:text-white"
                    onClick={() => setRejectingId(s.id)}>
                    Reprovar
                  </button>
                  <button className="px-3 py-1.5 bg-success text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    disabled={approveMut.isPending}
                    onClick={() => approveMut.mutate({ solutionId: s.id, approved: true })}>
                    {canActAsDirector ? 'Confirmar e autorizar' : (s.requiresDirector ? 'Aprovar (enviar ao diretor)' : 'Aprovar')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dialog: Propor solução ── */}
      <Dialog open={openSolutionDialog} onClose={() => setOpenSolutionDialog(false)} title="Propor Solução">
        <div className="space-y-4">
          <select className="input" value={sol.solutionType} onChange={(e) => setSol({ ...sol, solutionType: e.target.value })}>
            {SOLUTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {solRequiresDirector && (
            <p className="text-xs text-warning">⚠️ Este tipo exige confirmação do diretor (ADMIN).</p>
          )}
          <textarea className="input" rows={3} placeholder="Descrição da solução *" value={sol.description} onChange={(e) => setSol({ ...sol, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sol.hasCost} onChange={(e) => setSol({ ...sol, hasCost: e.target.checked })} />
            Tem custo
          </label>
          {sol.hasCost && (
            <input className="input" type="number" min="0" step="0.01" placeholder="Valor (R$)" value={sol.costValue} onChange={(e) => setSol({ ...sol, costValue: e.target.value })} />
          )}
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => setOpenSolutionDialog(false)}>Cancelar</button>
            <button onClick={handleAddSolution} disabled={addSolMut.isPending || !sol.description.trim()} className="btn btn-primary">
              {addSolMut.isPending ? 'Enviando…' : 'Propor solução'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* ── Timeline do histórico (warranty_history) ── */}
      <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
        <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Histórico de ações</span>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 italic">Nenhuma ação registrada ainda.</p>
        ) : (
          <ol className="space-y-3">
            {history.map((h) => {
              const cfg = getActionConfig(h.actionType);
              const fromStatus = h.statusFromId ? { label: getStatusLabel(h.statusFromId), color: getStatusColor(h.statusFromId) } : null;
              const toStatus = h.statusToId ? { label: getStatusLabel(h.statusToId), color: getStatusColor(h.statusToId) } : null;
              const fromUser = h.ballFromId ? getUserName(h.ballFromId) : null;
              const toUser = h.ballToId ? getUserName(h.ballToId) : null;
              const actor = h.userId ? getUserName(h.userId) : 'Sistema';

              return (
                <li key={h.id} className="flex gap-3 text-sm">
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
                    <p className="mt-0.5 text-[10px] text-gray-400 dark:text-slate-500">
                      {new Date(h.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
