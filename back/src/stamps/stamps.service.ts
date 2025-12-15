import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Códigos válidos según el frontend
const VALID_CODES = {
  'TORAMI-MAIN': 'stage',
  'TORAMI-GAME': 'gaming',
  'TORAMI-FOOD': 'food',
  'TORAMI-SHOP': 'merch',
};

@Injectable()
export class StampsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateAndCollect(code: string, userId: string) {
    // Verificar si el código es válido
    const stampType = VALID_CODES[code];
    if (!stampType) {
      throw new BadRequestException('Invalid stamp code');
    }

    // Verificar si el usuario ya tiene este sello
    const existing = await this.prisma.stamp.findFirst({
      where: {
        code,
        userId,
      },
    });

    if (existing) {
      throw new BadRequestException('You already have this stamp');
    }

    // Crear el nuevo sello
    const stamp = await this.prisma.stamp.create({
      data: {
        code,
        type: stampType,
        userId,
      },
    });

    // Obtener todos los sellos del usuario
    const userStamps = await this.getUserStamps(userId);

    return {
      stamp,
      message: 'Stamp collected successfully!',
      total: userStamps.length,
      collected: userStamps,
    };
  }

  async getUserStamps(userId: string) {
    return this.prisma.stamp.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllStamps() {
    return this.prisma.stamp.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStampStats() {
    const total = await this.prisma.stamp.count();
    const byType = await this.prisma.stamp.groupBy({
      by: ['type'],
      _count: true,
    });

    const usersWithStamps = await this.prisma.user.findMany({
      where: {
        stamps: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            stamps: true,
          },
        },
      },
      orderBy: {
        stamps: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return {
      total,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count,
      })),
      topCollectors: usersWithStamps,
    };
  }

  async deleteStamp(id: string) {
    const stamp = await this.prisma.stamp.findUnique({
      where: { id },
    });

    if (!stamp) {
      throw new NotFoundException('Stamp not found');
    }

    return this.prisma.stamp.delete({ where: { id } });
  }
}
