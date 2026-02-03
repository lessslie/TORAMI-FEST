import { Module } from '@nestjs/common';
import { KaraokeController } from './karaoke.controller';
import { KaraokeService } from './karaoke.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [KaraokeController],
  providers: [KaraokeService],
  exports: [KaraokeService],
})
export class KaraokeModule {}
