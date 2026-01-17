import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCosplayGuestDto } from './dto/create-cosplay-guest.dto';
import { WithdrawCosplayGuestDto } from './dto/withdraw-cosplay-guest.dto';
import { CosplayStatus } from '@prisma/client';

@Injectable()
export class CosplayGuestService {
  private readonly GUEST_LIMIT = 30;

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20, includeMessages: boolean = false) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
    const skip = (safePage - 1) * safeLimit;

    const baseSelect: any = {
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
    };

    if (includeMessages) {
      baseSelect.messages = true;
    }

    const [items, total] = await Promise.all([
      this.prisma.cosplayGuest.findMany({
        select: baseSelect,
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

  async findByUser(userId: string, includeMessages: boolean = false) {
    const baseSelect: any = {
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
    };

    if (includeMessages) {
      baseSelect.messages = true;
    }

    return this.prisma.cosplayGuest.findMany({
      where: { userId },
      select: baseSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getAvailableSlots() {
    const activeCount = await this.prisma.cosplayGuest.count({
      where: {
        status: {
          in: [CosplayStatus.INSCRIPTO, CosplayStatus.CONFIRMADO],
        },
      },
    });

    return {
      available: Math.max(0, this.GUEST_LIMIT - activeCount),
      limit: this.GUEST_LIMIT,
      occupied: activeCount,
    };
  }

  // Find the next available number (1-30)
  private async findNextAvailableNumber(): Promise<number> {
    // Get ALL assigned numbers (including RECHAZADO) since assignedNumber has @unique constraint
    // This prevents trying to assign a number that's already taken by a rejected guest
    const assignedGuests = await this.prisma.cosplayGuest.findMany({
      select: {
        assignedNumber: true,
      },
      orderBy: {
        assignedNumber: 'asc',
      },
    });

    const assignedNumbers = assignedGuests.map((g) => g.assignedNumber);

    // Find first available number from 1 to 30
    for (let i = 1; i <= this.GUEST_LIMIT; i++) {
      if (!assignedNumbers.includes(i)) {
        return i;
      }
    }

    throw new BadRequestException('No hay cupos disponibles');
  }

  async create(userId: string, dto: CreateCosplayGuestDto) {
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
    const guest = await this.findOne(id);
    return this.prisma.cosplayGuest.delete({
      where: { id },
    });
  }

  async addMessage(id: string, message: any) {
    const guest = await this.findOne(id);
    const messages = Array.isArray(guest.messages) ? guest.messages : [];

    return this.prisma.cosplayGuest.update({
      where: { id },
      data: {
        messages: [...messages, message],
      },
    });
  }

  async getMessages(id: string) {
    const guest = await this.prisma.cosplayGuest.findUnique({
      where: { id },
      select: { messages: true },
    });

    if (!guest) {
      throw new NotFoundException('Cosplay guest not found');
    }

    return { messages: Array.isArray(guest.messages) ? guest.messages : [] };
  }
}
