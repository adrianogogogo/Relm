import { Injectable, NotFoundException, ConflictException, Logger, ServiceUnavailableException } from '@nestjs/common';
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
    // DESLIGADO DE PROPÓSITO. Três defeitos, em ordem de gravidade:
    //
    // 1. O laço abaixo dispara `sendPasswordResetEmail` com `resetUrl: '#'` —
    //    a base inteira receberia um e-mail com cara de redefinição de senha
    //    que ninguém pediu, com link morto. É o formato de um phishing saindo
    //    do próprio domínio, e queima a reputação usada pelos transacionais.
    // 2. Não filtra `Customer.marketingConsent` — envia para quem nunca disse
    //    sim. O campo existe, é coletado no cadastro e nasce `false`.
    // 3. Não há link de descadastro, obrigatório em envio de marketing.
    //
    // Gerar, pré-visualizar e salvar campanha seguem funcionando — é o escopo
    // que o plano 011 previa para esta rodada. Para religar: template de
    // campanha de verdade + filtro de consentimento + descadastro, e só então
    // remover esta guarda.
    // process.env e não ConfigService: injetar um terceiro parâmetro mudaria a
    // assinatura do construtor e quebraria o spec que já existe.
    if (process.env.EMAIL_CAMPAIGN_SEND_ENABLED !== 'true') {
      throw new ServiceUnavailableException(
        'Disparo em massa desligado: falta template de campanha, filtro de consentimento e descadastro. A campanha continua salva.',
      );
    }

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
