import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { ENTITLEMENTS } from '../common/entitlements';
import axios from 'axios';
import {
  UpdateWhatsappSettingsDto,
  BroadcastDto,
  BroadcastTarget,
} from './dto/whatsapp.dto';

// ClubSettings keys
export const SETTING_WA_NUMBER = 'whatsapp_number';
export const SETTING_WA_CLOUD_TOKEN = 'whatsapp_cloud_token';
export const SETTING_WA_PHONE_NUMBER_ID = 'whatsapp_phone_number_id';
export const SETTING_WA_TEMPLATE_NAME = 'whatsapp_template_name';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

  // ── Webhook (inbound) ──────────────────────────────────────────────────────

  verifyWebhook(mode: string, token: string, challenge: string): string {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'RELM_CONCIERGE_SECRET_TOKEN';
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp Webhook verified successfully.');
      return challenge;
    }
    this.logger.warn('WhatsApp Webhook verification failed.');
    throw new BadRequestException('Verification failed');
  }

  async handleIncomingMessage(payload: any) {
    this.logger.log(`Received WhatsApp payload: ${JSON.stringify(payload)}`);

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return { status: 'ignored' };
    }

    const senderPhone = message.from;
    const textBody = message.text?.body?.trim().toLowerCase();

    if (textBody !== '/saldo' && textBody !== '/revisao') {
      return { status: 'ignored' };
    }

    const normalizedPhone = senderPhone.startsWith('55') ? senderPhone.substring(2) : senderPhone;

    const customer = await this.prisma.customer.findFirst({
      where: {
        phone: {
          contains: normalizedPhone,
        },
      },
    });

    if (!customer) {
      this.logger.warn(`No customer found with phone containing ${normalizedPhone}`);
      await this.sendCloudMessage(senderPhone, 'Olá! Não encontramos um cadastro da Relm Bikes para o seu número de telefone.');
      return { status: 'customer_not_found' };
    }

    if (!ENTITLEMENTS[customer.currentTier].concierge) {
      const messageText = 'Olá! O canal Concierge é exclusivo para membros Premium (Care Plus). Adquira uma bicicleta Relm ou assine o plano Plus para ter acesso a este canal.';
      await this.sendCloudMessage(senderPhone, messageText);
      return { status: 'restricted' };
    }

    if (textBody === '/saldo') {
      // Total, não só o acumulável: o ponto mensal vale para qualquer resgate,
      // então informar menos que isso induz o cliente a não resgatar.
      const { total: balance, monthly } = await this.pointsService.getBalances(customer.id);
      const messageText =
        `Olá, ${customer.fullName}! Seu saldo de pontos atual no Clube de Vantagens Relm é de: ${balance} pontos.` +
        (monthly > 0 ? ` Destes, ${monthly} são pontos mensais e expiram no fim do mês.` : '');
      await this.sendCloudMessage(senderPhone, messageText);
      return { status: 'processed_saldo', balance };
    }

    if (textBody === '/revisao') {
      const latestRevision = await this.prisma.serviceOrder.findFirst({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
      });

      let messageText = '';
      if (!latestRevision) {
        messageText = `Olá, ${customer.fullName}! Você não tem nenhum agendamento de oficina ativo ou recente. Acesse o portal para agendar a sua próxima revisão!`;
      } else {
        messageText = `Olá, ${customer.fullName}! O status do seu agendamento de revisão para o dia ${latestRevision.scheduledFor.toLocaleDateString('pt-BR')} é: ${latestRevision.status}.`;
      }
      await this.sendCloudMessage(senderPhone, messageText);
      return { status: 'processed_revisao' };
    }

    return { status: 'processed' };
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  async getPublicContact(): Promise<{ number: string | null }> {
    const setting = await this.prisma.clubSettings.findUnique({
      where: { key: SETTING_WA_NUMBER },
    });
    const number = setting?.value?.trim() || null;
    return { number: number || null };
  }

  // ── Admin settings ─────────────────────────────────────────────────────────

  async getSettings() {
    const [numberRow, tokenRow, phoneIdRow, templateRow] = await Promise.all([
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_NUMBER } }),
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_CLOUD_TOKEN } }),
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_PHONE_NUMBER_ID } }),
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_TEMPLATE_NAME } }),
    ]);

    const rawToken = tokenRow?.value?.trim() || '';
    const tokenSet = rawToken.length > 0;
    const tokenMasked = tokenSet
      ? `****${rawToken.slice(-4)}`
      : null;

    return {
      number: numberRow?.value?.trim() || null,
      phoneNumberId: phoneIdRow?.value?.trim() || null,
      templateName: templateRow?.value?.trim() || null,
      tokenSet,
      tokenMasked,
    };
  }

  async updateSettings(dto: UpdateWhatsappSettingsDto): Promise<void> {
    const upsert = (key: string, value: string) =>
      this.prisma.clubSettings.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });

    const ops: Promise<any>[] = [];

    if (dto.number !== undefined) {
      const digits = dto.number.replace(/\D/g, '');
      ops.push(upsert(SETTING_WA_NUMBER, digits));
    }

    if (dto.cloudToken !== undefined && dto.cloudToken.trim() !== '') {
      ops.push(upsert(SETTING_WA_CLOUD_TOKEN, dto.cloudToken.trim()));
    }

    if (dto.phoneNumberId !== undefined) {
      ops.push(upsert(SETTING_WA_PHONE_NUMBER_ID, dto.phoneNumberId.trim()));
    }

    if (dto.templateName !== undefined) {
      ops.push(upsert(SETTING_WA_TEMPLATE_NAME, dto.templateName.trim()));
    }

    await Promise.all(ops);
  }

  // ── Broadcast ──────────────────────────────────────────────────────────────

  async broadcast(dto: BroadcastDto, actorId: string): Promise<{
    configured: boolean;
    message?: string;
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  }> {
    // Check credentials
    const [tokenRow, phoneIdRow, templateRow] = await Promise.all([
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_CLOUD_TOKEN } }),
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_PHONE_NUMBER_ID } }),
      this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_TEMPLATE_NAME } }),
    ]);

    const token = tokenRow?.value?.trim() || '';
    const phoneNumberId = phoneIdRow?.value?.trim() || '';
    // Meta: mensagens INICIADAS pela empresa fora da janela de 24h exigem
    // template aprovado. Com template configurado, o broadcast envia
    // type:'template' com a mensagem como variável {{1}} do corpo.
    const templateName = templateRow?.value?.trim() || '';

    if (!token || !phoneNumberId) {
      return {
        configured: false,
        message: 'Credenciais da Cloud API não configuradas. Configure whatsapp_cloud_token e whatsapp_phone_number_id em Configurações.',
        total: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      };
    }

    // Resolve recipients
    let customers: { id: string; phone: string; fullName: string }[] = [];

    if (dto.target === BroadcastTarget.CUSTOM) {
      if (!dto.customerIds || dto.customerIds.length === 0) {
        throw new BadRequestException('customerIds é obrigatório para target CUSTOM');
      }
      customers = await this.prisma.customer.findMany({
        where: { id: { in: dto.customerIds } },
        select: { id: true, phone: true, fullName: true },
      });
    } else if (dto.target === BroadcastTarget.ALL) {
      customers = await this.prisma.customer.findMany({
        select: { id: true, phone: true, fullName: true },
      });
    } else {
      // CARE or PLUS — filter by active subscription tier
      const tier = dto.target as string; // 'CARE' | 'PLUS'
      const subs = await this.prisma.subscription.findMany({
        where: { tier: tier as any, status: 'ACTIVE' },
        select: { customerId: true },
      });
      const ids = subs.map((s) => s.customerId);
      customers = await this.prisma.customer.findMany({
        where: { id: { in: ids } },
        select: { id: true, phone: true, fullName: true },
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const customer of customers) {
      const e164 = this.toE164(customer.phone);
      if (!e164) {
        skipped++;
        continue;
      }
      try {
        if (templateName) {
          await this.sendCloudTemplate(e164, templateName, dto.message, token, phoneNumberId);
        } else {
          await this.sendCloudMessage(e164, dto.message, token, phoneNumberId);
        }
        sent++;
      } catch {
        failed++;
      }
      // ~200ms delay between sends (rate ~5/s)
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        entity: 'whatsapp_broadcast',
        entityId: actorId,
        metadata: {
          target: dto.target,
          total: customers.length,
          sent,
          failed,
          skipped,
          messagePreview: dto.message.substring(0, 80),
        },
      },
    });

    return { configured: true, total: customers.length, sent, failed, skipped };
  }

  // ── Internal send ──────────────────────────────────────────────────────────

  /**
   * Sends a message via WhatsApp Cloud API.
   * Reads credentials from ClubSettings by default; falls back to env vars
   * so the inbound webhook replies continue to work if settings are empty.
   */
  async sendCloudMessage(
    to: string,
    text: string,
    tokenOverride?: string,
    phoneNumberIdOverride?: string,
  ): Promise<void> {
    let token = tokenOverride;
    let phoneNumberId = phoneNumberIdOverride;

    if (!token || !phoneNumberId) {
      const [tokenRow, phoneIdRow] = await Promise.all([
        this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_CLOUD_TOKEN } }),
        this.prisma.clubSettings.findUnique({ where: { key: SETTING_WA_PHONE_NUMBER_ID } }),
      ]);
      token = tokenRow?.value?.trim() || process.env.WHATSAPP_API_TOKEN || '';
      phoneNumberId = phoneIdRow?.value?.trim() || 'me';
    }

    const e164 = this.toE164(to);
    const destination = e164 || to;

    this.logger.log(`[WHATSAPP SEND] to: ${destination}, preview: "${text.substring(0, 40)}..."`);

    if (!token) {
      this.logger.warn('No WhatsApp token configured — message not sent.');
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: destination,
          type: 'text',
          text: { body: text },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message via Meta API: ${err.message}`);
      throw err;
    }
  }

  /**
   * Envia mensagem de TEMPLATE aprovado (Meta) — obrigatório para mensagens
   * iniciadas pela empresa fora da janela de 24h. O texto entra como
   * variável {{1}} do corpo do template (template deve ter 1 variável).
   */
  private async sendCloudTemplate(
    to: string,
    templateName: string,
    bodyParam: string,
    token: string,
    phoneNumberId: string,
  ): Promise<void> {
    this.logger.log(`[WHATSAPP TEMPLATE] to: ${to}, template: ${templateName}`);
    try {
      await axios.post(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              { type: 'body', parameters: [{ type: 'text', text: bodyParam }] },
            ],
          },
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp template: ${err.message}`);
      throw err;
    }
  }

  /** Normalize a BR phone to E.164. Returns null if invalid. */
  toE164(phone: string): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    // Already E.164 with country code 55
    if (digits.startsWith('55') && digits.length >= 12 && digits.length <= 13) {
      return `+${digits}`;
    }
    // Local BR: 10 digits (landline) or 11 digits (mobile with 9)
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }
    // Already has + prefix covered by startsWith check above
    if (digits.length >= 12) {
      return `+${digits}`;
    }
    return null;
  }
}
