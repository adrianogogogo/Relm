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
      <div className="bg-white dark:bg-[#183757] border border-gray-200 dark:border-[#2196F3]/30 rounded-2xl p-6 max-w-md w-full shadow-[8px_8px_20px_rgba(10,25,41,0.5)]">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-[#0A1929] dark:text-[#2196F3]">
            <MdCardGiftcard size={24} className="text-[#2196F3]" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Atribuir Pontos Bônus</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-300">
              Cliente: <strong className="text-gray-900 dark:text-white">{customerName || 'Cliente'}</strong>
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs rounded-xl bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Quantidade de Pontos *
            </label>
            <input
              type="number"
              min="1"
              required
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Ex: 500"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-[#2196F3] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Motivo / Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Bônus por participação em evento VIP"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#2196F3] outline-hidden"
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
