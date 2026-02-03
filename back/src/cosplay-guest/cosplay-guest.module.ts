import { Module } from '@nestjs/common';
import { CosplayGuestService } from './cosplay-guest.service';
import { CosplayGuestController } from './cosplay-guest.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [CosplayGuestController],
  providers: [CosplayGuestService],
  exports: [CosplayGuestService],
})
export class CosplayGuestModule {}
