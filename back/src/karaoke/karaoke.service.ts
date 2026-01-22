import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateKaraokeDto } from './dto/create-karaoke.dto';
import { KaraokeStatus } from '@prisma/client';

@Injectable()
export class KaraokeService {
  private readonly KARAOKE_LIMIT = 12;

  constructor(private readonly prisma: PrismaService) {}

  async findAll(eventId?: string) {
    return this.prisma.karaoke.findMany({
      where: eventId ? { eventId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const karaoke = await this.prisma.karaoke.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: true,
      },
    });

    if (!karaoke) {
      throw new NotFoundException('Inscripción de karaoke no encontrada');
    }

    return karaoke;
  }

  async findByUser(userId: string) {
    return this.prisma.karaoke.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAvailableSlots(eventId: string) {
    const approvedCount = await this.prisma.karaoke.count({
      where: {
        eventId,
        status: KaraokeStatus.APROBADO,
      },
    });

    return {
      available: Math.max(0, this.KARAOKE_LIMIT - approvedCount),
      limit: this.KARAOKE_LIMIT,
      occupied: approvedCount,
    };
  }

  async create(userId: string, dto: CreateKaraokeDto) {
    // Verificar que el evento existe
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });

    if (!event) {
      throw new BadRequestException('Evento no encontrado');
    }

    // Verificar si el usuario ya está inscrito en este evento
    const existingRegistration = await this.prisma.karaoke.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('Ya estás inscrito en el karaoke de este evento');
    }

    return this.prisma.karaoke.create({
      data: {
        ...dto,
        userId,
        status: KaraokeStatus.PENDIENTE,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: KaraokeStatus) {
    const karaoke = await this.findOne(id);

    // Si se aprueba, verificar cupos y asignar número
    if (status === KaraokeStatus.APROBADO) {
      const slots = await this.getAvailableSlots(karaoke.eventId);
      if (slots.available <= 0) {
        throw new BadRequestException('No hay cupos disponibles para este evento');
      }

      // Asignar el siguiente número disponible
      const assignedNumber = await this.findNextAvailableNumber(karaoke.eventId);

      return this.prisma.karaoke.update({
        where: { id },
        data: {
          status,
          assignedNumber,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          event: true,
        },
      });
    }

    // Si se rechaza, quitar el número asignado
    if (status === KaraokeStatus.RECHAZADO) {
      return this.prisma.karaoke.update({
        where: { id },
        data: {
          status,
          assignedNumber: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          event: true,
        },
      });
    }

    return this.prisma.karaoke.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  private async findNextAvailableNumber(eventId: string): Promise<number> {
    const approvedKaraokes = await this.prisma.karaoke.findMany({
      where: {
        eventId,
        status: KaraokeStatus.APROBADO,
      },
      select: {
        assignedNumber: true,
      },
      orderBy: {
        assignedNumber: 'asc',
      },
    });

    const assignedNumbers = approvedKaraokes
      .map((k) => k.assignedNumber)
      .filter((n): n is number => n !== null);

    for (let i = 1; i <= this.KARAOKE_LIMIT; i++) {
      if (!assignedNumbers.includes(i)) {
        return i;
      }
    }

    throw new BadRequestException('No hay cupos disponibles');
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.karaoke.delete({
      where: { id },
    });
  }

  async withdraw(id: string, userId: string) {
    const karaoke = await this.findOne(id);

    if (karaoke.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta inscripción');
    }

    return this.prisma.karaoke.delete({
      where: { id },
    });
  }
}
