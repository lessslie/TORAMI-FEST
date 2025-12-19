import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { EventsModule } from '../events/events.module';
import { SponsorsModule } from '../sponsors/sponsors.module';

@Module({
  imports: [EventsModule, SponsorsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
