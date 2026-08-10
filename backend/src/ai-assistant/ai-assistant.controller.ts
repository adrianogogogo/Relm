import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiAssistantService } from './ai-assistant.service';
import { GenerateCopyDto } from './dto/generate-copy.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post('generate-copy')
  generateCopy(@Body() dto: GenerateCopyDto) {
    return this.aiAssistantService.generateCopy(dto);
  }

  @Post('daily-rider-message')
  dailyRiderMessage(@Body() dto: GenerateCopyDto) {
    return this.aiAssistantService.generateCopy({
      ...dto,
      type: 'DAILY_RIDER_MESSAGE',
    });
  }
}
