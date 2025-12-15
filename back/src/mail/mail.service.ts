import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService, private readonly config: ConfigService) {}

  async sendWelcomeEmail(to: string, name?: string) {
    const appName = this.config.get<string>('APP_NAME') || 'Torami Fest';
    const subject = `Bienvenido a ${appName}`;
    const safeName = name || 'Hola!';

    const html = `
      <div style="font-family: 'Trebuchet MS', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 0; background: #050914; color: #e9ecf5;">
        <div style="background: linear-gradient(120deg, #ff4d6d 0%, #7c3aed 45%, #22d3ee 100%); height: 10px; border-radius: 12px 12px 0 0;"></div>
        <div style="padding: 28px 26px 30px; background: radial-gradient(circle at 20% 20%, rgba(124,58,237,0.22), transparent 38%), radial-gradient(circle at 80% 10%, rgba(34,211,238,0.2), transparent 34%), #0b1327; border: 1px solid #1f2b4d; border-top: 0; border-radius: 0 0 12px 12px; box-shadow: 0 12px 28px rgba(0,0,0,0.35);">
          <div style="display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 999px; color: #c8d4ff; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">
            <span style="display: inline-block; width: 8px; height: 8px; background: #22d3ee; border-radius: 50%; box-shadow: 0 0 12px #22d3ee;"></span>
            <span>Festival Anime</span>
          </div>
          <h1 style="margin: 14px 0 6px; font-size: 28px; color: #22d3ee; letter-spacing: 0.01em;">${appName}</h1>
          <p style="margin: 0 0 14px; font-size: 16px; line-height: 1.6; color: #f4f7ff;">
            ${safeName}, gracias por unirte a ${appName}.
          </p>
          <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #c8d4ff;">
            Ya est\u00e1s dentro. Explora eventos, stands, cosplay y todas las actividades del festival desde tu cuenta.
          </p>
          <div style="margin: 18px 0; padding: 14px 16px; background: linear-gradient(135deg, rgba(34,211,238,0.12), rgba(124,58,237,0.12)); border: 1px solid rgba(124,58,237,0.35); border-radius: 10px; color: #dbeafe;">
            <strong style="color: #7dd3fc;">Tip r\u00e1pido:</strong> Guarda este correo y completa tu perfil para recibir avisos y recompensas.
          </div>
          <a href="#" style="display: inline-block; margin: 4px 0 10px; padding: 12px 16px; background: linear-gradient(120deg, #ff4d6d, #f97316 45%, #22d3ee); color: #0b1327; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 10px 25px rgba(255,77,109,0.35);">
            Explorar Torami Fest
          </a>
          <p style="margin: 16px 0 0; font-size: 14px; color: #9fb2ff;">Nos vemos muy pronto.</p>
        </div>
      </div>
    `;

    try {
      await this.mailer.sendMail({
        to,
        subject,
        html,
      });
    } catch (error) {
      // No bloqueamos el registro por fallos de email, solo lo registramos
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo enviar email de bienvenida a ${to}: ${message}`);
    }
  }
}
