import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateCosplayGuestDto } from './dto/create-cosplay-guest.dto';
import { WithdrawCosplayGuestDto } from './dto/withdraw-cosplay-guest.dto';
import { CosplayStatus } from '@prisma/client';

@Injectable()
export class CosplayGuestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // Obtener límite desde el caché de ConfigService
  private async getGuestLimit(): Promise<number> {
    const limits = await this.configService.getLimits();
    return limits.cosplayGuestLimit;
  }

  async findAll(page: number = 1, limit: number = 20) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.cosplayGuest.findMany({
        select: {
          id: true,
          userId: true,
          participantName: true,
          nickname: true,
          whatsapp: true,
          instagram: true,
          website: true,
          characterName: true,
          seriesName: true,
          category: true,
          status: true,
          assignedNumber: true,
          withdrawalReason: true,
          eventId: true,
          createdAt: true,
          updatedAt: true,
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
              location: true,
            },
          },
        },
        skip,
        take: safeLimit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.cosplayGuest.count(),
    ]);

    return {
      data: items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: string) {
    const guest = await this.prisma.cosplayGuest.findUnique({
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

    if (!guest) {
      throw new NotFoundException('Cosplay guest not found');
    }

    return guest;
  }

  async findByUser(userId: string) {
    return this.prisma.cosplayGuest.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        participantName: true,
        nickname: true,
        whatsapp: true,
        instagram: true,
        website: true,
        characterName: true,
        seriesName: true,
        category: true,
        status: true,
        assignedNumber: true,
        withdrawalReason: true,
        eventId: true,
        createdAt: true,
        updatedAt: true,
        event: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAvailableSlots() {
    const limit = await this.getGuestLimit();

    const activeCount = await this.prisma.cosplayGuest.count({
      where: {
        status: {
          in: [CosplayStatus.INSCRIPTO, CosplayStatus.CONFIRMADO],
        },
      },
    });

    return {
      available: Math.max(0, limit - activeCount),
      limit,
      occupied: activeCount,
    };
  }

  // Find the next available number (1 hasta el límite configurado)
  private async findNextAvailableNumber(): Promise<number> {
    const limit = await this.getGuestLimit();

    // Get ALL assigned numbers (including RECHAZADO) since assignedNumber has @unique constraint
    // This prevents trying to assign a number that's already taken by a rejected guest
    const assignedGuests = await this.prisma.cosplayGuest.findMany({
      select: {
        assignedNumber: true,
      },
      // No necesitamos orderBy ya que usamos Set
    });

    // Usar Set para búsqueda O(1) en lugar de includes() O(n)
    const assignedNumbers = new Set(assignedGuests.map((g) => g.assignedNumber));

    // Find first available number from 1 to limit
    for (let i = 1; i <= limit; i++) {
      if (!assignedNumbers.has(i)) {
        return i;
      }
    }

    throw new BadRequestException('No hay cupos disponibles');
  }

  async create(userId: string, dto: CreateCosplayGuestDto) {
    // Check if user is already registered for this event
    const existingRegistration = await this.prisma.cosplayGuest.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        status: {
          not: CosplayStatus.RECHAZADO, // Allow re-registration if previously rejected
        },
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('Ya estás inscrito como cosplay invitado para este evento.');
    }

    // Check slots availability
    const slots = await this.getAvailableSlots();
    if (slots.available <= 0) {
      throw new BadRequestException('No hay cupos disponibles');
    }

    // Find next available number
    const assignedNumber = await this.findNextAvailableNumber();

    return this.prisma.cosplayGuest.create({
      data: {
        ...dto,
        nickname: dto.nickname || '',
        referenceImage: dto.referenceImage || '',
        userId,
        assignedNumber,
        status: CosplayStatus.INSCRIPTO,
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
      },
    });
  }

  async withdraw(id: string, userId: string, dto: WithdrawCosplayGuestDto) {
    const guest = await this.findOne(id);

    // Verify ownership
    if (guest.userId !== userId) {
      throw new NotFoundException('Cosplay guest not found');
    }

    // Delete the registration (frees up the number)
    return this.prisma.cosplayGuest.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: CosplayStatus) {
    // Just update the status (same flow as Cosplay Concurso and Stand)
    // Deletion is handled separately by the delete endpoint
    return this.prisma.cosplayGuest.update({
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

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.cosplayGuest.delete({
      where: { id },
    });
  }

  // Obtener todos los registros para exportación (con límite de seguridad)
  async findAllForExport(limit: number = 1000) {
    return this.prisma.cosplayGuest.findMany({
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { assignedNumber: 'asc' },
    });
  }
}
