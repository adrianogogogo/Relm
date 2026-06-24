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

const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} ${timeStr}`;
};

const typeBadge = (type) => {
  let colors = 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  if (type === 'reparo') colors = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/60';
  if (type === 'troca') colors = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/60';
  if (type === 'reembolso') colors = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/60';
  if (type === 'cortesia') colors = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/60';
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors} flex items-center gap-1`}>
      {typeLabel(type)}
    </span>
  );
};

const statusBadge = (s, isAwaitingDirector) => {
  if (s.status === 'aprovado') {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-success text-white dark:bg-emerald-600 dark:text-white flex items-center gap-1 shrink-0">
        ✔️ Aprovado
      </span>
    );
  }
  if (s.status === 'reprovado') {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-error text-white dark:bg-rose-600 dark:text-white flex items-center gap-1 shrink-0">
        ❌ Reprovado
      </span>
    );
  }
  // pendente
  const label = isAwaitingDirector ? 'Aguardando diretor' : 'Aguardando gestor';
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/30 flex items-center gap-1 shrink-0">
      ⏳ {label}
    </span>
  );
};

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
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [claimRejectReason, setClaimRejectReason] = useState('');

  const refresh = () => onChanged?.();

  // Gate da garantia: aprovar/reprovar só em "Em Análise" (statusId 4).
  const atAnalise = warranty.statusId === 4;

  const approveClaimMut = useMutation({
    mutationFn: () => warrantyAPI.approveClaim(warranty.id),
    onSuccess: () => { alert('✅ Garantia aprovada — comprovante enviado ao cliente.'); refresh(); },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

  const rejectClaimMut = useMutation({
    mutationFn: () => warrantyAPI.rejectClaim(warranty.id, claimRejectReason.trim()),
    onSuccess: () => { setOpenRejectDialog(false); setClaimRejectReason(''); alert('Garantia reprovada — processo finalizado.'); refresh(); },
    onError: (e) => alert(`❌ ${e.response?.data?.message || e.message}`),
  });

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

      {/* Gate da garantia em "Em Análise": aprovar / reprovar (admin/gerente) */}
      {isAdminOrManager && atAnalise && (
        <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-2">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Esta garantia está <strong>em análise</strong>. Aprove para dar andamento ou reprove para finalizar.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => approveClaimMut.mutate()}
              disabled={approveClaimMut.isPending}
              className="px-4 py-2 bg-success hover:bg-success-600 text-white rounded-lg text-sm font-semibold flex-1 disabled:opacity-50"
            >
              {approveClaimMut.isPending ? 'Aprovando…' : 'Aprovar garantia'}
            </button>
            <button
              onClick={() => setOpenRejectDialog(true)}
              disabled={rejectClaimMut.isPending}
              className="px-4 py-2 border border-error text-error rounded-lg text-sm font-semibold flex-1 hover:bg-error hover:text-white disabled:opacity-50"
            >
              Reprovar garantia
            </button>
          </div>
        </div>
      )}

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

      {/* ── Dialog: Reprovar garantia ── */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} title="Reprovar garantia">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            A garantia será finalizada (Fechado) e o cliente receberá um e-mail com o motivo.
          </p>
          <textarea
            className="input" rows={3} placeholder="Motivo da reprovação *"
            value={claimRejectReason} onChange={(e) => setClaimRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => setOpenRejectDialog(false)}>Cancelar</button>
            <button
              onClick={() => rejectClaimMut.mutate()}
              disabled={rejectClaimMut.isPending || !claimRejectReason.trim()}
              className="px-4 py-2 bg-error hover:bg-error-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {rejectClaimMut.isPending ? 'Reprovando…' : 'Confirmar reprovação'}
            </button>
          </div>
        </div>
      </Dialog>

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
          return (
            <div key={s.id} className="border border-gray-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-950/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {typeBadge(s.solutionType)}
                  {s.requiresDirector && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      🔒 Requer Diretor
                    </span>
                  )}
                </div>
                {statusBadge(s, isAwaitingDirector)}
              </div>

              <p className="text-sm text-gray-700 dark:text-slate-300 font-medium whitespace-pre-wrap">{s.description}</p>

              {s.hasCost && s.costValue != null && (
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-900">
                    💰 Custo: {fmtBRL(s.costValue)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-slate-800/80 pt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Proposta por: <span className="font-semibold text-gray-700 dark:text-slate-300">{s.proposedBy || 'Desconhecido'}</span>
                  {s.createdAt && ` • ${formatDateTime(s.createdAt)}`}
                </p>

                {s.status === 'aprovado' && (
                  <div className="space-y-0.5">
                    {s.approvedBy && (
                      <p className="text-xs text-success flex items-center gap-1">
                        ✔️ Aprovado (nível 1) por: <span className="font-semibold">{s.approvedBy}</span>
                        {s.approvedAt && ` em ${formatDateTime(s.approvedAt)}`}
                      </p>
                    )}
                    {s.directorApprovedBy && (
                      <p className="text-xs text-success flex items-center gap-1">
                        ✔️ Autorizado (diretor) por: <span className="font-semibold">{s.directorApprovedBy}</span>
                        {s.directorApprovedAt && ` em ${formatDateTime(s.directorApprovedAt)}`}
                      </p>
                    )}
                  </div>
                )}

                {s.status === 'reprovado' && (
                  <div className="space-y-0.5 text-xs text-error">
                    {s.rejectionReason && (
                      <p className="flex items-center gap-1">
                        ❌ Reprovado por gestor. Motivo: <span className="font-semibold">{s.rejectionReason}</span>
                      </p>
                    )}
                    {s.directorRejectionReason && (
                      <p className="flex items-center gap-1">
                        ❌ Reprovado por diretor. Motivo: <span className="font-semibold">{s.directorRejectionReason}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {rejectingId === s.id ? (
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-2">
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
                <div className="flex justify-end gap-2 pt-1">
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
    </div>
  );
}
