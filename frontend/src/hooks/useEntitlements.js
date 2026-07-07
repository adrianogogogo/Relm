import { useQuery } from '@tanstack/react-query';
import { benefitsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Direitos por tier vindos da matriz do backend (fonte única do enforcement).
// current = os do usuário logado; plus/care disponíveis pra copy de upgrade.
export function useEntitlements() {
  const { user } = useAuthStore();
  const { data } = useQuery({
    queryKey: ['tiers-entitlements'],
    queryFn: () => benefitsAPI.getTiersEntitlements(),
    staleTime: Infinity,
  });
  const tier = user?.currentTier || 'CARE';
  return {
    tier,
    current: data?.[tier] ?? null,
    plus: data?.PLUS ?? null,
    care: data?.CARE ?? null,
  };
}
