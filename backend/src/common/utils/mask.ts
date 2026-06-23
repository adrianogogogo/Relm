// Utilitários de mascaramento de PII (LGPD) — antigravity.md §9.4.
// CPF é armazenado como 11 dígitos; telefone como dígitos (com ou sem DDD).

const ROLES_THAT_SEE_MASKED = ['LOJA', 'DISTRIBUIDOR'];

export function shouldMaskFor(role?: string | null): boolean {
  return !!role && ROLES_THAT_SEE_MASKED.includes(role);
}

// 12345678901 -> 123.***.**-01  (primeiros 3 e últimos 2 visíveis)
export function maskCpf(cpf?: string | null): string | null {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, '');
  if (d.length < 5) return '***';
  return `${d.slice(0, 3)}.***.**-${d.slice(-2)}`;
}

// 11912345678 -> (11) 9****-4321  (DDD + 1º dígito + últimos 4 visíveis)
export function maskPhone(phone?: string | null): string | null {
  // Preserva o valor nulo/vazio original (null -> null, undefined -> undefined).
  if (!phone) return phone as string | null;
  const d = phone.replace(/\D/g, '');
  if (d.length < 6) return '***';
  const ddd = d.slice(0, 2);
  const first = d.slice(2, 3);
  const last4 = d.slice(-4);
  return `(${ddd}) ${first}****-${last4}`;
}
