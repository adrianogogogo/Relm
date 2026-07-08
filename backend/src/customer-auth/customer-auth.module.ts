import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { CustomerJwtGuard } from './customer-jwt.guard';
import { EmailModule } from '../email/email.module';
import { EngagementModule } from '../engagement/engagement.module';

@Module({
  imports: [
    PassportModule,
    EmailModule,
    forwardRef(() => EngagementModule),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('CUSTOMER_JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '1d' },
      }),
    }),
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerJwtStrategy, CustomerJwtGuard],
  exports: [CustomerJwtGuard, CustomerAuthService],
})
export class CustomerAuthModule {}
