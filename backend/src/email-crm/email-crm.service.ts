import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateEmailTemplateDto, CreateEmailCampaignDto, SendTestEmailDto, CampaignSegmentEnum } from './dto/create-email-crm.dto';

@Injectable()
export class EmailCrmService {
  private readonly logger = new Logger(EmailCrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // ---------------- TEMPLATES ----------------

  async createTemplate(dto: CreateEmailTemplateDto) {
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Template com slug '${dto.slug}' já existe.`);
    }

    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        variablesJson: dto.variablesJson || null,
      },
    });
  }

  async findAllTemplates() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findTemplateBySlug(slug: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { slug },
    });
    if (!template) {
      throw new NotFoundException(`Template '${slug}' não encontrado.`);
    }
    return template;
  }

  // ---------------- CAMPAIGNS ----------------

  async createCampaign(dto: CreateEmailCampaignDto) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (!template) {
      throw new NotFoundException(`Template ID '${dto.templateId}' não encontrado.`);
    }

    return this.prisma.emailCampaign.create({
      data: {
        title: dto.title,
        templateId: dto.templateId,
        targetSegment: dto.targetSegment || CampaignSegmentEnum.ALL_CUSTOMERS,
        status: 'DRAFT',
      },
      include: { template: true },
    });
  }

  async findAllCampaigns() {
    return this.prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
  }

  async sendTestEmail(dto: SendTestEmailDto) {
    try {
      return await this.emailService.sendPasswordResetEmail({
        to: dto.to,
        name: 'Usuário de Teste',
        resetUrl: '#',
        portalName: 'Cliente',
      });
    } catch (err) {
      this.logger.error(`Falha no envio de e-mail de teste: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async triggerCampaign(campaignId: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campanha ID '${campaignId}' não encontrada.`);
    }

    // Update status to SENDING
    await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    let recipients: { email: string; name: string }[] = [];

    if (campaign.targetSegment === 'ALL_CUSTOMERS') {
      const customers = await this.prisma.customer.findMany({
        where: { active: true },
        select: { email: true, fullName: true },
      });
      recipients = customers.map((c) => ({ email: c.email, name: c.fullName }));
    } else if (campaign.targetSegment === 'PLUS_ONLY') {
      const subscriptions = await this.prisma.subscription.findMany({
        where: { tier: 'PLUS', status: 'ACTIVE' },
        include: { customer: true },
      });
      recipients = subscriptions
        .filter((s) => s.customer && s.customer.active)
        .map((s) => ({ email: s.customer.email, name: s.customer.fullName }));
    } else if (campaign.targetSegment === 'STORES_ONLY') {
      const stores = await this.prisma.store.findMany({
        where: { active: true },
        select: { email: true, tradeName: true },
      });
      recipients = stores
        .filter((s) => s.email)
        .map((s) => ({ email: s.email, name: s.tradeName }));
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const recipient of recipients) {
      try {
        await this.emailService.sendPasswordResetEmail({
          to: recipient.email,
          name: recipient.name,
          resetUrl: '#',
          portalName: 'Cliente',
        });
        sentCount++;
      } catch (err) {
        errorCount++;
      }
    }

    return this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: errorCount > 0 && sentCount === 0 ? 'FAILED' : 'SENT',
        sentCount,
        errorCount,
        sentAt: new Date(),
      },
      include: { template: true },
    });
  }
}
