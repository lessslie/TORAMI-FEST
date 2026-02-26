import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // A4: Límite estricto en chat para proteger costos de Gemini API
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  async sendMessage(@Body() chatDto: ChatMessageDto) {
    const reply = await this.chatService.chat(chatDto);
    return { reply };
  }
}
