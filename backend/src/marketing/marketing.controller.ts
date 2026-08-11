import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketingService } from './marketing.service';
import { CreateLandingPageDto, UpdateLandingPageDto } from './dto/create-landing-page.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginaGerada } from '../ai-design/blocks.schema';
import { renderLanding } from '../ai-design/landing-renderer';

/**
 * Fora do prefixo /api e sem guard: é a página que o cliente abre e que o robô
 * do WhatsApp busca para montar o card. Controller separado porque o prefixo do
 * MarketingController não pode ser escapado.
 */
@Controller()
export class LandingPublicController {
  constructor(
    private readonly marketingService: MarketingService,
    private readonly config: ConfigService,
  ) {}

  @Get('lp/:slug')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async render(@Param('slug') slug: string) {
    const page = await this.marketingService.findBySlugPublic(slug);
    // og:image e src da imagem precisam ser absolutos: crawler ignora relativo.
    const baseUrl = this.config.get<string>('PUBLIC_BASE_URL') || '';
    return renderLanding(page.blocksJson as unknown as PaginaGerada, baseUrl);
  }
}

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
