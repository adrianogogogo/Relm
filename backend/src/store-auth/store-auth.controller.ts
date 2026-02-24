import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
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
    
    // If it's a store user, return only users from their store
    if (user.type === 'STORE') {
      return this.storeAuthService.getStoreUsersByStore(user.storeId);
    }
    
    // Admin can view all (implement later if needed)
    throw new Error('Not implemented for admin users');
  }
}
