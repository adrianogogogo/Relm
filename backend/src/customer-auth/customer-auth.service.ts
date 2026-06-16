import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: CustomerRegisterDto) {
    const invoiceNormalized = dto.invoiceNumber.trim().toUpperCase();

    // Verifica se a nota fiscal existe em algum produto ou garantia
    const [productMatch, warrantyMatch] = await Promise.all([
      this.prisma.product.findFirst({
        where: {
          purchaseInvoiceNumber: {
            equals: invoiceNormalized,
            mode: 'insensitive',
          },
        },
      }),
      this.prisma.warrantyClaim.findFirst({
        where: {
          invoiceNumber: {
            equals: invoiceNormalized,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    if (!productMatch && !warrantyMatch) {
      throw new BadRequestException(
        'Nota fiscal não encontrada. Verifique o número e tente novamente.',
      );
    }

    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.passwordHash) {
        throw new ConflictException(
          'Este e-mail já possui uma conta. Faça login.',
        );
      }
      // Cliente existe (cadastrado via formulário de garantia) mas sem senha — ativa a conta
      const hash = await bcrypt.hash(dto.password, 10);
      const customer = await this.prisma.customer.update({
        where: { id: existing.id },
        data: {
          passwordHash: hash,
          fullName: dto.fullName || existing.fullName,
          phone: dto.phone || existing.phone,
        },
      });
      return this.generateTokens(customer);
    }

    // Novo cliente
    const hash = await bcrypt.hash(dto.password, 10);
    const customer = await this.prisma.customer.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        fullName: dto.fullName,
        phone: dto.phone,
      },
    });

    return this.generateTokens(customer);
  }

  async login(dto: CustomerLoginDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (!customer || !customer.active || !customer.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(customer);
  }

  private async generateTokens(customer: { id: string; email: string; fullName: string }) {
    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'CUSTOMER',
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Persiste o refresh token (mesmo padrao do fluxo admin em auth.service.ts:
    // texto puro, para manter consistencia entre os dois fluxos).
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { refreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      customer: {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        type: 'CUSTOMER',
      },
    };
  }

  async forgotPassword(email: string) {
    const customer = await this.prisma.customer.findUnique({ where: { email } });

    // Sempre retorna sucesso para não revelar se o e-mail existe
    if (!customer || !customer.active || !customer.passwordHash) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });

    const appUrl = this.config.get('APP_URL') || 'http://localhost:5173';
    const resetUrl = `${appUrl}/cliente/redefinir-senha?token=${token}`;

    await this.emailService.sendPasswordResetEmail({
      to: customer.email,
      name: customer.fullName,
      resetUrl,
      portalName: 'Cliente',
    });

    return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!customer || !customer.resetPasswordExpires || customer.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'CUSTOMER') {
        throw new UnauthorizedException();
      }

      const customer = await this.prisma.customer.findUnique({
        where: { id: payload.sub },
      });

      if (!customer || !customer.active || customer.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }

      const newPayload = {
        sub: customer.id,
        email: customer.email,
        type: 'CUSTOMER',
      };

      return { access_token: this.jwtService.sign(newPayload) };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }

  async logout(customerId: string) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { refreshToken: null },
    });
  }
}
