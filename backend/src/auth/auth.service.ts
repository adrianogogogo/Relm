import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  // ── Login original (mantido para retrocompatibilidade) ──────────────────────

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      const newPayload = { sub: user.id, email: user.email, role: user.role };
      return {
        access_token: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ── Troca de senha do usuário logado (equipe Relm / tabela User) ────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  // ── Login Unificado ─────────────────────────────────────────────────────────

  async unifiedLogin(email: string, password: string) {
    // 1) Tenta na tabela User (Equipe Relm + Distribuidores + Loja RBAC)
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.active) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (valid) {
        const payload = { sub: user.id, email: user.email, role: user.role, userType: user.role };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
        });

        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshToken },
        });

        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            userType: user.role as string,
          },
        };
      }
    }

    // 2) Tenta na tabela Customer (Clientes)
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (customer && customer.active && customer.passwordHash) {
      const valid = await bcrypt.compare(password, customer.passwordHash);
      if (valid) {
        const payload = { sub: customer.id, email: customer.email, type: 'CUSTOMER', userType: 'CUSTOMER' };
        const accessToken = this.jwtService.sign(payload, {
          secret: this.config.get('CUSTOMER_JWT_SECRET'),
        });
        const refreshToken = this.jwtService.sign(payload, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });

        await this.prisma.customer.update({
          where: { id: customer.id },
          data: { refreshToken },
        });

        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: customer.id,
            name: customer.fullName,
            email: customer.email,
            userType: 'CUSTOMER',
            currentTier: customer.currentTier,
          },
        };
      }
    }

    // 3) Tenta na tabela StoreUser (Lojistas)
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { email },
      include: { store: true },
    });
    if (storeUser && storeUser.isActive && storeUser.store.active) {
      const valid = await bcrypt.compare(password, storeUser.passwordHash);
      if (valid) {
        const payload = {
          sub: storeUser.id,
          email: storeUser.email,
          type: 'STORE',
          userType: 'STORE',
          storeId: storeUser.storeId,
          role: storeUser.role,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        });

        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          user: {
            id: storeUser.id,
            name: storeUser.name,
            email: storeUser.email,
            role: storeUser.role,
            userType: 'STORE',
            storeId: storeUser.storeId,
            store: {
              id: storeUser.store.id,
              tradeName: storeUser.store.tradeName,
              city: storeUser.store.city,
              state: storeUser.store.state,
            },
          },
        };
      }
    }

    // Nenhuma tabela deu match
    throw new UnauthorizedException('Credenciais inválidas');
  }

  // ── Forgot Password Unificado ───────────────────────────────────────────────

  async unifiedForgotPassword(email: string) {
    const appUrl = this.config.get('APP_URL') || 'http://localhost:5173';
    const genericMessage = 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.';

    // 1) Verifica na tabela User (equipe Relm não tinha forgot-password antes, agora tem)
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.active) {
      // User não tinha resetPasswordToken no schema, então apenas retornamos a mensagem genérica
      // TODO: Adicionar campo resetPasswordToken no model User se necessário
      return { message: genericMessage };
    }

    // 2) Verifica na tabela Customer
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    if (customer && customer.active && customer.passwordHash) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires },
      });

      const resetUrl = `${appUrl}/redefinir-senha?token=${token}`;

      await this.emailService.sendPasswordResetEmail({
        to: customer.email,
        name: customer.fullName,
        resetUrl,
        portalName: 'Cliente',
      });

      return { message: genericMessage };
    }

    // 3) Verifica na tabela StoreUser
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { email },
      include: { store: true },
    });
    if (storeUser && storeUser.isActive && storeUser.store.active) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.storeUser.update({
        where: { id: storeUser.id },
        data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires },
      });

      const resetUrl = `${appUrl}/redefinir-senha?token=${token}`;

      await this.emailService.sendPasswordResetEmail({
        to: storeUser.email,
        name: storeUser.name,
        resetUrl,
        portalName: 'Loja',
      });

      return { message: genericMessage };
    }

    // Não encontrou — retorna mensagem genérica (não revela se email existe)
    return { message: genericMessage };
  }

  // ── Reset Password Unificado ────────────────────────────────────────────────

  async unifiedResetPassword(token: string, newPassword: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 1) Procura na tabela Customer
    const customer = await this.prisma.customer.findUnique({
      where: { resetPasswordToken: tokenHash },
    });
    if (customer) {
      if (!customer.resetPasswordExpires || customer.resetPasswordExpires < new Date()) {
        throw new BadRequestException('Token inválido ou expirado.');
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null },
      });
      return { message: 'Senha redefinida com sucesso.' };
    }

    // 2) Procura na tabela StoreUser
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { resetPasswordToken: tokenHash },
    });
    if (storeUser) {
      if (!storeUser.resetPasswordExpires || storeUser.resetPasswordExpires < new Date()) {
        throw new BadRequestException('Token inválido ou expirado.');
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.prisma.storeUser.update({
        where: { id: storeUser.id },
        data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null },
      });
      return { message: 'Senha redefinida com sucesso.' };
    }

    throw new BadRequestException('Token inválido ou expirado.');
  }
}
