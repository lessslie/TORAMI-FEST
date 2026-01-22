import { Module } from '@nestjs/common';
import { KaraokeController } from './karaoke.controller';
import { KaraokeService } from './karaoke.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KaraokeController],
  providers: [KaraokeService],
  exports: [KaraokeService],
})
export class KaraokeModule {}
