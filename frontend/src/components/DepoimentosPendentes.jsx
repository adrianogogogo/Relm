import { Button } from './ui';

/**
 * Depoimento gerado é uma pessoa que não existe dizendo o que não disse. A IA
 * escreve o rascunho, mas publicar é decisão de quem clica — então a tarja fica
 * aqui, no admin, e some quando a citação é confirmada ou reescrita. Nada disso
 * chega ao HTML público nem ao e-mail.
 *
 * Mora em components/ e não numa das páginas porque as duas telas geram `prova`:
 * uma cópia por página é a garantia de que uma delas fica para trás.
 */
export default function DepoimentosPendentes({ pagina, onChange }) {
  const pendentes = pagina.blocos
    .map((bloco, i) => ({ bloco, i }))
    .filter(({ bloco }) => bloco.tipo === 'prova' && bloco.inventado);

  if (pendentes.length === 0) return null;

  const atualizar = (indice, campos) => {
    const blocos = pagina.blocos.map((bloco, i) => (i === indice ? { ...bloco, ...campos } : bloco));
    onChange({ ...pagina, blocos });
  };

  const campo =
    'rounded-lg border border-amber-300 bg-white px-2 py-1 text-sm text-slate-900 font-medium dark:border-amber-800 dark:bg-slate-900 dark:text-white';

  return (
    <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 space-y-3 dark:border-amber-700 dark:bg-amber-950/40">
      <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
        {pendentes.length === 1 ? 'Depoimento gerado por IA' : 'Depoimentos gerados por IA'} — não é
        cliente real. Confirme ou substitua antes de publicar.
      </p>
      {pendentes.map(({ bloco, i }) => (
        <div key={i} className="space-y-2">
          <textarea
            value={bloco.citacao}
            onChange={(e) => atualizar(i, { citacao: e.target.value, inventado: false })}
            rows={2}
            className={`w-full p-2 ${campo}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={bloco.autor}
              onChange={(e) => atualizar(i, { autor: e.target.value, inventado: false })}
              placeholder="Nome"
              className={`flex-1 min-w-[120px] ${campo}`}
            />
            <input
              value={bloco.papel}
              onChange={(e) => atualizar(i, { papel: e.target.value, inventado: false })}
              placeholder="Quem é"
              className={`flex-1 min-w-[120px] ${campo}`}
            />
            <Button variant="secondary" onClick={() => atualizar(i, { inventado: false })}>
              É real, confirmo
            </Button>
            <Button
              variant="secondary"
              onClick={() => onChange({ ...pagina, blocos: pagina.blocos.filter((_, j) => j !== i) })}
            >
              Remover
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
