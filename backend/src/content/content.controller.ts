import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('content')
@Controller('content')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentController {
  constructor(private contentService: ContentService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.contentService.findAll(query);
  }
}
