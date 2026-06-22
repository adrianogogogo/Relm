import { Controller, Get, Query } from '@nestjs/common';
import { BannersService } from './banners.service';

@Controller('public/banners')
export class PublicBannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findActive(
    @Query('audience') audience?: string,
    @Query('page') page?: string,
  ) {
    // Sem query => audience PUBLIC (compatibilidade com a home).
    return this.bannersService.findActive(audience, page);
  }
}
