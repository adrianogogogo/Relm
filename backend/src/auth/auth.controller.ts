import { Controller, Post, Patch, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChangePasswordDto } from '../common/dto/change-password.dto';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login de usuário (tabela User)' })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token' })
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refresh(body.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout' })
  async logout(@Request() req) {
    await this.authService.logout(req.user.userId);
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar senha do usuário logado (tabela User)' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar nome/e-mail do usuário logado (tabela User)' })
  async updateProfile(@Request() req, @Body() dto: UpdateOwnProfileDto) {
    return this.authService.updateOwnProfile(req.user.userId, dto);
  }

  // ── Endpoints Unificados ────────────────────────────────────────────────────

  @Post('unified-login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login unificado (User + Customer + StoreUser)' })
  async unifiedLogin(@Body() body: { email: string; password: string }) {
    return this.authService.unifiedLogin(body.email, body.password);
  }

  @Post('unified-forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Esqueci senha unificado' })
  async unifiedForgotPassword(@Body() body: { email: string }) {
    return this.authService.unifiedForgotPassword(body.email);
  }

  @Post('unified-reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha unificado' })
  async unifiedResetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.unifiedResetPassword(body.token, body.password);
  }
}
