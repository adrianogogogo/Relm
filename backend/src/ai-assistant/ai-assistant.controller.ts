import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { AiConfigDto, GerarPaginaDto } from './dto/ai.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('gerar-pagina')
  gerarPagina(@Body() dto: GerarPaginaDto) {
    return this.aiAssistantService.gerarPagina(dto.tema, dto.destino, dto.contexto);
  }

  /** Devolve o configurado E as opções válidas — a tela não tem lista própria. */
  @Get('config')
  getConfig() {
    return this.aiAssistantService.getConfig();
  }

  @Put('config')
  setConfig(@Body() dto: AiConfigDto) {
    return this.aiAssistantService.setConfig(dto);
  }
}
