import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('SMTP_HOST');
        const port = Number(config.get<string>('SMTP_PORT')) || 587;
        const user = config.get<string>('SMTP_USER');
        const pass = config.get<string>('SMTP_PASSWORD');

        return {
          transport: {
            host,
            port,
            secure: config.get<string>('SMTP_SECURE') === 'true' || port === 465,
            auth: {
              user,
              pass,
            },
          },
          defaults: {
            from: config.get<string>('MAIL_FROM') || 'no-reply@localhost',
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
