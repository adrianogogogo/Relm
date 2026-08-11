import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
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

  /**
   * A tela inteira é ADMIN_RELM + GERENTE_RELM, mas os campos de tom entram no
   * prompt de sistema — são a única config daqui que muda o texto que chega ao
   * cliente. Essa parte fica só com ADMIN_RELM; escolher modelo continua com os
   * dois.
   */
  @Put('config')
  setConfig(@Body() dto: AiConfigDto, @Request() req: any) {
    const mexeNoPrompt = dto.tomLanding !== undefined || dto.tomEmail !== undefined;
    if (mexeNoPrompt && req.user?.role !== 'ADMIN_RELM') {
      throw new ForbiddenException('Apenas ADMIN_RELM pode alterar o tom dos especialistas.');
    }
    return this.aiAssistantService.setConfig(dto, req.user?.userId);
  }
}
