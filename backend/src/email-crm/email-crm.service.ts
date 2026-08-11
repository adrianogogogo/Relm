import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto, CreateEmailCampaignDto } from './dto/create-email-crm.dto';
import { PaginaGerada } from '../ai-design/blocks.schema';
import { renderEmail } from '../ai-design/email-renderer';

/**
 * Este módulo NÃO envia e-mail, por decisão de projeto. Ele gera, guarda e
 * exporta HTML; o disparo é feito na ferramenta de e-mail marketing que a equipe
 * já usa, que traz consentimento, descadastro, bounce e supressão prontos.
 *
 * O transporte daqui é nodemailer sobre SMTP do Gmail — teto de ~500/dia, e a
 * mesma conta manda redefinição de senha. Disparo em massa por ali suspende a
 * conta e derruba o transacional junto.
 */
@Injectable()
export class EmailCrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ---------------- TEMPLATES ----------------

  async createTemplate(dto: CreateEmailTemplateDto) {
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Template com slug '${dto.slug}' já existe.`);
    }

    // bodyHtml é derivado, não digitado: quem manda é blocksJson. A tela não
    // monta HTML de e-mail — as regras (tabela, CSS inline, 600px) moram no
    // renderizador, e um segundo lugar montando isso divergiria na primeira
    // mudança.
    const blocos = dto.blocksJson as unknown as PaginaGerada | undefined;
    const baseUrl = this.config.get<string>('PUBLIC_BASE_URL') || '';

    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        subject: dto.subject,
        bodyHtml: blocos ? renderEmail(blocos, baseUrl) : dto.bodyHtml || '',
        blocksJson: (dto.blocksJson as any) || undefined,
      },
    });
  }

  async findAllTemplates() {
    return this.prisma.emailTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  async findTemplateBySlug(slug: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { slug } });
    if (!template) {
      throw new NotFoundException(`Template '${slug}' não encontrado.`);
    }
    return template;
  }

  // ---------------- CAMPANHAS ----------------

  async createCampaign(dto: CreateEmailCampaignDto) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: dto.templateId },
    });
    if (!template) {
      throw new NotFoundException(`Template ID '${dto.templateId}' não encontrado.`);
    }

    return this.prisma.emailCampaign.create({
      data: { title: dto.title, templateId: dto.templateId },
      include: { template: true },
    });
  }

  async findAllCampaigns() {
    return this.prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
  }

  /**
   * HTML pronto para colar na ferramenta de disparo.
   *
   * Renderiza a partir dos blocos, não do bodyHtml guardado: se alguém trocar a
   * paleta ou o texto, o export sai atualizado sem depender de alguém lembrar
   * de regravar o HTML.
   */
  async exportHtml(campaignId: string) {
    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });
    if (!campaign) {
      throw new NotFoundException(`Campanha ID '${campaignId}' não encontrada.`);
    }

    const blocos = campaign.template.blocksJson as unknown as PaginaGerada | null;
    if (!blocos) {
      throw new NotFoundException(
        'Esta campanha não tem conteúdo em blocos para exportar.',
      );
    }

    // Absoluto: cliente de e-mail não resolve caminho relativo, a imagem some.
    const baseUrl = this.config.get<string>('PUBLIC_BASE_URL') || '';

    return {
      subject: campaign.template.subject,
      filename: `${campaign.template.slug}.html`,
      html: renderEmail(blocos, baseUrl),
    };
  }
}
