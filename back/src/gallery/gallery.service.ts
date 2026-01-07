import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { ModerateGalleryItemDto } from './dto/moderate-gallery-item.dto';
import { GalleryStatus } from '@prisma/client';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20, eventId?: string, status?: string, isOfficial?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (status) {
      where.status = status as GalleryStatus;
    }

    if (isOfficial !== undefined) {
      where.isOfficial = isOfficial;
    }

    const [items, total] = await Promise.all([
      this.prisma.galleryItem.findMany({
        take: limit,
        skip,
        where,
        select: {
          id: true,
          url: true,
          description: true,
          approved: true,
          status: true,
          isOfficial: true,
          createdAt: true,
          eventId: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
            },
          },
          // NO incluir feedback (solo en detalle)
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.galleryItem.count({ where })
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.galleryItem.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }

    return item;
  }

  async create(userId: string, data: CreateGalleryItemDto) {
    return this.prisma.galleryItem.create({
      data: {
        ...data,
        userId,
        approved: false,
        status: GalleryStatus.PENDING,
        isOfficial: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  async createOfficial(userId: string, data: CreateGalleryItemDto) {
    return this.prisma.galleryItem.create({
      data: {
        ...data,
        userId,
        approved: true,
        status: GalleryStatus.APPROVED,
        isOfficial: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  async moderate(id: string, data: ModerateGalleryItemDto) {
    const item = await this.findOne(id);

    return this.prisma.galleryItem.update({
      where: { id },
      data: {
        status: data.status,
        approved: data.status === GalleryStatus.APPROVED,
        feedback: data.feedback,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  async update(id: string, userId: string, description: string) {
    const item = await this.findOne(id);

    // Verify the user owns this photo
    if (item.userId !== userId) {
      throw new NotFoundException('Gallery item not found');
    }

    return this.prisma.galleryItem.update({
      where: { id },
      data: {
        description,
        status: GalleryStatus.PENDING,
        approved: false,
        feedback: null, // Clear previous rejection feedback
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  async delete(id: string) {
    const item = await this.findOne(id);
    return this.prisma.galleryItem.delete({ where: { id } });
  }
}
