import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { StoreAuthService } from './store-auth.service';
import { StoreLoginDto } from './dto/store-login.dto';
import { CreateStoreUserDto } from './dto/create-store-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('store-auth')
export class StoreAuthController {
  constructor(private readonly storeAuthService: StoreAuthService) {}

  @Post('login')
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
    throw new Error('Not implemented for admin users');
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    return this.storeAuthService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    return this.storeAuthService.resetPassword(body.token, body.password);
  }
}
