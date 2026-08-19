import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

describe('AuthService (Unified Password Recovery)', () => {
  let service: AuthService;
  let prisma: any;
  let emailService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      storeUser: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    emailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'APP_URL') return 'http://localhost:5173';
              return null;
            }),
          },
        },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('unifiedForgotPassword', () => {
    it('gera token e envia email de recuperacao para usuario da tabela User (Admin / Gerente / Instrutor)', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        name: 'Administrador Relm',
        email: 'admin@relm.com.br',
        active: true,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.unifiedForgotPassword('admin@relm.com.br');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'admin@relm.com.br' } });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: expect.objectContaining({
            resetPasswordToken: expect.any(String),
            resetPasswordExpires: expect.any(Date),
          }),
        }),
      );
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@relm.com.br',
          name: 'Administrador Relm',
          portalName: 'Relm Care+',
          resetUrl: expect.stringContaining('http://localhost:5173/redefinir-senha?token='),
        }),
      );
      expect(result.message).toContain('Se o e-mail estiver cadastrado');
    });

    it('retorna mensagem generica mesmo se o email nao existir (evita enumeracao)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.storeUser.findUnique.mockResolvedValue(null);

      const result = await service.unifiedForgotPassword('inexistente@email.com');

      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
      expect(result.message).toContain('Se o e-mail estiver cadastrado');
    });
  });

  describe('unifiedResetPassword', () => {
    it('redefine a senha com sucesso para usuario User', async () => {
      const rawToken = 'valid-token-123';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      prisma.user.findFirst.mockResolvedValue({
        id: 'u-1',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() + 1800 * 1000), // expira em 30 min
      });
      prisma.user.update.mockResolvedValue({});

      const result = await service.unifiedResetPassword(rawToken, 'NovaSenha@2026');

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { resetPasswordToken: tokenHash },
      });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u-1' },
          data: expect.objectContaining({
            passwordHash: expect.any(String),
            resetPasswordToken: null,
            resetPasswordExpires: null,
          }),
        }),
      );
      expect(result.message).toContain('Senha redefinida com sucesso');
    });

    it('rejeita senha com menos de 6 caracteres', async () => {
      await expect(service.unifiedResetPassword('any-token', '12345')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita token expirado', async () => {
      const rawToken = 'expired-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      prisma.user.findFirst.mockResolvedValue({
        id: 'u-1',
        resetPasswordToken: tokenHash,
        resetPasswordExpires: new Date(Date.now() - 1000), // expirou
      });

      await expect(service.unifiedResetPassword(rawToken, 'NovaSenhaValida')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
