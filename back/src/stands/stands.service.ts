import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStandDto } from './dto/create-stand.dto';
import { UpdateStandStatusDto } from './dto/update-stand-status.dto';
import { StandStatus } from '@prisma/client';

@Injectable()
export class StandsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as StandStatus } : {};

    const [stands, total] = await Promise.all([
      this.prisma.standApplication.findMany({
        take: limit,
        skip,
        where,
        select: {
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
          event: true,
        },
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
    const existingApplication = await this.prisma.standApplication.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        status: {
          not: StandStatus.RECHAZADA,
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
      },
    });
  }

  async updateStatus(id: string, dto: UpdateStandStatusDto) {
    return this.prisma.standApplication.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async delete(id: string) {
    return this.prisma.standApplication.delete({
      where: { id },
    });
  }

  async findAllForExport(limit: number = 1000) {
    return this.prisma.standApplication.findMany({
      take: limit,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
