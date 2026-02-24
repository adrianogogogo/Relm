#!/bin/bash
set -e

echo "🔧 Script de correção para produção"
echo "===================================="

# 1. Verificar se guards e decorators existem
echo ""
echo "📁 Verificando estrutura de auth..."
if [ ! -f "src/auth/guards/jwt-auth.guard.ts" ]; then
    echo "❌ Guard JWT não encontrado!"
    echo "Criando estrutura de auth..."
    
    mkdir -p src/auth/guards
    mkdir -p src/auth/decorators
    mkdir -p src/auth/strategies
fi

# 2. Criar guards se não existirem
if [ ! -f "src/auth/guards/jwt-auth.guard.ts" ]; then
    cat > src/auth/guards/jwt-auth.guard.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
EOF
fi

if [ ! -f "src/auth/guards/roles.guard.ts" ]; then
    cat > src/auth/guards/roles.guard.ts << 'EOF'
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
EOF
fi

if [ ! -f "src/auth/decorators/roles.decorator.ts" ]; then
    cat > src/auth/decorators/roles.decorator.ts << 'EOF'
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
EOF
fi

echo "✅ Estrutura de auth criada"

# 3. Limpar e regenerar Prisma
echo ""
echo "🗑️  Limpando Prisma Client antigo..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo "📦 Gerando novo Prisma Client..."
npx prisma generate

echo ""
echo "✅ Correções aplicadas!"
echo ""
echo "📋 Próximos passos no servidor de produção:"
echo "   1. cd /var/www/relm-careplus-prod"
echo "   2. git pull origin feature/insurance-module"
echo "   3. cd backend"
echo "   4. bash fix-production.sh"
echo "   5. npm install (se necessário)"
echo "   6. pm2 restart relm-backend"
