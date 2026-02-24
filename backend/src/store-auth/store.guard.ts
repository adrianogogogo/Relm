import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StoreGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Acesso negado');
    }

    // Allow access for ADMIN users or STORE users
    if (user.role === 'ADMIN_RELM' || user.role === 'GERENTE_RELM' || user.type === 'STORE') {
      return true;
    }

    throw new ForbiddenException('Acesso negado para este tipo de usuário');
  }
}
