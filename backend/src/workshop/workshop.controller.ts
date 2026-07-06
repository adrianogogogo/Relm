import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

@ApiTags('Workshop')
@Controller('v1/services')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available slots for a customer' })
  async getAvailableSlots(@Query('customerId') customerId: string) {
    return this.workshopService.getAvailableSlots(customerId);
  }

  @Post('book')
  @ApiOperation({ summary: 'Book a service order' })
  async bookSlot(
    @Body() dto: {
      customerId: string;
      storeId: string;
      bikeModel: string;
      serviceType: ServiceType;
      scheduledFor: Date;
      deliveryRequest?: boolean;
    },
  ) {
    return this.workshopService.bookSlot(dto);
  }
}
