import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export type AuditActor = {
  actorType: string;
  actorId?: string;
  userId?: string;
  actorEmail?: string;
  storeId?: string;
};

/**
 * Quem agiu. Cada estratégia JWT devolve um `req.user` com forma própria —
 * é o campo de id que diz de qual tabela o ator veio.
 *
 * Ressalva conhecida: a `store-jwt` também aceita um `User` com role LOJA e
 * devolve o id dele em `storeUserId`. Nesse caso o actorId aponta para
 * `users.id`, não `store_users.id`. Distinguir exigiria mudar o payload do
 * token; o e-mail no metadata resolve a identificação humana, que é o que a
 * auditoria precisa.
 */
export function resolveActor(user: any): AuditActor {
  if (!user) return { actorType: 'ANONIMO' };
  if (user.userId) {
    return { actorType: 'USER', actorId: user.userId, userId: user.userId, actorEmail: user.email };
  }
  if (user.storeUserId) {
    return {
      actorType: 'STORE_USER',
      actorId: user.storeUserId,
      actorEmail: user.email,
      storeId: user.storeId,
    };
  }
  if (user.customerId) {
    return { actorType: 'CUSTOMER', actorId: user.customerId, actorEmail: user.email };
  }
  return { actorType: 'ANONIMO' };
}

/**
 * Entidade = primeiro segmento significativo da rota. `/v1/points/admin/rules`
 * vira `points`, `/audit-logs` vira `audit-logs`. O prefixo de versão não
 * identifica nada, então sai.
 */
export function resolveEntity(routePath: string): string {
  const segments = routePath.split('/').filter(Boolean);
  const first = segments[0] === 'v1' ? segments[1] : segments[0];
  return first || 'root';
}

/**
 * Monta a linha de auditoria a partir da requisição. **Não lê o corpo**: senha,
 * token e PII bruta passam por aqui e o log é lido por qualquer ADMIN_RELM.
 */
export function buildAuditEntry(req: any, status: number) {
  // `req.route.path` é o padrão da rota (`/v1/points/admin/rules/:id`), não a
  // URL concreta — id no `action` explodiria a cardinalidade e quebraria o
  // filtro por texto da tela de logs.
  const routePath: string = req.route?.path || req.path || req.url || '/';
  const actor = resolveActor(req.user);

  return {
    userId: actor.userId,
    actorType: actor.actorType,
    actorId: actor.actorId,
    action: `${req.method} ${routePath}`,
    entity: resolveEntity(routePath),
    entityId: req.params?.id,
    metadata: {
      method: req.method,
      route: routePath,
      status,
      ...(actor.actorEmail ? { actorEmail: actor.actorEmail } : {}),
      ...(actor.storeId ? { storeId: actor.storeId } : {}),
    },
    ipAddress: req.ip,
  };
}

/**
 * Auditoria global de mutações. Antes disto o `AuditLog` era chamado à mão em 7
 * módulos e todo módulo novo nascia sem auditoria nenhuma.
 *
 * As chamadas manuais continuam onde há contexto de negócio que a rota não
 * carrega (transição de status de garantia, motivo de cancelamento). O log
 * duplicado é o preço — um diz "quem chamou o quê", o outro diz "o que mudou".
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditLogs: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // GET não muda estado. Auditar leitura multiplicaria o volume da tabela por
    // uma ordem de grandeza sem responder nada que o log de acesso não responda.
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    if (!MUTATIONS.has(req.method)) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          const status = context.switchToHttp().getResponse()?.statusCode ?? 200;
          void this.auditLogs.log(buildAuditEntry(req, status));
        },
        // Tentativa barrada é o que mais interessa numa auditoria: 403 e 401
        // são o rastro de quem tentou o que não podia.
        error: (err) => {
          void this.auditLogs.log(buildAuditEntry(req, err?.status ?? 500));
        },
      }),
    );
  }
}
