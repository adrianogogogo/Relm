import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BenefitsService } from './benefits.service';

@ApiTags('benefits', 'public')
@Controller()
export class BenefitsController {
  constructor(private benefitsService: BenefitsService) {}

  @Get('public/benefits')
  findAllPublic(@Query() query: any) {
    return this.benefitsService.findAll({ active: true, ...query });
  }
}
