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

  async findAll() {
    return this.prisma.cosplayGuest.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
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
    // Get all assigned numbers
    const assignedGuests = await this.prisma.cosplayGuest.findMany({
      where: {
        status: {
          in: [CosplayStatus.INSCRIPTO, CosplayStatus.CONFIRMADO],
        },
      },
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
}
