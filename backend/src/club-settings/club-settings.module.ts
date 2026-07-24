import { Module } from '@nestjs/common';
import { ClubSettingsService } from './club-settings.service';
import { ClubSettingsController } from './club-settings.controller';

@Module({
  controllers: [ClubSettingsController],
  providers: [ClubSettingsService],
  exports: [ClubSettingsService],
})
export class ClubSettingsModule {}
