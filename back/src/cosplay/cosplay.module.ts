import { Module } from '@nestjs/common';
import { CosplayService } from './cosplay.service';
import { CosplayController } from './cosplay.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [CosplayController],
  providers: [CosplayService],
})
export class CosplayModule {}
