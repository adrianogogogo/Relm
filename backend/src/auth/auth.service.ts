import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';
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

      // Espelha o payload do login: sem storeId/userType, tokens de loja
      // (role LOJA) renovados perdem o vínculo e passam a levar 401.
      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
        userType: user.role,
      };
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

  // Auto-serviço do usuário da equipe Relm / distribuidor (tabela User):
  // edita apenas o próprio nome/e-mail. role/storeId/active nunca mudam aqui.
  async updateOwnProfile(userId: string, dto: UpdateOwnProfileDto) {
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('E-mail já está em uso');
      }
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        storeId: true,
      },
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
        const payload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          storeId: user.storeId,
          userType: user.role,
        };
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
            storeId: user.storeId,
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
              legalName: storeUser.store.legalName,
              cnpj: storeUser.store.cnpj,
              email: storeUser.store.email,
              phone: storeUser.store.phone,
              address: storeUser.store.address,
              city: storeUser.store.city,
              state: storeUser.store.state,
              zipCode: storeUser.store.zipCode,
              logoUrl: storeUser.store.logoUrl,
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
    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) return { message: genericMessage };

    // 1) Verifica na tabela User (Admin, Gerente, Suporte, Loja, Distribuidor, Instrutor)
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (user && user.active) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: tokenHash, resetPasswordExpires: expires },
      });

      const resetUrl = `${appUrl}/redefinir-senha?token=${token}`;

      await this.emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        portalName: 'Relm Care+',
      });

      return { message: genericMessage };
    }

    // 2) Verifica na tabela Customer
    const customer = await this.prisma.customer.findUnique({ where: { email: cleanEmail } });
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
      where: { email: cleanEmail },
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
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('A senha deve ter no mínimo 6 caracteres.');
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 1) Procura na tabela User
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: tokenHash },
    });
    if (user) {
      if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
        throw new BadRequestException('Token inválido ou expirado.');
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, resetPasswordToken: null, resetPasswordExpires: null },
      });
      return { message: 'Senha redefinida com sucesso.' };
    }

    // 2) Procura na tabela Customer
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

    // 3) Procura na tabela StoreUser
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
