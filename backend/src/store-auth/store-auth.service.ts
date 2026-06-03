import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { StoreLoginDto } from './dto/store-login.dto';
import { CreateStoreUserDto } from './dto/create-store-user.dto';

@Injectable()
export class StoreAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async login(dto: StoreLoginDto) {
    // Find store user by email
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { email: dto.email },
      include: { store: true },
    });

    if (!storeUser || !storeUser.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Check if store is active
    if (!storeUser.store.active) {
      throw new UnauthorizedException('Loja inativa');
    }

    // Verify password
    const valid = await bcrypt.compare(dto.password, storeUser.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Generate JWT tokens
    const payload = {
      sub: storeUser.id,
      email: storeUser.email,
      type: 'STORE',
      storeId: storeUser.storeId,
      role: storeUser.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: storeUser.id,
        name: storeUser.name,
        email: storeUser.email,
        role: storeUser.role,
        type: 'STORE',
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

  async createStoreUser(dto: CreateStoreUserDto) {
    // Check if store exists
    const store = await this.prisma.store.findUnique({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new BadRequestException('Loja não encontrada');
    }

    // Check if email already exists
    const existingUser = await this.prisma.storeUser.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create store user
    const storeUser = await this.prisma.storeUser.create({
      data: {
        storeId: dto.storeId,
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
      include: { store: true },
    });

    return {
      id: storeUser.id,
      name: storeUser.name,
      email: storeUser.email,
      role: storeUser.role,
      storeId: storeUser.storeId,
      store: {
        id: storeUser.store.id,
        tradeName: storeUser.store.tradeName,
      },
    };
  }

  async forgotPassword(email: string) {
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!storeUser || !storeUser.isActive || !storeUser.store.active) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.storeUser.update({
      where: { id: storeUser.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expires },
    });

    const appUrl = this.config.get('APP_URL') || 'http://localhost:5173';
    const resetUrl = `${appUrl}/loja/redefinir-senha?token=${token}`;

    await this.emailService.sendPasswordResetEmail({
      to: storeUser.email,
      name: storeUser.name,
      resetUrl,
      portalName: 'Loja',
    });

    return { message: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const storeUser = await this.prisma.storeUser.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!storeUser || !storeUser.resetPasswordExpires || storeUser.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.storeUser.update({
      where: { id: storeUser.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  async getStoreUsersByStore(storeId: string) {
    return this.prisma.storeUser.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
