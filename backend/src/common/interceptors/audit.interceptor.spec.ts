import { buildAuditEntry, resolveActor, resolveEntity } from './audit.interceptor';

describe('AuditInterceptor — montagem da linha de auditoria', () => {
  describe('resolveActor', () => {
    it('equipe Relm vira USER e mantém a FK userId', () => {
      const actor = resolveActor({ userId: 'u1', email: 'admin@relm.com', role: 'ADMIN_RELM' });
      expect(actor).toMatchObject({ actorType: 'USER', actorId: 'u1', userId: 'u1' });
    });

    it('lojista vira STORE_USER e NÃO preenche a FK userId', () => {
      const actor = resolveActor({ storeUserId: 's1', email: 'loja@x.com', storeId: 'st1' });
      expect(actor).toMatchObject({ actorType: 'STORE_USER', actorId: 's1', storeId: 'st1' });
      // users.id é FK — gravar o id de um store_user ali estouraria a constraint.
      expect(actor.userId).toBeUndefined();
    });

    it('cliente vira CUSTOMER', () => {
      expect(resolveActor({ customerId: 'c1' }).actorType).toBe('CUSTOMER');
    });

    it('requisição sem token vira ANONIMO', () => {
      expect(resolveActor(undefined).actorType).toBe('ANONIMO');
    });
  });

  describe('resolveEntity', () => {
    it('descarta o prefixo de versão', () => {
      expect(resolveEntity('/v1/points/admin/rules/:id')).toBe('points');
    });

    it('usa o primeiro segmento quando não há versão', () => {
      expect(resolveEntity('/audit-logs')).toBe('audit-logs');
    });

    it('raiz não quebra', () => {
      expect(resolveEntity('/')).toBe('root');
    });
  });

  describe('buildAuditEntry', () => {
    const req = {
      method: 'PATCH',
      route: { path: '/v1/points/admin/rules/:id' },
      params: { id: 'rule-1' },
      ip: '10.0.0.1',
      user: { userId: 'u1', email: 'admin@relm.com' },
      body: { password: 'segredo', cpf: '000.000.000-00' },
    };

    it('registra rota-padrão, ator e status', () => {
      expect(buildAuditEntry(req, 200)).toMatchObject({
        userId: 'u1',
        actorType: 'USER',
        action: 'PATCH /v1/points/admin/rules/:id',
        entity: 'points',
        entityId: 'rule-1',
        ipAddress: '10.0.0.1',
        metadata: { method: 'PATCH', status: 200, actorEmail: 'admin@relm.com' },
      });
    });

    it('NUNCA carrega o corpo da requisição', () => {
      const serialized = JSON.stringify(buildAuditEntry(req, 200));
      expect(serialized).not.toContain('segredo');
      expect(serialized).not.toContain('000.000.000-00');
    });

    it('usa o padrão da rota, não a URL concreta com id', () => {
      // Sem isso cada id viraria um `action` distinto e o filtro da tela de
      // logs (contains) deixaria de agrupar qualquer coisa.
      const entry = buildAuditEntry({ ...req, url: '/v1/points/admin/rules/rule-1' }, 200);
      expect(entry.action).not.toContain('rule-1');
    });

    it('propaga o status de erro (tentativa barrada)', () => {
      expect(buildAuditEntry(req, 403).metadata.status).toBe(403);
    });
  });
});
