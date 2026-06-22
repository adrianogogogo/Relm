import { useAuthStore } from '../store/authStore';
import { Card, PageHeader } from '../components/ui';

/**
 * Perfil do lojista logado (somente leitura no v1) — inclui dados da loja
 * quando disponíveis no usuário do authStore.
 * A troca de senha fica no menu do avatar (TopBarChrome → ChangePasswordModal).
 */
export default function StoreProfilePage() {
  const { user } = useAuthStore();
  const store = user?.store;

  const fields = [
    { label: 'Nome', value: user?.name },
    { label: 'E-mail', value: user?.email },
    { label: 'Cargo', value: user?.role || 'Loja' },
    { label: 'Loja', value: store?.tradeName },
    { label: 'Cidade', value: store?.city },
    { label: 'Estado', value: store?.state },
  ];

  return (
    <div className="py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Meu Perfil" subtitle="Seus dados de acesso na Relm Care+" />

        <Card>
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800/60">
            <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary-400/15 flex items-center justify-center text-2xl font-bold text-primary dark:text-primary-400 shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'L'}
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-800 dark:text-slate-100 truncate">{user?.name}</p>
              <p className="text-gray-500 dark:text-slate-400 text-sm truncate">
                {store?.tradeName || user?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-1">{f.label}</p>
                <p className="text-gray-800 dark:text-slate-200">{f.value || '—'}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 dark:text-slate-500 mt-6 pt-4 border-t border-gray-100 dark:border-slate-800/60">
            Para alterar sua senha, use o menu do avatar no topo da tela → “Alterar Senha”.
          </p>
        </Card>
      </div>
    </div>
  );
}
