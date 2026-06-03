import { Controller, Get } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('public/banners')
export class PublicBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findActive() {
    return this.bannersService.findActive();
  }
}
