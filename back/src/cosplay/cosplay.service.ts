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
    return this.prisma.cosplayRegistration.findMany({
      include: {
        event: true,
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.cosplayRegistration.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
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

    // Create notification when admin sends message to user
    if (dto.sender === 'ADMIN') {
      await this.prisma.notification.create({
        data: {
          userId: item.userId,
          title: 'Nuevo mensaje sobre tu inscripción al concurso',
          message: `Recibiste un mensaje sobre "${item.characterName}"`,
          type: 'CHAT_COSPLAY',
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
              title: 'Nuevo mensaje de participante',
              message: `${item.participantName} te envió un mensaje sobre su cosplay "${item.characterName}"`,
              type: 'CHAT_COSPLAY',
              link: '/admin',
            },
          })
        )
      );
    }

    return this.prisma.cosplayRegistration.update({
      where: { id },
      data: { messages: updatedMessages },
    });
  }
}
