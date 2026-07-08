import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MdEmojiEvents, MdPerson, MdToggleOn, MdToggleOff } from 'react-icons/md';
import { gamificationAPI } from '../services/api';
import { Card, PageHeader } from '../components/ui';

export default function CustomerRankingPage() {
  const queryClient = useQueryClient();

  const { data: leaderboard = [], isLoading: loadingBoard } = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: gamificationAPI.getLeaderboard,
  });

  // Opt-in local state (carregado do perfil via leaderboard.isMe)
  const meEntry = leaderboard.find((e) => e.isMe);
  const [optIn, setOptIn] = useState(null); // null = ainda não foi alterado
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  const effectiveOptIn = optIn !== null ? optIn : Boolean(meEntry);

  const mutation = useMutation({
    mutationFn: ({ optIn, nickname }) => gamificationAPI.updateOptIn(optIn, nickname || undefined),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      queryClient.invalidateQueries({ queryKey: ['gamification-leaderboard'] });
    },
  });

  function handleSave(e) {
    e.preventDefault();
    mutation.mutate({ optIn: effectiveOptIn, nickname });
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="py-8 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Ranking da Comunidade"
          subtitle="Top 20 membros com mais pontos acumulados no ano"
        />

        {/* LGPD notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          🔒 Seu nome só aparece no ranking se você optar por participar. Você pode sair a qualquer momento.
        </div>

        {/* Leaderboard */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MdEmojiEvents size={22} className="text-yellow-500" />
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">
              Placar Anual {new Date().getFullYear()}
            </h2>
          </div>

          {loadingBoard ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">Carregando ranking...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              Nenhum membro optou por participar do ranking ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 py-3 ${
                    entry.isMe ? 'bg-yellow-50 dark:bg-yellow-900/10 -mx-4 px-4 rounded' : ''
                  }`}
                >
                  {/* Rank */}
                  <span className="w-8 text-center text-lg font-bold text-gray-400 dark:text-slate-500 shrink-0">
                    {medals[entry.rank - 1] ?? entry.rank}
                  </span>

                  {/* Nickname */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-200 truncate">
                      {entry.nickname}
                      {entry.isMe && (
                        <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 font-normal">
                          (você)
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Points */}
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">
                    {entry.points.toLocaleString('pt-BR')} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Opt-in form */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MdPerson size={20} className="text-teal-500" />
            <h2 className="font-title text-lg font-bold text-gray-900 dark:text-slate-100">
              Sua participação no ranking
            </h2>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Toggle opt-in */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Aparecer no ranking público
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  Somente seu apelido e pontuação serão exibidos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOptIn(!effectiveOptIn)}
                className="text-3xl text-teal-500 focus:outline-none"
                aria-label={effectiveOptIn ? 'Desativar participação' : 'Ativar participação'}
              >
                {effectiveOptIn ? <MdToggleOn /> : <MdToggleOff className="text-gray-400" />}
              </button>
            </div>

            {/* Nickname */}
            {effectiveOptIn && (
              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
                >
                  Apelido no ranking <span className="text-xs text-gray-400">(máx. 30 caracteres)</span>
                </label>
                <input
                  id="nickname"
                  type="text"
                  maxLength={30}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  className="input input-bordered w-full text-sm"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar preferências'}
              </button>
              {saved && (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Preferências salvas!
                </span>
              )}
              {mutation.isError && (
                <span className="text-sm text-red-500">Erro ao salvar. Tente novamente.</span>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
