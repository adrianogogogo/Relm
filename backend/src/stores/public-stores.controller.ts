import { Controller, Get, Query } from '@nestjs/common';
import { StoresService } from './stores.service';

@Controller('public/stores')
export class PublicStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findPublicStores(
    @Query('city') city?: string,
    @Query('state') state?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
  ) {
    return this.storesService.findPublicStores({
      city,
      state,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
    });
  }
}
