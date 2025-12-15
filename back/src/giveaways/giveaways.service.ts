import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGiveawayDto } from './dto/create-giveaway.dto';
import { UpdateGiveawayDto } from './dto/update-giveaway.dto';
import { GiveawayStatus } from '@prisma/client';

@Injectable()
export class GiveawaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.giveaway.findMany({
      include: {
        participantIds: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const giveaway = await this.prisma.giveaway.findUnique({
      where: { id },
      include: {
        participantIds: {
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
        },
      },
    });

    if (!giveaway) {
      throw new NotFoundException('Giveaway not found');
    }

    return giveaway;
  }

  async create(data: CreateGiveawayDto) {
    return this.prisma.giveaway.create({
      data: {
        ...data,
        images: data.images || [],
        status: GiveawayStatus.ACTIVO,
      },
      include: {
        participantIds: {
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
        },
      },
    });
  }

  async update(id: string, data: UpdateGiveawayDto) {
    await this.findOne(id);

    return this.prisma.giveaway.update({
      where: { id },
      data,
      include: {
        participantIds: {
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
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.giveaway.delete({ where: { id } });
  }

  async participate(giveawayId: string, userId: string) {
    const giveaway = await this.findOne(giveawayId);

    if (giveaway.status !== GiveawayStatus.ACTIVO) {
      throw new BadRequestException('This giveaway is not active');
    }

    // Check if already participating
    const existing = await this.prisma.giveawayParticipant.findUnique({
      where: {
        userId_giveawayId: {
          userId,
          giveawayId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Already participating in this giveaway');
    }

    await this.prisma.giveawayParticipant.create({
      data: {
        userId,
        giveawayId,
      },
    });

    return this.findOne(giveawayId);
  }

  async getUserGiveaways(userId: string) {
    return this.prisma.giveaway.findMany({
      where: {
        participantIds: {
          some: {
            userId,
          },
        },
      },
      include: {
        participantIds: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
