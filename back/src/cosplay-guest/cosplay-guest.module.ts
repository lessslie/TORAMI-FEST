import { Module } from '@nestjs/common';
import { CosplayGuestService } from './cosplay-guest.service';
import { CosplayGuestController } from './cosplay-guest.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CosplayGuestController],
  providers: [CosplayGuestService],
  exports: [CosplayGuestService],
})
export class CosplayGuestModule {}
