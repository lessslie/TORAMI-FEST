import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStandDto } from './dto/create-stand.dto';
import { UpdateStandStatusDto } from './dto/update-stand-status.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { StandStatus } from '@prisma/client';

@Injectable()
export class StandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20, status?: string, includeMessages: boolean = false) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as StandStatus } : {};

    const selectFields: any = {
      id: true,
      brandName: true,
      type: true,
      status: true,
      contactName: true,
      email: true,
      phone: true,
      socials: true,
      description: true,
      needs: true,
      images: true,
      userId: true,
      createdAt: true,
      eventId: true,
      event: true, // Always include event information
    };

    // Include messages if requested (for admin chat)
    if (includeMessages) {
      selectFields.messages = true;
    }

    const [stands, total] = await Promise.all([
      this.prisma.standApplication.findMany({
        take: limit,
        skip,
        where,
        select: selectFields,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.standApplication.count({ where })
    ]);

    return {
      data: stands,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  findByUser(userId: string) {
    return this.prisma.standApplication.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  }

  // Método para obtener detalle completo de un stand
  findOne(id: string) {
    return this.prisma.standApplication.findUnique({
      where: { id },
      include: {
        event: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async create(userId: string, dto: CreateStandDto) {
    // Check if user already has a stand application for this event
    const existingApplication = await this.prisma.standApplication.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        status: {
          not: StandStatus.RECHAZADA, // Allow re-application if previously rejected
        },
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Ya tenés una solicitud de stand para este evento.');
    }

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
          link: `/dashboard?tab=stands&chat=${id}`,
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
              link: `/admin?tab=stands&chat=${id}`,
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

  async delete(id: string) {
    return this.prisma.standApplication.delete({
      where: { id },
    });
  }
}
