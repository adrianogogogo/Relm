import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { CreateLandingPageDto, UpdateLandingPageDto } from './dto/create-landing-page.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('marketing/landing-pages')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('public/:slug')
  getPublicPage(@Param('slug') slug: string) {
    return this.marketingService.findBySlugPublic(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @Post()
  create(@Body() createDto: CreateLandingPageDto) {
    return this.marketingService.create(createDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @Get()
  findAll() {
    return this.marketingService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketingService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateLandingPageDto) {
    return this.marketingService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN_RELM', 'GERENTE_RELM')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketingService.remove(id);
  }
}
