import { Module } from '@nestjs/common';
import { CosplayService } from './cosplay.service';
import { CosplayController } from './cosplay.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CosplayController],
  providers: [CosplayService],
})
export class CosplayModule {}
