import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private emailEnabled: boolean = false;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      this.logger.warn('⚠️ SMTP não configurado - emails não serão enviados');
      this.logger.warn('Configure SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no .env');
      this.emailEnabled = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.emailEnabled = true;
      this.logger.log(`✅ EmailService configurado: ${smtpUser}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao configurar EmailService: ${error.message}`);
      this.emailEnabled = false;
    }
  }

  async sendWarrantyApprovalEmail(data: {
    to: string;
    customerName: string;
    protocolNumber: string;
    validationToken: string;
    productModel: string;
    serialNumber: string;
    approvedAt: Date;
  }): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.emailEnabled || !this.transporter) {
      this.logger.warn('⚠️ SMTP não configurado - email de aprovação não enviado');
      return { success: false, error: 'SMTP não configurado' };
    }

    try {
      const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
      const validationUrl = `${appUrl}/warranty/validate/${data.validationToken}`;

      const mailOptions = {
        from: `"Relm Care+" <${this.configService.get('SMTP_USER')}>`,
        to: data.to,
        subject: `✅ Garantia Aprovada - Protocolo ${data.protocolNumber}`,
        html: this.getWarrantyApprovalTemplate(data, validationUrl),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email de aprovação enviado para ${data.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email de aprovação: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendWarrantyRejectionEmail(data: {
    to: string;
    customerName: string;
    protocolNumber: string;
    rejectionReason: string;
    productModel: string;
  }): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.emailEnabled || !this.transporter) {
      this.logger.warn('⚠️ SMTP não configurado - email de rejeição não enviado');
      return { success: false, error: 'SMTP não configurado' };
    }

    try {
      const mailOptions = {
        from: `"Relm Care+" <${this.configService.get('SMTP_USER')}>`,
        to: data.to,
        subject: `❌ Solicitação de Garantia Negada - Protocolo ${data.protocolNumber}`,
        html: this.getWarrantyRejectionTemplate(data),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email de rejeição enviado para ${data.to}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar email de rejeição: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private getWarrantyApprovalTemplate(
    data: {
      customerName: string;
      protocolNumber: string;
      productModel: string;
      serialNumber: string;
      approvedAt: Date;
    },
    validationUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Garantia Aprovada</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">RELM BIKES</h1>
                <p style="color: #ffffff; margin: 10px 0 0;">Care+ | Garantias</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #10b981; text-align: center;">✅ Garantia Aprovada!</h2>
                <p>Olá, <strong>${data.customerName}</strong>!</p>
                <p>Sua solicitação de garantia foi <strong>aprovada</strong>! 🎉</p>
                
                <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <h3 style="margin-top: 0;">Detalhes da Garantia</h3>
                    <p><strong>Protocolo:</strong> ${data.protocolNumber}</p>
                    <p><strong>Produto:</strong> ${data.productModel}</p>
                    <p><strong>Número de Série:</strong> ${data.serialNumber}</p>
                    <p><strong>Data de Aprovação:</strong> ${new Date(data.approvedAt).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${validationUrl}" 
                       style="display: inline-block; background-color: #10b981; color: #ffffff; 
                              text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold;">
                        Validar Garantia
                    </a>
                </div>

                <p style="font-size: 12px; color: #6b7280;">
                    Ou copie e cole este link: ${validationUrl}
                </p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>© ${new Date().getFullYear()} Relm Bikes. Todos os direitos reservados.</p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  private getWarrantyRejectionTemplate(data: {
    customerName: string;
    protocolNumber: string;
    rejectionReason: string;
    productModel: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
    <title>Solicitação de Garantia</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td style="background-color: #ef4444; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">RELM BIKES</h1>
                <p style="color: #ffffff; margin: 10px 0 0;">Care+ | Garantias</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h2 style="color: #ef4444; text-align: center;">Solicitação Negada</h2>
                <p>Olá, <strong>${data.customerName}</strong>,</p>
                <p>Informamos que sua solicitação de garantia não pôde ser aprovada.</p>
                
                <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <h3 style="margin-top: 0;">Informações</h3>
                    <p><strong>Protocolo:</strong> ${data.protocolNumber}</p>
                    <p><strong>Produto:</strong> ${data.productModel}</p>
                </div>

                <div style="background-color: #fffbeb; padding: 20px; margin: 20px 0; border: 1px solid #fbbf24;">
                    <h3 style="margin-top: 0; color: #92400e;">Motivo da Negativa</h3>
                    <p style="color: #78350f;">${data.rejectionReason}</p>
                </div>

                <p>Entre em contato conosco para esclarecer dúvidas:</p>
                <p><strong>📧</strong> garantias@relmbikes.com.br<br>
                   <strong>📱</strong> WhatsApp: (11) 99999-9999</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
                <p>© ${new Date().getFullYear()} Relm Bikes. Todos os direitos reservados.</p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }
}
