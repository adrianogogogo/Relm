import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { EmailCrmService } from './email-crm.service';
import { CreateEmailTemplateDto, CreateEmailCampaignDto, SendTestEmailDto } from './dto/create-email-crm.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('email-crm')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_RELM', 'GERENTE_RELM')
export class EmailCrmController {
  constructor(private readonly emailCrmService: EmailCrmService) {}

  @Get('templates')
  findAllTemplates() {
    return this.emailCrmService.findAllTemplates();
  }

  @Post('templates')
  createTemplate(@Body() dto: CreateEmailTemplateDto) {
    return this.emailCrmService.createTemplate(dto);
  }

  @Get('campaigns')
  findAllCampaigns() {
    return this.emailCrmService.findAllCampaigns();
  }

  @Post('campaigns')
  createCampaign(@Body() dto: CreateEmailCampaignDto) {
    return this.emailCrmService.createCampaign(dto);
  }

  @Post('campaigns/:id/send')
  triggerCampaign(@Param('id') id: string) {
    return this.emailCrmService.triggerCampaign(id);
  }

  @Post('send-test')
  sendTestEmail(@Body() dto: SendTestEmailDto) {
    return this.emailCrmService.sendTestEmail(dto);
  }
}
