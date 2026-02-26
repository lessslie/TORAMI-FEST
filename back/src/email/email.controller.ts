import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiTags, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class SendTestEmailDto {
  @ApiProperty({ example: 'agata.morales92@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  to!: string;
}

@ApiTags('email-test')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-test')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Send a test slot available notification
   * Example: POST /api/v1/email-test/slot-notification
   * Body: { "to": "agata.morales92@gmail.com" }
   */
  @Post('slot-notification')
  async sendTestSlotNotification(@Body() dto: SendTestEmailDto) {
    try {
      const result = await this.emailService.sendTestSlotNotification(dto.to);
      return {
        success: true,
        message: `Email de prueba enviado a ${dto.to}`,
        result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error enviando email',
        error: error.toString(),
      };
    }
  }
}
