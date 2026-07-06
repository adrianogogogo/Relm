import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@Controller('v1/integration')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('sales-trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ERP Trigger for sales activation (BIKE activates PLUS tier)' })
  @ApiResponse({ status: 200, description: 'Subscription created or updated' })
  async salesTrigger(
    @Body() dto: { customer_email: string; product_serial_number: string; invoice_type: 'BIKE' | 'ACCESSORY' },
  ) {
    return this.subscriptionsService.salesTrigger(dto);
  }
}
