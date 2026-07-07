import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PointsService } from '../points/points.service';
import { ENTITLEMENTS } from '../common/entitlements';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
  ) {}

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
      await this.sendMockWhatsAppMessage(senderPhone, 'Olá! Não encontramos um cadastro da Relm Bikes para o seu número de telefone.');
      return { status: 'customer_not_found' };
    }

    if (!ENTITLEMENTS[customer.currentTier].concierge) {
      const messageText = 'Olá! O canal Concierge é exclusivo para membros Premium (Care Plus). Adquira uma bicicleta Relm ou assine o plano Plus para ter acesso a este canal.';
      await this.sendMockWhatsAppMessage(senderPhone, messageText);
      return { status: 'restricted' };
    }

    if (textBody === '/saldo') {
      const balance = await this.pointsService.getBalance(customer.id);
      const messageText = `Olá, ${customer.fullName}! Seu saldo de pontos atual no Clube de Vantagens Relm é de: ${balance} pontos.`;
      await this.sendMockWhatsAppMessage(senderPhone, messageText);
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
      await this.sendMockWhatsAppMessage(senderPhone, messageText);
      return { status: 'processed_revisao' };
    }

    return { status: 'processed' };
  }

  private async sendMockWhatsAppMessage(to: string, message: string) {
    this.logger.log(`[MOCK WHATSAPP SEND] to: ${to}, message: "${message}"`);
    try {
      const token = process.env.WHATSAPP_API_TOKEN;
      if (token) {
        await axios.post(
          'https://graph.facebook.com/v21.0/me/messages',
          {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: message },
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      }
    } catch (err) {
      this.logger.error(`Failed to send WhatsApp message via Meta API: ${err.message}`);
    }
  }
}
