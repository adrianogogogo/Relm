import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('content')
@Controller('content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM', 'SUPORTE_RELM')
@ApiBearerAuth()
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get()
  findAll(@Query() query: { active?: string; targetRole?: string }) {
    return this.contentService.findAll({
      active: query.active,
      targetRole: query.targetRole,
    });
  }
}
