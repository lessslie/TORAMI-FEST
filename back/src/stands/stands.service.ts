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
    return this.prisma.standApplication.findMany({
      include: {
        event: true,
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.standApplication.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
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

    // Create notification when admin sends message to user
    if (dto.sender === 'ADMIN') {
      await this.prisma.notification.create({
        data: {
          userId: stand.userId,
          title: 'Nuevo mensaje sobre tu stand',
          message: `Recibiste un mensaje sobre "${stand.brandName}"`,
          type: 'CHAT_STAND',
          link: '/dashboard',
        },
      });
    }

    // Create notification for ALL admins when user sends message
    if (dto.sender === 'USER') {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        },
        select: { id: true },
      });

      // Create notification for each admin
      await Promise.all(
        admins.map((admin) =>
          this.prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'Nuevo mensaje de usuario',
              message: `${stand.contactName} te envió un mensaje sobre su stand "${stand.brandName}"`,
              type: 'CHAT_STAND',
              link: '/admin',
            },
          })
        )
      );
    }

    return this.prisma.standApplication.update({
      where: { id },
      data: { messages: updatedMessages },
    });
  }
}
