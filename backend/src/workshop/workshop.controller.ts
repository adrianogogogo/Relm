import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { WorkshopService } from './workshop.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ServiceType, ServiceStatus } from '@prisma/client';

@ApiTags('Workshop')
@Controller('v1/services')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available slots for a customer' })
  async getAvailableSlots(@Query('customerId') customerId: string) {
    return this.workshopService.getAvailableSlots(customerId);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get all service orders for a customer' })
  async getCustomerOrders(@Query('customerId') customerId: string) {
    return this.workshopService.getCustomerOrders(customerId);
  }

  @Get('store-orders')
  @ApiOperation({ summary: 'Get all service orders for a store' })
  async getStoreOrders(@Query('storeId') storeId: string) {
    return this.workshopService.getStoreOrders(storeId);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update status of a service order' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ServiceStatus,
  ) {
    return this.workshopService.updateOrderStatus(id, status);
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
