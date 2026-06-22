import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Guard de "feed" segmentado por perfil.
 *
 * Aceita os três tipos de token emitidos pelo login unificado e resolve o
 * `audience` (perfil-alvo) do usuário logado, expondo-o em `req.feedAudience`:
 *
 *  - Customer  → token com `type: 'CUSTOMER'` (assinado com CUSTOMER_JWT_SECRET) → CLIENTE
 *  - StoreUser → token com `type: 'STORE'`    (assinado com JWT_SECRET)          → LOJA
 *  - User      → token sem `type`, com `role`  (assinado com JWT_SECRET)          → role
 *
 * Como Customer usa um segredo distinto, validamos o token contra JWT_SECRET e,
 * se falhar, contra CUSTOMER_JWT_SECRET. Espelha a lógica do
 * NotificationJwtStrategy, sem afetar nenhum RBAC existente.
 */
@Injectable()
export class FeedAudienceGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers?.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }
    const token = auth.slice('Bearer '.length).trim();

    const payload = this.verify(token);
    if (!payload) throw new UnauthorizedException();

    const audience = this.resolveAudience(payload);
    if (!audience) throw new UnauthorizedException();

    req.feedAudience = audience;
    req.feedUser = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type,
    };
    return true;
  }

  private verify(token: string): any | null {
    const defaultSecret = this.config.get<string>('JWT_SECRET');
    const customerSecret = this.config.get<string>('CUSTOMER_JWT_SECRET');

    // 1) Tokens de User (equipe/distribuidor) e StoreUser usam JWT_SECRET.
    try {
      return jwt.verify(token, defaultSecret as string);
    } catch {
      // 2) Token de Customer usa segredo dedicado.
    }
    if (customerSecret) {
      try {
        return jwt.verify(token, customerSecret);
      } catch {
        return null;
      }
    }
    return null;
  }

  private resolveAudience(payload: any): 'CLIENTE' | 'LOJA' | 'DISTRIBUIDOR' | null {
    if (payload.type === 'CUSTOMER') return 'CLIENTE';
    if (payload.type === 'STORE') return 'LOJA';
    // Token de User (sem type): resolve pelo role.
    if (!payload.type && payload.role === 'DISTRIBUIDOR') return 'DISTRIBUIDOR';
    // Equipe Relm (ADMIN/GERENTE/SUPORTE) pode consumir o feed para debug;
    // tratamos como DISTRIBUIDOR-equivalente apenas para visualização? Não.
    // Para não vazar segmentação, equipe Relm vê tudo via /admin; aqui
    // resolvemos os papéis de portal. Demais Users sem audience de portal:
    if (!payload.type && payload.role) {
      // ADMIN_RELM / GERENTE_RELM / SUPORTE_RELM / LOJA não são audiences de
      // portal de feed; retornamos null para evitar uso indevido.
      return null;
    }
    return null;
  }
}
