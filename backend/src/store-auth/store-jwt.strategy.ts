import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Estratégia dedicada ao lojista logado (tabela StoreUser).
 *
 * O login unificado emite o token do lojista assinado com JWT_SECRET e com
 * `type: 'STORE'`. A `JwtStrategy` admin rejeita qualquer `type`, então esta
 * estratégia separada aceita apenas tokens de loja, sem afetar o RBAC admin.
 */
@Injectable()
export class StoreJwtStrategy extends PassportStrategy(Strategy, 'store-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Dois tipos de login de loja são válidos aqui:
    //  - StoreUser: token com type/userType 'STORE'
    //  - Usuário da tabela User vinculado a uma loja: role 'LOJA' + storeId
    // Ambos só operam sobre a PRÓPRIA loja (storeId do token), então é seguro.
    const isStoreUser =
      payload.type === 'STORE' || payload.userType === 'STORE';
    const isUserLoja = payload.role === 'LOJA' && !!payload.storeId;
    if ((!isStoreUser && !isUserLoja) || !payload.storeId) {
      throw new UnauthorizedException();
    }
    return {
      storeUserId: payload.sub,
      email: payload.email,
      type: 'STORE',
      storeId: payload.storeId,
      role: payload.role,
    };
  }
}
