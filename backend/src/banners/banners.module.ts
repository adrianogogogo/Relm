import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { PublicBannersController } from './public-banners.controller';
import { BannerUploadController } from './banner-upload.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BannersController, PublicBannersController, BannerUploadController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
