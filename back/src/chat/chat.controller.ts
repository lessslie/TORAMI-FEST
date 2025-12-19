import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body() chatDto: ChatMessageDto) {
    const reply = await this.chatService.chat(chatDto);
    return { reply };
  }
}
