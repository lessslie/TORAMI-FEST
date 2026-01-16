import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send notification to waiting list when a cosplay slot becomes available
   */
  async sendSlotAvailableNotification(emails: string[], availableSlots: number, totalSlots: number) {
    if (emails.length === 0) {
      return;
    }

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inscriptionUrl = `${appUrl}/cosplay-contest`;

    try {
      // Send individual emails to each person on the waiting list using SendGrid
      const emailPromises = emails.map(email =>
        this.mailerService.sendMail({
          to: email,
          from: process.env.MAIL_FROM || 'Torami Fest <leslie92.dev@gmail.com>',
          subject: '🎉 ¡Se liberó un cupo para el Concurso de Cosplay!',
          html: this.getSlotAvailableEmailTemplate(availableSlots, totalSlots, inscriptionUrl),
        })
      );

      const results = await Promise.allSettled(emailPromises);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;


      return { successful, failed };
    } catch (error) {
      console.error('❌ Error sending slot available emails:', error);
      throw error;
    }
  }

  /**
   * Email template for slot availability notification
   */
  private getSlotAvailableEmailTemplate(availableSlots: number, totalSlots: number, inscriptionUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cupo Disponible - Torami Fest</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 3px solid #000000; box-shadow: 8px 8px 0px #000000;">

                <!-- Header -->
                <tr>
                  <td style="background-color: #DC143C; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; text-transform: uppercase;">
                      🎉 Torami Fest
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">
                      Concurso de Cosplay
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #DC143C; font-size: 24px; font-weight: bold;">
                      ¡Buenas noticias!
                    </h2>
                    <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      Se liberó un cupo en el <strong>Concurso de Cosplay de Torami Fest</strong>.
                    </p>
                    <div style="background-color: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
                      <p style="margin: 0; color: #856404; font-size: 16px; font-weight: bold;">
                        Actualmente hay <span style="color: #DC143C; font-size: 20px;">${availableSlots}</span> cupo${availableSlots === 1 ? '' : 's'} disponible${availableSlots === 1 ? '' : 's'} de ${totalSlots}.
                      </p>
                    </div>
                    <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      ⏰ <strong>Apurate para inscribirte antes que se agoten nuevamente!</strong>
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${inscriptionUrl}" style="display: inline-block; background-color: #DC143C; color: #ffffff; text-decoration: none; padding: 15px 40px; font-size: 18px; font-weight: bold; border: 3px solid #000000; box-shadow: 4px 4px 0px #000000; text-transform: uppercase;">
                            ➡️ INSCRIBIRME AHORA
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 30px 0 10px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                      ¡Te esperamos! 🎭
                    </p>
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong>Equipo Torami Fest</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #000000; padding: 20px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;">
                      PD: También seguí nuestras redes sociales para más novedades.
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      Este email fue enviado porque te anotaste en la lista de espera del Concurso de Cosplay.
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

  /**
   * Test email sending (for debugging)
   */
  async sendTestEmail(to: string) {
    try {
      const result = await this.mailerService.sendMail({
        to,
        from: process.env.MAIL_FROM || 'Torami Fest <leslie92.dev@gmail.com>',
        subject: 'Test Email - Torami Fest',
        html: '<h1>Test Email</h1><p>If you received this, email service is working correctly!</p>',
      });

      return result;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }

  /**
   * Send a test slot available notification (for preview)
   */
  async sendTestSlotNotification(to: string) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inscriptionUrl = `${appUrl}/cosplay-contest`;

    try {
      const result = await this.mailerService.sendMail({
        to,
        from: process.env.MAIL_FROM || 'Torami Fest <leslie92.dev@gmail.com>',
        subject: '🎉 ¡Se liberó un cupo para el Concurso de Cosplay!',
        html: this.getSlotAvailableEmailTemplate(5, 20, inscriptionUrl),
      });

      return result;
    } catch (error) {
      console.error('Error sending test slot notification:', error);
      throw error;
    }
  }
}
