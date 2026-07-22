import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class StorePaymentsGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth: string | undefined = req.headers?.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autenticação não fornecido');
    }
    const token = auth.slice('Bearer '.length).trim();
    const defaultSecret = this.config.get<string>('JWT_SECRET');

    let payload: any;
    try {
      payload = jwt.verify(token, defaultSecret as string);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (!payload) {
      throw new UnauthorizedException();
    }

    // 1. Token legado de StoreUser (type === 'STORE')
    if (payload.type === 'STORE' || payload.storeId) {
      req.user = {
        storeUserId: payload.storeUserId || payload.sub,
        storeId: payload.storeId,
        type: 'STORE_USER',
      };
      return true;
    }

    // 2. Token de User unificado (role === 'LOJA' ou Admins)
    const allowedRoles = ['LOJA', 'ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM'];
    if (payload.role && allowedRoles.includes(payload.role)) {
      const userId = payload.sub || payload.userId;
      let storeId = payload.storeId;

      if (!storeId && userId) {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { storeId: true },
        });
        storeId = dbUser?.storeId || null;
      }

      req.user = {
        storeUserId: userId,
        storeId: storeId,
        role: payload.role,
        type: 'USER',
      };
      return true;
    }

    throw new UnauthorizedException(
      'Perfil não autorizado para pagamentos da loja',
    );
  }
}
