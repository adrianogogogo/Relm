import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Estratégia dedicada às notificações.
 *
 * O login unificado emite tokens (todos assinados com JWT_SECRET):
 *  - Equipe Relm / Loja-RBAC / Distribuidor (tabela User): payload SEM `type`.
 *  - Lojista (tabela StoreUser): payload com `type: 'STORE'`.
 *  - Cliente (tabela Customer): payload com `type: 'CUSTOMER'`.
 *
 * No v1 os recipientes de notificação são EQUIPE e LOJA. Portanto aceitamos
 * tokens de User e de StoreUser, e rejeitamos tokens de Customer. Resolvemos o
 * recipiente polimórfico (USER | STORE_USER) a partir do payload.
 *
 * Esta estratégia NÃO altera a `JwtStrategy` admin (que continua rejeitando
 * qualquer `type`), garantindo que nada do RBAC existente seja afetado.
 */
@Injectable()
export class NotificationJwtStrategy extends PassportStrategy(
  Strategy,
  'notification-jwt',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Cliente não recebe notificações no v1.
    if (payload.type === 'CUSTOMER') {
      throw new UnauthorizedException();
    }

    if (payload.type === 'STORE') {
      return {
        recipientType: 'STORE_USER',
        recipientId: payload.sub,
        storeId: payload.storeId,
        email: payload.email,
      };
    }

    // Token de User (equipe Relm / loja-RBAC / distribuidor): sem `type`.
    return {
      recipientType: 'USER',
      recipientId: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  }
}
