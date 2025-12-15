import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStandDto } from './dto/create-stand.dto';
import { UpdateStandStatusDto } from './dto/update-stand-status.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { StandStatus } from '@prisma/client';

@Injectable()
export class StandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.standApplication.findMany();
  }

  findByUser(userId: string) {
    return this.prisma.standApplication.findMany({ where: { userId } });
  }

  async create(userId: string, dto: CreateStandDto) {
    return this.prisma.standApplication.create({
      data: {
        ...dto,
        userId,
        images: dto.images || [],
        status: StandStatus.PENDIENTE,
        messages: [],
      },
    });
  }

  async updateStatus(id: string, dto: UpdateStandStatusDto) {
    return this.prisma.standApplication.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async addMessage(id: string, dto: AddMessageDto, requesterId: string, requesterRole: string) {
    const stand = await this.prisma.standApplication.findUnique({ where: { id } });
    if (!stand) throw new ForbiddenException('Stand not found');
    if (dto.sender === 'USER' && stand.userId !== requesterId) {
      throw new ForbiddenException('Cannot message on another user stand');
    }
    const updatedMessages = [
      ...(stand.messages as any[]),
      { id: Date.now().toString(), ...dto, timestamp: new Date().toISOString() },
    ];
    return this.prisma.standApplication.update({
      where: { id },
      data: { messages: updatedMessages },
    });
  }
}
