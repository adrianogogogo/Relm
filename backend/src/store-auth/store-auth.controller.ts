import { Controller, Post, Patch, Body, Get, Param, UseGuards, Request, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { StoreAuthService } from './store-auth.service';
import { StoreLoginDto } from './dto/store-login.dto';
import { CreateStoreUserDto } from './dto/create-store-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { StoreJwtGuard } from './store-jwt.guard';
import { ChangePasswordDto } from '../common/dto/change-password.dto';
import { AdminResetPasswordDto } from '../common/dto/admin-reset-password.dto';

@Controller('store-auth')
export class StoreAuthController {
  constructor(private readonly storeAuthService: StoreAuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: StoreLoginDto) {
    return this.storeAuthService.login(dto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  async createStoreUser(@Body() dto: CreateStoreUserDto) {
    return this.storeAuthService.createStoreUser(dto);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard)
  async getStoreUsers(@Request() req) {
    const user = req.user;
    if (user.type === 'STORE') {
      return this.storeAuthService.getStoreUsersByStore(user.storeId);
    }
    throw new ForbiddenException('Este endpoint é exclusivo para usuários de loja');
  }

  // Admin (ADMIN_RELM) redefine a senha de qualquer lojista.
  // Rota mais específica que o GET 'users' fixo — sem colisão.
  @Patch('users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM')
  async adminResetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.storeAuthService.adminSetPassword(id, dto.password);
  }

  @Post('change-password')
  @UseGuards(StoreJwtGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.storeAuthService.changePassword(
      req.user.storeUserId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    return this.storeAuthService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.storeAuthService.resetPassword(body.token, body.password);
  }
}
