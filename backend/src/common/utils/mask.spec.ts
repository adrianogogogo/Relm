import { maskCpf, maskPhone, shouldMaskFor } from './mask';

describe('PII masking', () => {
  it('masks CPF to antigravity §9.4 format', () => {
    expect(maskCpf('12345678901')).toBe('123.***.**-01');
    expect(maskCpf('123.456.789-01')).toBe('123.***.**-01');
  });
  it('masks phone to antigravity §9.4 format', () => {
    expect(maskPhone('11912344321')).toBe('(11) 9****-4321');
  });
  it('returns null/empty untouched, never crashes on short input', () => {
    expect(maskCpf(null)).toBeNull();
    expect(maskCpf('')).toBeNull();
    expect(maskPhone(undefined)).toBeUndefined();
    expect(maskCpf('12')).toBe('***');
  });
  it('flags only LOJA and DISTRIBUIDOR for masking', () => {
    expect(shouldMaskFor('LOJA')).toBe(true);
    expect(shouldMaskFor('DISTRIBUIDOR')).toBe(true);
    expect(shouldMaskFor('ADMIN_RELM')).toBe(false);
    expect(shouldMaskFor(undefined)).toBe(false);
  });
});
