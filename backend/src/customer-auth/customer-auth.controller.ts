import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtGuard } from './customer-jwt.guard';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { ChangePasswordDto } from '../common/dto/change-password.dto';

@ApiTags('customer-auth')
@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private customerAuthService: CustomerAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Cadastro de cliente com nota fiscal' })
  async register(@Body() dto: CustomerRegisterDto) {
    return this.customerAuthService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de cliente' })
  async login(@Body() dto: CustomerLoginDto) {
    return this.customerAuthService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }) {
    return this.customerAuthService.refresh(body.refresh_token);
  }

  @Post('logout')
  @UseGuards(CustomerJwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout de cliente' })
  async logout(@Request() req) {
    await this.customerAuthService.logout(req.user.customerId);
    return { message: 'Logout realizado com sucesso' };
  }

  @Post('change-password')
  @UseGuards(CustomerJwtGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alterar senha do cliente logado' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.customerAuthService.changePassword(
      req.user.customerId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar redefinição de senha' })
  async forgotPassword(@Body() body: { email: string }) {
    return this.customerAuthService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.customerAuthService.resetPassword(body.token, body.password);
  }
}
