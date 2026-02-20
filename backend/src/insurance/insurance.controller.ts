import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';

@ApiTags('insurance', 'public')
@Controller('public/insurance-quote')
export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  @Post()
  create(@Body() body: any) {
    return this.insuranceService.create(body);
  }
}
