import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCosplayDto } from './dto/create-cosplay.dto';
import { UpdateCosplayStatusDto } from './dto/update-cosplay-status.dto';
import { CosplayAddMessageDto } from './dto/add-message.dto';
import { CosplayStatus } from '@prisma/client';

@Injectable()
export class CosplayService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cosplayRegistration.findMany();
  }

  findByUser(userId: string) {
    return this.prisma.cosplayRegistration.findMany({ where: { userId } });
  }

  create(userId: string, dto: CreateCosplayDto) {
    return this.prisma.cosplayRegistration.create({
      data: {
        ...dto,
        userId,
        status: dto.status ?? CosplayStatus.INSCRIPTO,
        messages: [],
      },
    });
  }

  updateStatus(id: string, dto: UpdateCosplayStatusDto) {
    return this.prisma.cosplayRegistration.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async addMessage(id: string, dto: CosplayAddMessageDto, requesterId: string, requesterRole: string) {
    const item = await this.prisma.cosplayRegistration.findUnique({ where: { id } });
    if (!item) throw new ForbiddenException('Cosplay not found');
    if (dto.sender === 'USER' && item.userId !== requesterId) throw new ForbiddenException();
    const updatedMessages = [
      ...(item.messages as any[]),
      { id: Date.now().toString(), ...dto, timestamp: new Date().toISOString() },
    ];
    return this.prisma.cosplayRegistration.update({
      where: { id },
      data: { messages: updatedMessages },
    });
  }
}
