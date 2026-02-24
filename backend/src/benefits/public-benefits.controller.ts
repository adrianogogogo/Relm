import { Controller, Get, Param } from '@nestjs/common';
import { BenefitsService } from './benefits.service';

@Controller('public/benefits')
export class PublicBenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get()
  findActive() {
    return this.benefitsService.findActive();
  }

  @Get('featured')
  findFeatured() {
    return this.benefitsService.findFeatured();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.benefitsService.findOne(id);
  }
}
