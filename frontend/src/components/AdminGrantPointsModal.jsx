import { useState } from 'react';
import { MdCardGiftcard, MdClose } from 'react-icons/md';
import { pointsAPI } from '../services/api';

export default function AdminGrantPointsModal({ customerId, customerName, onClose, onSuccess }) {
  const [points, setPoints] = useState(100);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!points || Number(points) <= 0) {
      setError('Informe uma quantidade válida de pontos.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await pointsAPI.grantByAdmin({
        customerId,
        points: Number(points),
        description: description || undefined,
      });
      setSuccessMsg(`Sucesso! ${points} pontos creditados para ${customerName || 'o cliente'}.`);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Erro ao atribuir pontos:', err);
      setError(err?.response?.data?.message || 'Erro ao conceder pontos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <MdCardGiftcard size={24} className="text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-extrabold text-lg text-[#0A1929] dark:text-white">Atribuir Pontos Bônus</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Cliente: <strong className="text-[#0A1929] dark:text-white font-extrabold">{customerName || 'Cliente'}</strong>
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Quantidade de Pontos *
            </label>
            <input
              type="number"
              min="1"
              required
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Ex: 500"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-extrabold focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Motivo / Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Bônus por participação em evento VIP"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="px-5 py-2 rounded-xl bg-[#2196F3] hover:bg-[#1e88e5] text-white text-sm font-bold shadow-[2px_2px_6px_rgba(33,150,243,0.4)] disabled:opacity-50 transition-all"
            >
              {loading ? 'Creditando...' : 'Confirmar Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
