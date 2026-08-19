import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    if (!smtpUser || !smtpPass) {
      this.logger.warn(
        'SMTP não configurado (SMTP_USER/SMTP_PASS ausentes) - emails não serão enviados',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST') || 'smtp.gmail.com',
        port: this.configService.get('SMTP_PORT') || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.isConfigured = true;
      this.logger.log('SMTP configurado');
    } catch (error) {
      this.logger.error(`Erro ao configurar SMTP: ${error.message}`);
      this.isConfigured = false;
    }
  }

  // Escapa caracteres especiais de HTML para prevenir injeção de markup/XSS
  // ao interpolar dados de origem não confiável (nomes, motivos, etc.) nos
  // templates de e-mail. NÃO use em URLs que vão em href (quebraria a URL).
  private escapeHtml(text: unknown): string {
    if (text === null || text === undefined) {
      return '';
    }
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendWarrantyApprovalEmail(data: {
    to: string;
    customerName: string;
    protocolNumber: string;
    validationToken: string;
    productModel: string;
    serialNumber: string;
    approvedAt: Date;
  }) {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn('SMTP não configurado - email de aprovação não enviado');
      return { success: false, error: 'SMTP não configurado' };
    }

    const validationUrl = `${this.configService.get('APP_URL')}/validar-garantia/${data.validationToken}`;

    const mailOptions = {
      from: `"Relm Care+" <${this.configService.get('SMTP_USER')}>`,
      to: data.to,
      subject: `✅ Garantia Aprovada - Protocolo ${data.protocolNumber}`,
      html: this.getWarrantyApprovalTemplate(data, validationUrl),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`);
      throw error;
    }
  }

  async sendWarrantyRejectionEmail(data: {
    to: string;
    customerName: string;
    protocolNumber: string;
    rejectionReason: string;
    productModel: string;
  }) {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn('SMTP não configurado - email de rejeição não enviado');
      return { success: false, error: 'SMTP não configurado' };
    }

    const mailOptions = {
      from: `"Relm Care+" <${this.configService.get('SMTP_USER')}>`,
      to: data.to,
      subject: `❌ Solicitação de Garantia Negada - Protocolo ${data.protocolNumber}`,
      html: this.getWarrantyRejectionTemplate(data),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado (messageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Erro ao enviar email: ${error.message}`);
      throw error;
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
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                RELM BIKES
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Care+ | Sistema de Garantias</p>
                        </td>
                    </tr>

                    <!-- Success Icon -->
                    <tr>
                        <td style="padding: 40px 30px 20px; text-align: center;">
                            <div style="width: 80px; height: 80px; margin: 0 auto; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 48px; color: white;">✓</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h2 style="margin: 0 0 20px; color: #10b981; font-size: 24px; text-align: center;">
                                Garantia Aprovada!
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Olá, <strong>${this.escapeHtml(data.customerName)}</strong>!
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Temos o prazer de informar que sua solicitação de garantia foi <strong style="color: #10b981;">aprovada</strong>! 🎉
                            </p>

                            <!-- Warranty Details -->
                            <div style="background-color: #f9fafb; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 18px;">Detalhes da Garantia</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Protocolo:</td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                            ${this.escapeHtml(data.protocolNumber)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Produto:</td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                            ${this.escapeHtml(data.productModel)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Número de Série:</td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                            ${this.escapeHtml(data.serialNumber)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Data de Aprovação:</td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                            ${new Date(data.approvedAt).toLocaleDateString('pt-BR', { 
                                                day: '2-digit', 
                                                month: 'long', 
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Validation Button -->
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${validationUrl}" 
                                   style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                    Validar Garantia
                                </a>
                            </div>

                            <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                                Ou copie e cole este link no seu navegador:
                            </p>
                            <p style="margin: 5px 0 0; color: #2563eb; font-size: 12px; text-align: center; word-break: break-all;">
                                ${validationUrl}
                            </p>

                            <!-- Next Steps -->
                            <div style="background-color: #eff6ff; padding: 20px; margin: 30px 0; border-radius: 8px; border: 1px solid #bfdbfe;">
                                <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 16px;">📋 Próximos Passos</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 14px; line-height: 1.8;">
                                    <li>Clique no botão acima para validar sua garantia</li>
                                    <li>Entre em contato conosco pelo WhatsApp para agendar o atendimento</li>
                                    <li>Apresente este email na loja autorizada mais próxima</li>
                                    <li>Guarde este email para consultas futuras</li>
                                </ul>
                            </div>

                            <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Se tiver dúvidas, entre em contato conosco:
                            </p>
                            <p style="margin: 5px 0 0; color: #2563eb; font-size: 14px;">
                                📧 garantias@relmbikes.com.br<br>
                                📱 WhatsApp: (11) 99999-9999
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                                © ${new Date().getFullYear()} Relm Bikes. Todos os direitos reservados.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                Este é um email automático do sistema Relm Care+. Por favor, não responda.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }

  async sendPasswordResetEmail(data: {
    to: string;
    name: string;
    resetUrl: string;
    portalName?: string;
  }) {
    if (!this.isConfigured || !this.transporter) {
      this.logger.warn(
        'SMTP não configurado - email de redefinição de senha não enviado',
      );
      return { success: false, error: 'SMTP não configurado', devUrl: data.resetUrl };
    }

    const portalName = data.portalName || 'Painel';
    const mailOptions = {
      from: `"Relm Care+" <${this.configService.get('SMTP_USER')}>`,
      to: data.to,
      subject: `🔐 Redefinição de senha - Relm Care+ ${portalName}`,
      html: this.getPasswordResetTemplate({ name: data.name, resetUrl: data.resetUrl, portalName }),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Erro ao enviar email de reset: ${error.message}`);
      throw error;
    }
  }

  private getPasswordResetTemplate(data: {
    name: string;
    resetUrl: string;
    portalName: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" style="width:600px;border-collapse:collapse;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);padding:40px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:bold;">RELM BIKES</h1>
            <p style="margin:10px 0 0;color:#e0e7ff;font-size:14px;">Care+ | Portal ${data.portalName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px;">
            <h2 style="margin:0 0 20px;color:#1f2937;font-size:22px;">Redefinição de senha</h2>
            <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
              Olá, <strong>${this.escapeHtml(data.name)}</strong>!
            </p>
            <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${data.resetUrl}" style="display:inline-block;background-color:#2563eb;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px;">
                Redefinir minha senha
              </a>
            </div>
            <p style="margin:20px 0 0;color:#6b7280;font-size:14px;line-height:1.6;">
              Este link é válido por <strong>1 hora</strong>. Após esse prazo, você precisará fazer uma nova solicitação.
            </p>
            <p style="margin:16px 0 0;color:#6b7280;font-size:14px;line-height:1.6;">
              Se você não solicitou a redefinição, ignore este email. Sua senha permanece a mesma.
            </p>
            <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              Ou copie e cole este link: <span style="color:#2563eb;word-break:break-all;">${data.resetUrl}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:11px;">
              © ${new Date().getFullYear()} Relm Bikes. Este é um email automático, não responda.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Garantia</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                RELM BIKES
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">Care+ | Sistema de Garantias</p>
                        </td>
                    </tr>

                    <!-- Warning Icon -->
                    <tr>
                        <td style="padding: 40px 30px 20px; text-align: center;">
                            <div style="width: 80px; height: 80px; margin: 0 auto; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 48px; color: white;">!</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px 30px;">
                            <h2 style="margin: 0 0 20px; color: #ef4444; font-size: 24px; text-align: center;">
                                Solicitação Negada
                            </h2>
                            
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Olá, <strong>${this.escapeHtml(data.customerName)}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                                Informamos que sua solicitação de garantia <strong>não pôde ser aprovada</strong> neste momento.
                            </p>

                            <!-- Warranty Details -->
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
                                <h3 style="margin: 0 0 15px; color: #991b1b; font-size: 18px;">Informações da Solicitação</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Protocolo:</td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">
                                            ${this.escapeHtml(data.protocolNumber)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Produto:</td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">
                                            ${this.escapeHtml(data.productModel)}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Rejection Reason -->
                            <div style="background-color: #fffbeb; border: 1px solid #fbbf24; padding: 20px; margin: 20px 0; border-radius: 8px;">
                                <h3 style="margin: 0 0 15px; color: #92400e; font-size: 16px;">⚠️ Motivo da Negativa</h3>
                                <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                                    ${this.escapeHtml(data.rejectionReason)}
                                </p>
                            </div>

                            <!-- Contact Info -->
                            <div style="background-color: #eff6ff; padding: 20px; margin: 30px 0; border-radius: 8px; border: 1px solid #bfdbfe;">
                                <h3 style="margin: 0 0 15px; color: #1e40af; font-size: 16px;">💬 Precisa de Ajuda?</h3>
                                <p style="margin: 0 0 10px; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    Nossa equipe está pronta para esclarecer suas dúvidas e auxiliar no processo:
                                </p>
                                <p style="margin: 0; color: #2563eb; font-size: 14px;">
                                    📧 garantias@relmbikes.com.br<br>
                                    📱 WhatsApp: (11) 99999-9999<br>
                                    🕒 Seg-Sex: 9h às 18h
                                </p>
                            </div>

                            <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
                                <strong>Importante:</strong> Você pode enviar uma nova solicitação após corrigir as pendências mencionadas.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px;">
                                © ${new Date().getFullYear()} Relm Bikes. Todos os direitos reservados.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                                Este é um email automático do sistema Relm Care+. Por favor, não responda.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
  }
}
